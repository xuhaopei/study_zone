'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ===== 事件类型（与 /api/agent NDJSON 协议一一对应） =====
type AgentEvent =
  | { type: 'start'; model: string; tools: string[]; ts: string }
  | { type: 'turn_start'; turn: number }
  | { type: 'think_delta'; turn: number; text: string }
  | { type: 'think_end'; turn: number }
  | {
      type: 'tool_call';
      turn: number;
      id: string;
      name: string;
      args: unknown;
    }
  | {
      type: 'tool_result';
      turn: number;
      id: string;
      name: string;
      result: string;
      durationMs: number;
    }
  | { type: 'doc_delta'; turn: number; id: string; text: string }
  | { type: 'saved_doc'; filename: string; markdown: string }
  | { type: 'final'; text: string }
  | { type: 'trace'; messages: unknown[] }
  | { type: 'error'; message: string }
  | {
      type: 'done';
      totalTurns: number;
      totalToolCalls: number;
      elapsedMs: number;
    };

// ===== UI 用消息模型（前端自己组织） =====
type ToolBubble = {
  id: string;
  name: string;
  args: unknown;
  result?: string;
  durationMs?: number;
  pending: boolean;
  /** 仅 save_optimized_doc 用：流式拼接出来的 markdown 文本 */
  docMarkdown?: string;
};

type Bubble =
  | { kind: 'user'; text: string }
  | {
      kind: 'assistant';
      turn: number;
      think?: string;
      thinking: boolean; // 是否还在流式输出 think 中（用于显示光标）
      tools: ToolBubble[]; // 同一 turn 里的所有工具调用聚合在一起
    }
  | { kind: 'final'; text: string }
  | { kind: 'system_info'; text: string };

const SAMPLE = `做一个用户登录功能。
要求登录要快速，界面要友好美观。
用户输入账号和密码就可以登录。
登录成功后跳转到首页。
密码要安全一点。
最好能支持手机号登录。
首页弹出提示信息。`;

// ===== 评审 Agent 相关类型 =====
type ReviewDimension = {
  key: string;
  label: string;
  score: number;
  comment: string;
};

type SectionReview = {
  section: string;
  good?: string;
  issues?: string[];
};

type ReviewResult = {
  overall: { score: number; verdict: string; summary: string };
  dimensions: ReviewDimension[];
  section_reviews: SectionReview[];
  suggestions: string[];
};

// ===== 模型选项类型（与 /api/models 响应一致） =====
type ModelOption = {
  id: string;
  label: string;
  description: string;
  configured: boolean;
};

export default function HomePage() {
  const [input, setInput] = useState('');
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<{
    turns: number;
    toolCalls: number;
    elapsedSec: number;
  } | null>(null);
  const [savedDoc, setSavedDoc] = useState<{ filename: string; markdown: string } | null>(null);
  const [trace, setTrace] = useState<unknown[] | null>(null);

  // 评审 Agent 状态
  const [reviewRunning, setReviewRunning] = useState(false);
  const [reviewRawText, setReviewRawText] = useState(''); // 流式拼接的原始 JSON 文本
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [reviewError, setReviewError] = useState('');

  // 模型选择（全局共用：作者 + 评审 同一个）
  const [models, setModels] = useState<ModelOption[]>([]);
  const [modelId, setModelId] = useState<string>('');

  // 首次加载拉取可用模型列表
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/models');
        if (!res.ok) return;
        const data = (await res.json()) as { models: ModelOption[]; defaultId: string };
        if (cancelled) return;
        setModels(data.models);
        setModelId(data.defaultId);
      } catch {
        // 模型列表失败不影响主体功能：后端 resolveModel 会用 default fallback
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  // 自动滚到底
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [bubbles, savedDoc]);

  async function handleSubmit() {
    if (!input.trim() || running) return;

    setRunning(true);
    setError('');
    setSummary(null);
    setSavedDoc(null);
    setTrace(null);
    // 重置评审 Agent 状态（重新发起需求时清空上一次评审）
    setReviewRunning(false);
    setReviewRawText('');
    setReviewResult(null);
    setReviewError('');

    // user 气泡
    setBubbles((b) => [...b, { kind: 'user', text: input }]);
    const userInput = input;
    setInput('');

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput, modelId }),
      });
      if (!res.ok || !res.body) throw new Error((await res.text()) || `HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buf = '';

      // 已经为哪些 turn 建过气泡（同步集合，避免重复建）
      const createdTurns = new Set<number>();

      // helper：保证某个 turn 有气泡。同步操作，不阻塞流。
      const ensureAssistantBubble = (turn: number) => {
        if (createdTurns.has(turn)) return;
        createdTurns.add(turn);
        setBubbles((prev) => [
          ...prev,
          { kind: 'assistant', turn, thinking: true, tools: [] },
        ]);
      };

      // helper：在 bubbles 里按 turn 找到 assistant 气泡并就地更新。
      // 不依赖 idx，所以即使 React 还没 flush 上一次更新也安全。
      const updateAssistant = (
        turn: number,
        updater: (cur: Extract<Bubble, { kind: 'assistant' }>) => Extract<
          Bubble,
          { kind: 'assistant' }
        >,
      ) => {
        setBubbles((prev) => {
          let found = false;
          const next = prev.map((b) => {
            if (!found && b.kind === 'assistant' && b.turn === turn) {
              found = true;
              return updater(b);
            }
            return b;
          });
          return next;
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buf.indexOf('\n')) !== -1) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;

          let evt: AgentEvent;
          try {
            evt = JSON.parse(line) as AgentEvent;
          } catch {
            continue;
          }

          if (evt.type === 'start') {
            setBubbles((b) => [
              ...b,
              {
                kind: 'system_info',
                text: `🟢 Agent 启动 · 模型 ${evt.model} · 可用工具：${evt.tools.join(', ')}`,
              },
            ]);
          } else if (evt.type === 'turn_start') {
            ensureAssistantBubble(evt.turn);
          } else if (evt.type === 'think_delta') {
            ensureAssistantBubble(evt.turn);
            updateAssistant(evt.turn, (cur) => ({
              ...cur,
              think: (cur.think || '') + evt.text,
              thinking: true,
            }));
          } else if (evt.type === 'think_end') {
            ensureAssistantBubble(evt.turn);
            updateAssistant(evt.turn, (cur) => ({ ...cur, thinking: false }));
          } else if (evt.type === 'tool_call') {
            ensureAssistantBubble(evt.turn);
            updateAssistant(evt.turn, (cur) => {
              // 如果已经有同 id 或同名（占位）的工具，就合并而非追加
              const existingIdx = cur.tools.findIndex(
                (t) => t.id === evt.id || (t.name === evt.name && t.pending && t.docMarkdown !== undefined),
              );
              if (existingIdx >= 0) {
                const existing = cur.tools[existingIdx];
                const next = cur.tools.slice();
                next[existingIdx] = {
                  ...existing,
                  id: evt.id, // 用正式 id 覆盖
                  name: evt.name,
                  args: evt.args,
                  pending: true,
                };
                return { ...cur, tools: next };
              }
              return {
                ...cur,
                tools: [
                  ...cur.tools,
                  { id: evt.id, name: evt.name, args: evt.args, pending: true },
                ],
              };
            });
          } else if (evt.type === 'tool_result') {
            ensureAssistantBubble(evt.turn);
            updateAssistant(evt.turn, (cur) => ({
              ...cur,
              tools: cur.tools.map((t) =>
                t.id === evt.id
                  ? { ...t, result: evt.result, durationMs: evt.durationMs, pending: false }
                  : t,
              ),
            }));
          } else if (evt.type === 'doc_delta') {
            // save_optimized_doc 的 markdown 字段流式追加。
            // ⚠️ 关键：doc_delta 比 tool_call 事件更早到达（在 chunk 循环里就发了），
            // 此时前端可能还没有对应的工具气泡。所以我们采用"按 id 找；找不到就创建占位"的策略，
            // 后续 tool_call 到达时再 merge 进来。
            ensureAssistantBubble(evt.turn);
            updateAssistant(evt.turn, (cur) => {
              const existingIdx = cur.tools.findIndex((t) => t.id === evt.id);
              if (existingIdx >= 0) {
                const next = cur.tools.slice();
                next[existingIdx] = {
                  ...next[existingIdx],
                  docMarkdown: (next[existingIdx].docMarkdown || '') + evt.text,
                };
                return { ...cur, tools: next };
              }
              // 占位：tool_call 还没来，先建一个临时气泡
              return {
                ...cur,
                tools: [
                  ...cur.tools,
                  {
                    id: evt.id,
                    name: 'save_optimized_doc',
                    args: undefined,
                    pending: true,
                    docMarkdown: evt.text,
                  },
                ],
              };
            });
          } else if (evt.type === 'saved_doc') {
            setSavedDoc({ filename: evt.filename, markdown: evt.markdown });
          } else if (evt.type === 'final') {
            if (evt.text?.trim()) {
              setBubbles((b) => [...b, { kind: 'final', text: evt.text }]);
            }
          } else if (evt.type === 'trace') {
            setTrace(evt.messages);
          } else if (evt.type === 'done') {
            setSummary({
              turns: evt.totalTurns,
              toolCalls: evt.totalToolCalls,
              elapsedSec: evt.elapsedMs / 1000,
            });
          } else if (evt.type === 'error') {
            setError(evt.message);
          }
        }
      }
    } catch (e) {
      setError((e as Error).message || '请求失败');
    } finally {
      setRunning(false);
    }
  }

  /** 提交评审：调 /api/review 流式接收 review JSON */
  async function handleSubmitReview() {
    if (!savedDoc || reviewRunning) return;

    setReviewRunning(true);
    setReviewRawText('');
    setReviewResult(null);
    setReviewError('');

    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown: savedDoc.markdown, modelId }),
      });
      if (!res.ok || !res.body) throw new Error((await res.text()) || `HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buf.indexOf('\n')) !== -1) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;

          let evt:
            | { type: 'start'; model: string }
            | { type: 'delta'; text: string }
            | { type: 'parsed'; review: ReviewResult }
            | { type: 'error'; message: string }
            | { type: 'done'; elapsedMs: number; totalChars: number };

          try {
            evt = JSON.parse(line);
          } catch {
            continue;
          }

          if (evt.type === 'delta') {
            setReviewRawText((prev) => prev + evt.text);
          } else if (evt.type === 'parsed') {
            setReviewResult(evt.review);
          } else if (evt.type === 'error') {
            setReviewError(evt.message);
          }
        }
      }
    } catch (e) {
      setReviewError((e as Error).message || '评审失败');
    } finally {
      setReviewRunning(false);
    }
  }

  function downloadFile(filename: string, content: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* 顶部栏 */}
      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">需求优化 Agent · 聊天式</h1>
            <p className="text-xs text-slate-500">
              聊天式 UI · 实时显示模型 think / tool_call / tool_result · 可下载完整 trace
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {/* 模型选择 */}
            {models.length > 0 && (
              <label className="flex items-center gap-1.5 text-slate-600 mr-2">
                <span className="text-slate-500">模型</span>
                <select
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  disabled={running || reviewRunning}
                  className="border rounded-md px-2 py-1 text-xs bg-white hover:border-brand-500 focus:outline-none focus:border-brand-500 disabled:opacity-50"
                  title={
                    models.find((m) => m.id === modelId)?.description ||
                    '选择当前会话使用的 LLM'
                  }
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id} disabled={!m.configured}>
                      {m.label}
                      {!m.configured ? '（未配置）' : ''}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {savedDoc && (
              <button
                onClick={() => downloadFile(savedDoc.filename, savedDoc.markdown, 'text/markdown;charset=utf-8')}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600"
              >
                📥 下载文档 ({savedDoc.filename})
              </button>
            )}
            {trace && (
              <button
                onClick={() =>
                  downloadFile(
                    `trace-${Date.now()}.json`,
                    JSON.stringify(trace, null, 2),
                    'application/json',
                  )
                }
                className="px-3 py-1.5 rounded-lg bg-slate-700 text-white hover:bg-slate-800"
              >
                📦 下载 trace.json
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 对话流 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto scrollbar-thin"
      >
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
          {bubbles.length === 0 && !running && (
            <div className="text-center text-slate-400 mt-10 text-sm">
              在底部输入一份"烂需求"，Agent 会自己检索知识库 → 思考 → 调工具 → 产出 6 段式文档。
              <div className="mt-3">
                <button
                  onClick={() => setInput(SAMPLE)}
                  className="text-brand-500 hover:underline"
                >
                  使用样例需求
                </button>
              </div>
            </div>
          )}

          {bubbles.map((b, i) => (
            <BubbleView key={i} bubble={b} />
          ))}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              ❌ {error}
            </div>
          )}

          {summary && (
            <div className="text-xs text-slate-500 border-t pt-3">
              ✅ 任务结束 · {summary.turns} 轮 · {summary.toolCalls} 次工具调用 ·{' '}
              {summary.elapsedSec.toFixed(1)}s
            </div>
          )}

          {savedDoc && (
            <SavedDocCard
              doc={savedDoc}
              reviewRunning={reviewRunning}
              hasReview={!!reviewResult || !!reviewRawText}
              onSubmitReview={handleSubmitReview}
            />
          )}

          {(reviewRunning || reviewRawText || reviewResult || reviewError) && (
            <ReviewCard
              running={reviewRunning}
              raw={reviewRawText}
              result={reviewResult}
              error={reviewError}
            />
          )}
        </div>
      </div>

      {/* 输入区 */}
      <footer className="border-t bg-white">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="贴一份烂需求…  Ctrl/⌘ + Enter 提交"
              rows={3}
              className="flex-1 resize-none border rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500"
              disabled={running}
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || running}
              className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-50"
            >
              {running ? '运行中…' : '发送'}
            </button>
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">
            提示：模型会基于知识库（PRD 规范 / 登录最佳实践 / 合规 / 性能）多次检索后产出文档。
          </div>
        </div>
      </footer>
    </main>
  );
}

// ===== 气泡组件 =====
function BubbleView({ bubble }: { bubble: Bubble }) {
  if (bubble.kind === 'system_info') {
    return (
      <div className="text-center text-xs text-slate-500 bg-slate-100 rounded-full px-3 py-1 inline-block">
        {bubble.text}
      </div>
    );
  }

  if (bubble.kind === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-brand-500 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm whitespace-pre-wrap">
          {bubble.text}
        </div>
      </div>
    );
  }

  if (bubble.kind === 'final') {
    return (
      <div className="flex justify-start">
        <div className="max-w-[90%] bg-white border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm md text-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{bubble.text}</ReactMarkdown>
        </div>
      </div>
    );
  }

  // assistant：thinking + tool_calls
  const hasThink = !!bubble.think?.trim();
  const showThinkBlock = hasThink || bubble.thinking;

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] w-full bg-white border rounded-2xl rounded-tl-sm shadow-sm overflow-hidden">
        <div className="px-3 py-1.5 border-b bg-slate-50 text-xs text-slate-500 flex items-center gap-2">
          <span
            className={
              'inline-block w-1.5 h-1.5 rounded-full ' +
              (bubble.thinking ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500')
            }
          ></span>
          助手 · 第 {bubble.turn} 轮
          {bubble.tools.length > 0 && (
            <span className="text-slate-400">· {bubble.tools.length} 次工具调用</span>
          )}
        </div>

        {showThinkBlock && (
          <div className="border-l-4 border-amber-300 bg-amber-50/60 px-4 py-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-700 mb-1">
              <span>💭</span>
              <span>{bubble.thinking ? '思考中…' : '思考过程'}</span>
            </div>
            {hasThink ? (
              <div className="text-sm text-slate-700 md leading-6">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {bubble.think + (bubble.thinking ? '▍' : '')}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">（模型正在规划下一步…）</div>
            )}
          </div>
        )}

        {bubble.tools.length > 0 && (
          <div className="border-t bg-slate-50/50 divide-y">
            {bubble.tools.map((t) => (
              <ToolCallView key={t.id} tool={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ToolCallView({ tool }: { tool: ToolBubble }) {
  const isSaveDoc = tool.name === 'save_optimized_doc';
  const streamingDoc = isSaveDoc && tool.pending; // 还在写文档

  return (
    <details className="group" open={streamingDoc}>
      <summary className="cursor-pointer px-3 py-2 flex items-center gap-2 text-xs hover:bg-slate-100 list-none">
        <span className="text-slate-400 group-open:rotate-90 transition-transform">▸</span>
        <span
          className={
            'inline-block px-1.5 py-0.5 rounded text-white text-[10px] font-medium ' +
            (tool.pending ? 'bg-amber-500' : 'bg-emerald-600')
          }
        >
          {tool.pending ? (isSaveDoc ? '写文档中' : '调用中') : 'OK'}
        </span>
        <code className="font-mono text-slate-800">{tool.name}</code>
        <span className="text-slate-400 truncate flex-1">
          {isSaveDoc
            ? tool.docMarkdown
              ? `${tool.docMarkdown.length} 字符…`
              : '准备中…'
            : tool.args
            ? JSON.stringify(tool.args)
            : '{}'}
        </span>
        {tool.durationMs !== undefined && (
          <span className="text-slate-400">{tool.durationMs}ms</span>
        )}
      </summary>

      <div className="px-3 pb-3 pt-1 space-y-2">
        <div>
          <div className="text-[11px] text-slate-500 mb-0.5">
            {isSaveDoc ? `markdown 字段（流式拼接 · ${tool.docMarkdown?.length || 0} 字符）` : '参数'}
          </div>
          <pre className="text-[11px] bg-slate-900 text-slate-100 rounded p-2 overflow-x-auto whitespace-pre-wrap break-words max-h-80 scrollbar-thin">
            {isSaveDoc
              ? (tool.docMarkdown || '') + (streamingDoc ? '▍' : '')
              : JSON.stringify(tool.args, null, 2)}
          </pre>
        </div>
        <div>
          <div className="text-[11px] text-slate-500 mb-0.5">返回</div>
          <pre className="text-[11px] bg-slate-100 text-slate-800 rounded p-2 overflow-x-auto whitespace-pre-wrap break-words max-h-60 scrollbar-thin">
            {tool.pending ? '（等待返回中…）' : tool.result}
          </pre>
        </div>
      </div>
    </details>
  );
}

function SavedDocCard({
  doc,
  reviewRunning,
  hasReview,
  onSubmitReview,
}: {
  doc: { filename: string; markdown: string };
  reviewRunning: boolean;
  hasReview: boolean;
  onSubmitReview: () => void;
}) {
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2 gap-3">
        <h3 className="text-sm font-semibold text-emerald-800">
          📄 模型提交的最终文档：{doc.filename}
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-emerald-700">{doc.markdown.length} 字符</span>
          <button
            onClick={onSubmitReview}
            disabled={reviewRunning}
            className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-700 disabled:opacity-50"
          >
            {reviewRunning ? '评审中…' : hasReview ? '🔁 重新评审' : '📝 提交评审'}
          </button>
        </div>
      </div>
      <details>
        <summary className="cursor-pointer text-xs text-emerald-700 hover:underline">
          展开预览
        </summary>
        <div className="mt-2 bg-white border rounded p-3 md text-sm max-h-96 overflow-auto scrollbar-thin">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{doc.markdown}</ReactMarkdown>
        </div>
      </details>
    </div>
  );
}

// ===== 评审结果卡片 =====
function ReviewCard({
  running,
  raw,
  result,
  error,
}: {
  running: boolean;
  raw: string;
  result: ReviewResult | null;
  error: string;
}) {
  const verdictMeta: Record<string, { label: string; bg: string; text: string }> = {
    approved: { label: '✅ 通过', bg: 'bg-emerald-500', text: 'text-white' },
    needs_revision: { label: '⚠️ 需修改', bg: 'bg-amber-500', text: 'text-white' },
    rejected: { label: '❌ 不通过', bg: 'bg-red-500', text: 'text-white' },
  };

  return (
    <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-violet-800">🧑‍⚖️ 评审 Agent</h3>
        {running && (
          <span className="text-xs text-violet-600 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"></span>
            正在评审… 已收 {raw.length} 字符
          </span>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          ❌ {error}
        </div>
      )}

      {/* 原始 JSON 流（折叠，便于看模型写） */}
      {raw && (
        <details className="bg-white border rounded">
          <summary className="cursor-pointer px-3 py-2 text-xs text-slate-600 hover:bg-slate-50">
            🔤 模型原始 JSON 输出（{raw.length} 字符）
          </summary>
          <pre className="text-[11px] bg-slate-900 text-slate-100 p-2 rounded-b max-h-60 overflow-auto scrollbar-thin whitespace-pre-wrap break-words">
            {raw + (running ? '▍' : '')}
          </pre>
        </details>
      )}

      {/* 解析成功后的结构化卡片 */}
      {result && (
        <>
          {/* 总分 */}
          <div className="bg-white border rounded-lg p-3 flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-violet-700">
                {result.overall.score}
                <span className="text-base text-slate-400">/10</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">总分</div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={
                    'text-xs font-medium px-2 py-0.5 rounded ' +
                    (verdictMeta[result.overall.verdict]?.bg || 'bg-slate-500') +
                    ' ' +
                    (verdictMeta[result.overall.verdict]?.text || 'text-white')
                  }
                >
                  {verdictMeta[result.overall.verdict]?.label || result.overall.verdict}
                </span>
              </div>
              <div className="text-sm text-slate-700">{result.overall.summary}</div>
            </div>
          </div>

          {/* 5 维评分 */}
          <div className="bg-white border rounded-lg p-3 space-y-2">
            <div className="text-xs font-medium text-slate-600 mb-1">📊 维度评分</div>
            {result.dimensions.map((d) => (
              <div key={d.key} className="flex items-start gap-3">
                <div className="w-24 shrink-0 text-xs text-slate-700 pt-0.5">{d.label}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-2 flex-1 bg-slate-100 rounded overflow-hidden">
                      <div
                        className={
                          'h-full rounded transition-all ' +
                          (d.score >= 8
                            ? 'bg-emerald-500'
                            : d.score >= 5
                            ? 'bg-amber-500'
                            : 'bg-red-500')
                        }
                        style={{ width: `${(d.score / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-700 w-8 text-right">
                      {d.score}/10
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 leading-5">{d.comment}</div>
                </div>
              </div>
            ))}
          </div>

          {/* 分章节点评 */}
          {result.section_reviews?.length > 0 && (
            <details className="bg-white border rounded-lg">
              <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
                📝 分章节点评（{result.section_reviews.length} 段）
              </summary>
              <div className="px-3 pb-3 pt-1 space-y-3">
                {result.section_reviews.map((s, i) => (
                  <div key={i} className="border-l-2 border-violet-200 pl-3">
                    <div className="text-xs font-semibold text-slate-800 mb-1">
                      {s.section}
                    </div>
                    {s.good && (
                      <div className="text-xs text-emerald-700 mb-1">
                        ✓ {s.good}
                      </div>
                    )}
                    {s.issues?.map((issue, j) => (
                      <div key={j} className="text-xs text-red-600 leading-5">
                        ✗ {issue}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* 修改建议 */}
          {result.suggestions?.length > 0 && (
            <div className="bg-white border rounded-lg p-3">
              <div className="text-xs font-medium text-slate-700 mb-2">
                💡 修改建议（{result.suggestions.length} 条）
              </div>
              <ol className="list-decimal pl-5 space-y-1 text-xs text-slate-700">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="leading-5">{s}</li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}
    </div>
  );
}
