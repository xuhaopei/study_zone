/**
 * POST /api/optimize
 * Body: { requirement: string, useRag?: boolean }
 *
 * 响应：NDJSON 流（每行一个 JSON 事件）
 *   { type: 'meta',   chunks: [{ source, title, score }] }            先发一次：本次命中的知识片段
 *   { type: 'prompt', model, temperature, messages: [{role,content}] } 紧接着：实际发送给 LLM 的完整 messages
 *   { type: 'delta',  text: '...' }                                    多次：模型增量
 *   { type: 'error',  message: '...' }                                 任意时刻可能出现
 *   { type: 'done' }                                                   最后一次
 */
import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { SYSTEM_PROMPT, buildUserPrompt } from '@/lib/prompt';
import { retrieve, formatChunksForPrompt } from '@/lib/rag';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

  if (!apiKey || apiKey === 'your_deepseek_api_key_here') {
    return new Response('未配置 DEEPSEEK_API_KEY', { status: 500 });
  }

  const { requirement, useRag = true } = (await req.json()) as {
    requirement?: string;
    useRag?: boolean;
  };
  if (!requirement || !requirement.trim()) {
    return new Response('requirement 不能为空', { status: 400 });
  }

  const client = new OpenAI({ apiKey, baseURL });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));

      try {
        // ============ 1) 先做检索 ============
        let ragContext = '';
        let metaChunks: { source: string; title: string; score: number; text: string }[] = [];

        if (useRag) {
          try {
            const chunks = await retrieve(requirement, 3);
            metaChunks = chunks.map((c) => ({
              source: c.source,
              title: c.title,
              score: c.score,
              text: c.text,
            }));
            ragContext = formatChunksForPrompt(chunks);
          } catch (err) {
            // 检索失败不能阻塞主流程：用普通模式继续，但通过 meta 告知前端
            send({
              type: 'meta',
              chunks: [],
              ragError: (err as Error).message || '检索失败',
            });
            ragContext = '';
          }
        }

        // 把命中片段先回给前端展示
        if (!ragContext || metaChunks.length > 0) {
          send({
            type: 'meta',
            chunks: metaChunks.map(({ source, title, score }) => ({ source, title, score })),
          });
        }

        // ============ 2) 拼 prompt 调模型 ============
        const systemMessages: { role: 'system'; content: string }[] = [
          { role: 'system', content: SYSTEM_PROMPT },
        ];
        if (ragContext) {
          systemMessages.push({
            role: 'system',
            content:
              '以下是从公司内部知识库检索到的、与本次需求最相关的片段。' +
              '请优先参考这些规范进行重写：在 NFR / 验收标准 / 风险开放问题中尽量与之对齐，' +
              '但不要原文照搬，也不要列出"参考来源"字段。\n\n' +
              ragContext,
          });
        }

        const messages = [
          ...systemMessages,
          { role: 'user' as const, content: buildUserPrompt(requirement) },
        ];
        console.log('messages', messages);
        // 把"实际发送给 LLM 的完整 messages"回传给前端，便于演示和调试
        const temperature = 0.3;
        send({
          type: 'prompt',
          model,
          temperature,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
            chars: typeof m.content === 'string' ? m.content.length : 0,
          })),
        });
        const completion = await client.chat.completions.create({
          model,
          stream: true,
          temperature,
          messages,
        });

        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content || '';
          if (delta) send({ type: 'delta', text: delta });
        }

        send({ type: 'done' });
        controller.close();
      } catch (err) {
        send({ type: 'error', message: (err as Error).message || '生成失败' });
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
