/**
 * POST /api/refine
 * Body: {
 *   userInput: string,
 *   writerModelId?: string,    // 作者 Agent 使用的模型
 *   reviewerModelId?: string,  // 评审 Agent 使用的模型
 *   modelId?: string,          // [兼容] 老入参，未传上面两个时双方共用
 *   maxRounds?: number,
 *   approveThreshold?: number
 * }
 *
 * Actor-Critic 自我迭代编排器：
 *
 *   第 1 轮：调 /api/agent 让作者基于原始需求产出文档
 *   每轮结束：调 /api/review 让评审 Agent 打分
 *   若 score >= approveThreshold（默认 9）→ 提前结束（只看分数，不看 verdict）
 *   否则把"评审意见"喂给作者，调 /api/agent 走带反馈的改写流程
 *   到达 maxRounds 强制停止
 *
 * 响应：NDJSON 流，事件协议（与 page.tsx 中的 IterEvent 一一对应）：
 *
 *   { type: 'iter_start',       maxRounds, writerModelId, reviewerModelId }
 *   { type: 'iter_round_start', round }
 *   { type: 'iter_phase',       round, phase: 'writing' | 'reviewing' }
 *   { type: 'inner_agent',      round, event: <原 AgentEvent> }
 *   { type: 'inner_review',     round, event: <原 ReviewEvent> }
 *   { type: 'iter_round_end',   round, score, verdict, approved, markdown }
 *   { type: 'iter_done',        rounds, finalApproved, elapsedMs }
 *   { type: 'iter_error',       message }
 *
 * 设计原则：
 *   - 编排器不重写作者/评审逻辑，直接 fetch 复用已有路由（同一 Next 实例内部转发）
 *   - 子接口的 NDJSON 事件直接套一层 inner_xxx 透传给前端
 *     这样前端复用原来的渲染逻辑，只需多解一层 envelope
 */
import { NextRequest } from 'next/server';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { buildRefineMessages, type ReviewForRefine } from '@/lib/refine-prompt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_MAX_ROUNDS = 3;
const DEFAULT_APPROVE_THRESHOLD = 9; // 评审 score ≥ 9 视为达标，否则继续迭代

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    userInput?: string;
    writerModelId?: string;
    reviewerModelId?: string;
    modelId?: string; // 老入参：兼容
    maxRounds?: number;
    approveThreshold?: number;
  };
  const userInput = body.userInput?.trim() || '';
  // 写作模型 / 评审模型：优先用各自的；否则 fallback 到老的 modelId
  const writerModelId = body.writerModelId || body.modelId;
  const reviewerModelId = body.reviewerModelId || body.modelId;
  const maxRounds = clampInt(body.maxRounds, 1, 6, DEFAULT_MAX_ROUNDS);
  const approveThreshold = clampInt(body.approveThreshold, 6, 10, DEFAULT_APPROVE_THRESHOLD);

  if (!userInput) {
    return new Response('userInput 不能为空', { status: 400 });
  }

  const origin = req.nextUrl.origin; // 同源内部转发
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));

      const startedAt = Date.now();
      let lastMarkdown = '';
      let lastReview: ReviewForRefine | null = null;
      let finalApproved = false;
      let executedRounds = 0;

      try {
        send({
          type: 'iter_start',
          maxRounds,
          writerModelId: writerModelId || null,
          reviewerModelId: reviewerModelId || null,
        });

        for (let round = 1; round <= maxRounds; round++) {
          executedRounds = round;
          send({ type: 'iter_round_start', round });

          // ============ 1) 作者阶段 ============
          send({ type: 'iter_phase', round, phase: 'writing' });

          // 构造作者 API 的 body：
          //  - 第 1 轮：传 userInput，复用原作者完整流程（system + user）
          //  - 第 2 轮起：注入 messages（含上一版文档 + 评审反馈）
          let agentBody: unknown;
          if (round === 1) {
            agentBody = { userInput, modelId: writerModelId };
          } else {
            const messages: ChatCompletionMessageParam[] = buildRefineMessages({
              originalRequirement: userInput,
              lastMarkdown,
              review: lastReview!, // 第 2+ 轮必有
              round,
            });
            agentBody = { modelId: writerModelId, messages };
          }

          const agentRes = await fetch(`${origin}/api/agent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(agentBody),
          });
          if (!agentRes.ok || !agentRes.body) {
            throw new Error(
              `作者 Agent 调用失败：${agentRes.status} ${await agentRes.text()}`,
            );
          }

          // 透传作者的 NDJSON 流，同时拦截 final 事件拿到本轮 markdown
          // （作者现在直接把 6 段式文档作为最终回复输出，不再调用 save_optimized_doc）
          let thisRoundMarkdown = '';
          await pumpNdjson(agentRes.body, (evt) => {
            send({ type: 'inner_agent', round, event: evt });

            const e = evt as { type?: string; text?: string };
            if (e.type === 'final' && typeof e.text === 'string') {
              thisRoundMarkdown = e.text;
            }
          });

          if (!thisRoundMarkdown.trim()) {
            // 作者这一轮没产出文档（finish_reason 不是 stop，或 content 为空），无法继续
            send({
              type: 'iter_error',
              message: `第 ${round} 轮作者未产出最终文档，迭代中止`,
            });
            break;
          }
          lastMarkdown = thisRoundMarkdown;

          // ============ 2) 评审阶段 ============
          send({ type: 'iter_phase', round, phase: 'reviewing' });

          const reviewRes = await fetch(`${origin}/api/review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              markdown: lastMarkdown,
              modelId: reviewerModelId,
            }),
          });
          if (!reviewRes.ok || !reviewRes.body) {
            throw new Error(
              `评审 Agent 调用失败：${reviewRes.status} ${await reviewRes.text()}`,
            );
          }

          let thisRoundReview: ReviewForRefine | null = null;
          let reviewParseError = '';
          await pumpNdjson(reviewRes.body, (evt) => {
            send({ type: 'inner_review', round, event: evt });

            const e = evt as { type?: string; review?: ReviewForRefine; message?: string };
            if (e.type === 'parsed' && e.review) {
              thisRoundReview = e.review;
            } else if (e.type === 'error' && e.message) {
              reviewParseError = e.message;
            }
          });

          if (!thisRoundReview) {
            send({
              type: 'iter_error',
              message: `第 ${round} 轮评审未产出结构化结果：${reviewParseError || '未知原因'}`,
            });
            break;
          }
          lastReview = thisRoundReview;

          // 判定是否达标：只看分数（verdict 仅用于展示，不参与判定）
          // 因为评审 prompt 里 verdict=approved 的阈值是 8，
          // 这里我们要求更严格的 9 分线，故忽略 verdict 字段
          const r = thisRoundReview as ReviewForRefine;
          const score = r.overall.score;
          const verdict = r.overall.verdict;
          const approved = score >= approveThreshold;

          send({
            type: 'iter_round_end',
            round,
            score,
            verdict,
            approved,
            markdown: lastMarkdown,
          });

          if (approved) {
            finalApproved = true;
            break;
          }
        }

        send({
          type: 'iter_done',
          rounds: executedRounds,
          finalApproved,
          elapsedMs: Date.now() - startedAt,
        });
        controller.close();
      } catch (err) {
        send({ type: 'iter_error', message: (err as Error).message || '迭代失败' });
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

/**
 * 把一个 NDJSON ReadableStream 按行解析，每行解出来后调 onEvent。
 * 自动处理跨 chunk 的半行问题。
 */
async function pumpNdjson(
  body: ReadableStream<Uint8Array>,
  onEvent: (evt: unknown) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buf = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buf.indexOf('\n')) !== -1) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line) continue;
        try {
          onEvent(JSON.parse(line));
        } catch {
          /* 忽略坏行 */
        }
      }
    }
    // 收尾：若最后还有不带换行的残行也尝试解一次
    const tail = buf.trim();
    if (tail) {
      try {
        onEvent(JSON.parse(tail));
      } catch {
        /* ignore */
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function clampInt(
  v: number | undefined,
  min: number,
  max: number,
  fallback: number,
): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(v)));
}
