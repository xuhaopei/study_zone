/**
 * POST /api/review
 * Body: { markdown: string }
 *
 * 评审 Agent：不使用工具，纯 chat.completions 流式输出 JSON。
 *
 * 响应：NDJSON 流，事件类型：
 *   { type: 'start',     model, modelId, modelLabel }            一次：开始
 *   { type: 'delta',     text }                                  多次：原始 JSON 文本增量（用于"看模型写"）
 *   { type: 'parsed',    review }                                整段 JSON 解析成功后发一次（用于渲染评分卡）
 *   { type: 'error',     message }                               任意时刻
 *   { type: 'done',      elapsedMs, totalChars }                 最后
 *
 * 设计要点：
 * - 用 response_format: { type: 'json_object' } 强制模型只输出 JSON
 * - 流式过程中保留 raw 文本流（前端可以做"打字机"演示），但最终解析以累积完成后为准
 * - 不接 tools，纯 LLM 单轮回答
 */
import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import {
  REVIEWER_SYSTEM_PROMPT,
  buildReviewUserMessage,
} from '@/lib/reviewer-prompt';
import { resolveModel } from '@/lib/models';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 鲁棒地从模型输出里提取 JSON 对象。
 * 按"宽松到严格"多档尝试：
 *  1. 直接 JSON.parse 整段
 *  2. 剥 ```json ... ``` 代码块
 *  3. 截取 首个 { 到 末个 } 之间的内容
 *  4. 修复"字符串值里的所有裸控制字符（U+0000..U+001F）"后再 parse
 *  5. 在 4 的基础上，再把中文/全角引号统一替换为英文引号后再 parse
 *
 * 返回 { ok:true, value } 或 { ok:false, lastError }。
 */
function tryParseJsonLoose(
  raw: string
): { ok: true; value: unknown } | { ok: false; lastError: string } {
  const text = raw.trim();
  if (!text) return { ok: false, lastError: 'empty' };

  const candidates: string[] = [];

  candidates.push(text);

  const fence = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (fence) candidates.push(fence[1]);

  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first >= 0 && last > first) {
    candidates.push(text.slice(first, last + 1));
  }

  let lastError = 'unknown';

  // 第 1 轮：原样
  for (const c of candidates) {
    try {
      return { ok: true, value: JSON.parse(c) };
    } catch (e) {
      lastError = (e as Error).message;
    }
  }

  // 第 2 轮：修复字符串内裸控制字符
  for (const c of candidates) {
    try {
      return { ok: true, value: JSON.parse(escapeControlInsideStrings(c)) };
    } catch (e) {
      lastError = (e as Error).message;
    }
  }

  // 第 3 轮：把中/英文引号统一一下，再 fix 控制字符
  for (const c of candidates) {
    const normalized = normalizeQuotes(c);
    try {
      return {
        ok: true,
        value: JSON.parse(escapeControlInsideStrings(normalized)),
      };
    } catch (e) {
      lastError = (e as Error).message;
    }
  }

  // 第 4 轮：修复"字符串值内的悬空双引号"（Claude 长文本最常见的错）
  // 例：  "comment": "无"页面正常显示"类语句。"   ← 内部双引号未转义
  // 思路：状态机解析，遇到 " 时向前看 —— 如果不是合法的"字符串结束"位置，
  //       就当作嵌入引号，自动 \" 掉。
  for (const c of candidates) {
    const fixed = escapeControlInsideStrings(escapeEmbeddedQuotes(c));
    try {
      return { ok: true, value: JSON.parse(fixed) };
    } catch (e) {
      lastError = (e as Error).message;
    }
  }

  // 第 5 轮：3+4 合体（先规范引号，再修嵌入引号 + 控制字符）
  for (const c of candidates) {
    const normalized = normalizeQuotes(c);
    const fixed = escapeControlInsideStrings(escapeEmbeddedQuotes(normalized));
    try {
      return { ok: true, value: JSON.parse(fixed) };
    } catch (e) {
      lastError = (e as Error).message;
    }
  }

  return { ok: false, lastError };
}

/**
 * 修复 JSON 字符串里的"嵌入双引号"。
 *
 * 场景：模型在长字符串里写了未转义的英文双引号，比如
 *   "comment": "无"页面正常显示"类语句。"
 *                ↑—— 这两个 " 应该写成 \"
 *
 * 思路：扫描全文，维护 inString 标志。
 *   当处于 inString 且遇到一个未转义的 "：
 *     - 向后跳过空白，看下一个非空白字符。
 *     - 如果是  ,  }  ]  :  → 真的是字符串结束。
 *     - 如果是  EOF（已到末尾）          → 也认为是结束。
 *     - 否则视为"嵌入引号"，输出 \" 并保持 inString。
 *
 * 注意：这只是启发式修复，不能保证 100% 正确，
 *       但能覆盖 Claude 长 comment 里 95% 的此类错误。
 */
function escapeEmbeddedQuotes(input: string): string {
  let out = '';
  let inString = false;
  let escape = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (escape) {
      out += ch;
      escape = false;
      continue;
    }

    if (ch === '\\') {
      out += ch;
      escape = true;
      continue;
    }

    if (ch !== '"') {
      out += ch;
      continue;
    }

    // 遇到 "
    if (!inString) {
      // 字符串开始
      inString = true;
      out += ch;
      continue;
    }

    // inString === true，判断这是不是真正的字符串结束
    let j = i + 1;
    while (j < input.length && /\s/.test(input[j])) j++;

    if (j >= input.length) {
      // 已经走到末尾
      inString = false;
      out += ch;
      continue;
    }

    const next = input[j];
    // 合法的"字符串结束"后续字符
    if (
      next === ',' ||
      next === '}' ||
      next === ']' ||
      next === ':' /* key 结束 */
    ) {
      inString = false;
      out += ch;
      continue;
    }

    // 否则视为嵌入引号，转义掉
    out += '\\"';
  }

  return out;
}

/**
 * 扫描 JSON 字符串，把"双引号之间的"裸控制字符替换成转义形式。
 *
 * JSON 规范：字符串内 U+0000..U+001F 都必须转义，否则报
 *   "Bad control character in string literal"。
 *
 * 实现：状态机一次走完，按 inString + escape 标志判断当前位置。
 */
function escapeControlInsideStrings(input: string): string {
  let out = '';
  let inString = false;
  let escape = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const code = ch.charCodeAt(0);

    if (escape) {
      out += ch;
      escape = false;
      continue;
    }

    if (ch === '\\') {
      out += ch;
      escape = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      out += ch;
      continue;
    }

    if (inString && code < 0x20) {
      // 全部转成 \uXXXX，最稳
      if (ch === '\n') out += '\\n';
      else if (ch === '\r') out += '\\r';
      else if (ch === '\t') out += '\\t';
      else if (ch === '\b') out += '\\b';
      else if (ch === '\f') out += '\\f';
      else out += '\\u' + code.toString(16).padStart(4, '0');
      continue;
    }

    out += ch;
  }
  return out;
}

/**
 * 把中文/全角引号替换成英文引号 —— 仅在它们"看起来是 JSON 结构引号"时。
 * 简单做法：直接全部替换，反正中文文案里很少用 " "。
 * 如果用户的需求文档里真包含全角引号，可以注释这一步。
 */
function normalizeQuotes(input: string): string {
  return input
    .replace(/\u201C/g, '"') // "
    .replace(/\u201D/g, '"') // "
    .replace(/\u2018/g, "'") // '
    .replace(/\u2019/g, "'"); // '
}

export async function POST(req: NextRequest) {
  const { markdown, modelId } = (await req.json()) as {
    markdown?: string;
    modelId?: string;
  };
  if (!markdown?.trim()) {
    return new Response('markdown 不能为空', { status: 400 });
  }

  let resolved;
  try {
    resolved = resolveModel(modelId);
  } catch (e) {
    return new Response((e as Error).message, { status: 400 });
  }
  const { id: resolvedId, label, apiKey, baseURL, model } = resolved;
  const client = new OpenAI({ apiKey, baseURL });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));

      const startedAt = Date.now();
      let raw = '';

      try {
        send({
          type: 'start',
          model,
          modelId: resolvedId,
          modelLabel: label,
        });

        const completion = await client.chat.completions.create({
          model,
          stream: true,
          temperature: 0.2, // 评分类任务温度更低，结果更稳定
          // 注意：不是所有兼容服务商都支持 response_format
          // 如果遇到 400，可注释掉这一行，靠 prompt 约束 JSON 输出
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: REVIEWER_SYSTEM_PROMPT },
            { role: 'user', content: buildReviewUserMessage(markdown) },
          ],
        });

        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content;
          if (typeof delta === 'string' && delta.length > 0) {
            raw += delta;
            send({ type: 'delta', text: delta });
          }
        }

        // 流结束 → 尽量鲁棒地把 JSON 提取出来。
        // 已观察到的情况：
        //  (1) 模型直接输出 { ... }                          → 直接 parse
        //  (2) 模型输出 ```json\n{ ... }\n```                → 剥代码块
        //  (3) 模型先说一句"以下是评审结果：" 再贴 JSON       → 找首个 { ... 末个 }
        //  (4) 模型末尾追加了说明文字                         → 找首个 { ... 末个 }
        const result = tryParseJsonLoose(raw);

        if (result.ok) {
          send({ type: 'parsed', review: result.value });
        } else {
          send({
            type: 'error',
            message: `评审输出不是合法 JSON（raw 长度 ${raw.length}）`,
          });
        }

        send({
          type: 'done',
          elapsedMs: Date.now() - startedAt,
          totalChars: raw.length,
        });
        controller.close();
      } catch (err) {
        send({ type: 'error', message: (err as Error).message || '评审失败' });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
