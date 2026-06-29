/**
 * POST /api/agent
 * Body: { userInput: string }
 *
 * 响应：NDJSON 流（每行一个 JSON 事件），事件类型：
 *   { type: 'start',      model, modelId, modelLabel, tools, ts }  一次：刚开始
 *   { type: 'turn_start', turn }                                每轮开始
 *   { type: 'think_delta',turn, text }                          模型思考文字 / 最终文档的增量（流式逐 token）
 *   { type: 'think_end',  turn }                                这一轮 think 结束（开始进入 tool_calls 阶段）
 *   { type: 'tool_call',  turn, id, name, args }                每个工具调用（args 是已解析对象）
 *   { type: 'tool_result',turn, id, name, result, durationMs }  工具返回（字符串）
 *   { type: 'final',      text }                                finish_reason=stop 时的最终文档（纯 markdown）
 *   { type: 'trace',      messages }                            最后一次：完整 messages 数组（前端可下载）
 *   { type: 'error',      message }                             任意时刻
 *   { type: 'done',       totalTurns, totalToolCalls, elapsedMs } 最后一次
 *
 * 注意：原 save_optimized_doc 工具已移除 —— 作者收集完知识后直接以 markdown 作为最终回复。
 */
import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import type {
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
} from 'openai/resources/chat/completions';
import { SYSTEM_PROMPT } from '@/lib/prompt';
// 阶段 8.3：工具不再来自本地硬编码（@/lib/tools），改为通过 MCP client
// 连接 req-optimizer-mcp server 动态发现（listTools）+ 远程调用（callTool）。
import { getMcpToolSpecs, callMcpTool } from '@/lib/mcp-client';
import { resolveModel } from '@/lib/models';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_TURNS = 12;

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    userInput?: string;
    modelId?: string;
    // 高级用法：编排器（如 /api/refine）可以直接传入预构造的 messages
    // 用于"带评审反馈的迭代改写"等场景。传了 messages 则忽略 userInput
    messages?: ChatCompletionMessageParam[];
  };
  const { userInput, modelId, messages: injectedMessages } = body;

  // 校验：要么传 userInput，要么传 messages（且非空）
  const hasInjected =
    Array.isArray(injectedMessages) && injectedMessages.length > 0;
  if (!hasInjected && !userInput?.trim()) {
    return new Response('userInput 不能为空', { status: 400 });
  }

  // 通过 modelId 解析连接配置；失败直接 4xx
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
      let totalToolCalls = 0;
      let lastTurn = 0;

      try {
        // 阶段 8.3：运行时向 MCP server 动态发现工具（替代过去的本地 TOOL_SPECS 常量）
        // 第一次会拉起 server 子进程并完成 initialize 握手，之后进程内复用同一连接。
        const toolSpecs = await getMcpToolSpecs();

        send({
          type: 'start',
          model,                 // 实际下发给 LLM 的 model name（如 claude-sonnet-4-6）
          modelId: resolvedId,   // 模型注册表里的 id（如 claude-sonnet-46）
          modelLabel: label,     // 用户可读标签（如 "Claude Sonnet 4.6 ⭐⭐⭐⭐⭐"）
          tools: toolSpecs.map((t) => t.function.name),
          ts: new Date().toISOString(),
        });

        const messages: ChatCompletionMessageParam[] = hasInjected
          ? // 编排器注入的完整上下文：直接拿来用
            [...(injectedMessages as ChatCompletionMessageParam[])]
          : [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: userInput as string },
            ];

        for (let turn = 1; turn <= MAX_TURNS; turn++) {
          lastTurn = turn;
          send({ type: 'turn_start', turn });

          // ============ 流式调用 LLM ============
          // 边收增量边把 think 文字推给前端，让用户实时看到"思考过程"
          const stream = await client.chat.completions.create({
            model,
            messages,
            tools: toolSpecs,
            tool_choice: 'auto',
            temperature: 0.3,
            stream: true,
          });

          // 累计变量：把流式增量拼成完整的 assistant 消息
          let fullContent = '';
          // tool_calls 增量拼接：index → { id, name, arguments(累计字符串) }
          const toolCallsAcc: Record<
            number,
            { id?: string; name?: string; arguments: string }
          > = {};
          let finishReason: string | null = null;

          for await (const chunk of stream) {
            const choice = chunk.choices[0];
            if (!choice) continue;
            const delta = choice.delta;

            // 1) 思考/最终文档文字增量 → 立即推给前端（流式打字机效果）
            if (typeof delta.content === 'string' && delta.content.length > 0) {
              fullContent += delta.content;
              send({ type: 'think_delta', turn, text: delta.content });
            }

            // 2) tool_calls 增量 → 按 index 累积，整轮结束后再发完整事件
            if (delta.tool_calls) {
              for (const tcDelta of delta.tool_calls) {
                const idx = tcDelta.index ?? 0;
                if (!toolCallsAcc[idx]) {
                  toolCallsAcc[idx] = { arguments: '' };
                }
                const acc = toolCallsAcc[idx];
                if (tcDelta.id) acc.id = tcDelta.id;
                if (tcDelta.function?.name) acc.name = tcDelta.function.name;
                if (tcDelta.function?.arguments) {
                  acc.arguments += tcDelta.function.arguments;
                }
              }
            }

            if (choice.finish_reason) {
              finishReason = choice.finish_reason;
            }
          }

          // 这一轮 think 阶段结束（即使为空也通知前端，方便它把"思考中"光标隐藏）
          send({ type: 'think_end', turn });

          // 构造完整的 assistant 消息回灌 messages（与 OpenAI 协议一致）
          const builtToolCalls: ChatCompletionMessageToolCall[] = Object.keys(toolCallsAcc)
            .sort((a, b) => Number(a) - Number(b))
            .map((k) => {
              const a = toolCallsAcc[Number(k)];
              return {
                id: a.id || `call_${turn}_${k}`,
                type: 'function' as const,
                function: {
                  name: a.name || '',
                  arguments: a.arguments || '',
                },
              };
            });

          const assistantMsg: ChatCompletionMessageParam = builtToolCalls.length > 0
            ? {
                role: 'assistant',
                content: fullContent || null,
                tool_calls: builtToolCalls,
              }
            : {
                role: 'assistant',
                content: fullContent,
              };
          messages.push(assistantMsg);

          const toolCalls = builtToolCalls;
          if (toolCalls.length > 0) {
            for (const call of toolCalls) {
              const name = call.function.name;
              const argsJson = call.function.arguments || '{}';
              let parsedArgs: unknown = {};
              try {
                parsedArgs = JSON.parse(argsJson);
              } catch {
                parsedArgs = argsJson;
              }
              send({
                type: 'tool_call',
                turn,
                id: call.id,
                name,
                args: parsedArgs,
              });

              // 远程调用：把工具执行委托给 MCP server 进程（替代旧的本地 runTool）
              const argsObj =
                parsedArgs && typeof parsedArgs === 'object'
                  ? (parsedArgs as Record<string, unknown>)
                  : {};
              const t0 = Date.now();
              const result = await callMcpTool(name, argsObj);
              const durationMs = Date.now() - t0;
              totalToolCalls++;

              send({
                type: 'tool_result',
                turn,
                id: call.id,
                name,
                result,
                durationMs,
              });

              // 回灌
              messages.push({
                role: 'tool',
                tool_call_id: call.id,
                content: result,
              });
            }
            continue; // 下一轮
          }

          // 3) 没有工具调用 + finish_reason=stop → 任务结束
          if (finishReason === 'stop') {
            send({ type: 'final', text: fullContent });
            break;
          }

          send({
            type: 'error',
            message: `未预期的 finish_reason=${finishReason}`,
          });
          break;
        }

        // 4) 最后把 trace 发出去（供下载）
        send({ type: 'trace', messages });
        send({
          type: 'done',
          totalTurns: lastTurn,
          totalToolCalls,
          elapsedMs: Date.now() - startedAt,
        });
        controller.close();
      } catch (err) {
        send({ type: 'error', message: (err as Error).message || 'Agent 失败' });
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
