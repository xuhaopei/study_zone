'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ===== 事件类型（与 /api/agent NDJSON 协议一一对应） =====
type AgentEvent =
  | {
      type: 'start';
      model: string;
      modelId?: string;
      modelLabel?: string;
      tools: string[];
      ts: string;
    }
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
};

type Bubble =
  | { kind: 'user'; text: string }
  | {
      kind: 'assistant';
      turn: number;
      // 用于区分自动迭代里同一 turn 号但属于不同迭代轮的气泡。
      // 单次发送时 round 固定为 0；自动迭代时 round 为 1/2/3...
      round: number;
      /** 该轮使用的模型标签（从 start 事件抓取，用于 UI 显示给用户感知） */
      modelLabel?: string;
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

// ===== MCP Resources / Prompts 类型（与 /api/mcp 响应一致） =====
// 注意：前端自己定义轻量类型，不能 import @/lib/mcp-client
//（那是服务端模块，会把 MCP SDK / child_process 打进 client bundle）
type McpResourceInfo = {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
};
type McpPromptInfo = {
  name: string;
  description?: string;
  arguments?: { name: string; description?: string; required?: boolean }[];
};

// ===== 自动迭代相关类型（与 /api/refine 协议对应） =====
type IterRoundSummary = {
  round: number;
  phase: 'writing' | 'reviewing' | 'done';
  score?: number;
  verdict?: string;
  approved?: boolean;
  /** 本轮完整评审结果（用于每轮折叠展开看 5 维评分 / 章节点评 / 建议） */
  review?: ReviewResult;
  /** 本轮评审过程中的原始 JSON 文本（解析失败时也能展示） */
  reviewRaw?: string;
  /** 本轮评审解析错误（若有） */
  reviewError?: string;
  /** 本轮作者使用的模型标签（从 inner_agent start 事件抓取） */
  writerModelLabel?: string;
  /** 本轮评审使用的模型标签（从 inner_review start 事件抓取） */
  reviewerModelLabel?: string;
};

type RefineEvent =
  | {
      type: 'iter_start';
      maxRounds: number;
      writerModelId: string | null;
      reviewerModelId: string | null;
    }
  | { type: 'iter_round_start'; round: number }
  | { type: 'iter_phase'; round: number; phase: 'writing' | 'reviewing' }
  | { type: 'inner_agent'; round: number; event: AgentEvent }
  | {
      type: 'inner_review';
      round: number;
      event:
        | { type: 'start'; model: string; modelId?: string; modelLabel?: string }
        | { type: 'delta'; text: string }
        | { type: 'parsed'; review: ReviewResult }
        | { type: 'error'; message: string }
        | { type: 'done'; elapsedMs: number; totalChars: number };
    }
  | {
      type: 'iter_round_end';
      round: number;
      score: number;
      verdict: string;
      approved: boolean;
      markdown: string;
    }
  | {
      type: 'iter_done';
      rounds: number;
      finalApproved: boolean;
      elapsedMs: number;
    }
  | { type: 'iter_error'; message: string };

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
  // 作者最终输出的 markdown 文档（直接从 final 事件取，不再走 save_optimized_doc 工具）
  const [finalDoc, setFinalDoc] = useState<{ markdown: string } | null>(null);
  const [trace, setTrace] = useState<unknown[] | null>(null);

  // 评审 Agent 状态
  const [reviewRunning, setReviewRunning] = useState(false);
  const [reviewRawText, setReviewRawText] = useState(''); // 流式拼接的原始 JSON 文本
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [reviewError, setReviewError] = useState('');
  /** 当前评审使用的模型 label（从 review start 事件抓取，给 ReviewCard 顶部显示） */
  const [reviewModelLabel, setReviewModelLabel] = useState('');

  // 自动迭代（Actor-Critic 循环）状态
  const [refineRunning, setRefineRunning] = useState(false);
  const [refineRounds, setRefineRounds] = useState<IterRoundSummary[]>([]);
  const [refineFinalApproved, setRefineFinalApproved] = useState<boolean | null>(null);
  const [refineCurrentRound, setRefineCurrentRound] = useState(0);

  // 模型选择（作者 / 评审 各自独立，允许混搭）
  const [models, setModels] = useState<ModelOption[]>([]);
  const [writerModelId, setWriterModelId] = useState<string>('');
  const [reviewerModelId, setReviewerModelId] = useState<string>('');

  // 阶段 8.5：MCP Resources / Prompts
  const [mcpResources, setMcpResources] = useState<McpResourceInfo[]>([]);
  const [mcpPrompts, setMcpPrompts] = useState<McpPromptInfo[]>([]);
  const [mcpPanelOpen, setMcpPanelOpen] = useState(false);
  const [mcpBusy, setMcpBusy] = useState(false); // 读资源/取模板时禁用按钮

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
        // 默认两端都用 default 模型
        setWriterModelId(data.defaultId);
        setReviewerModelId(data.defaultId);
      } catch {
        // 模型列表失败不影响主体功能：后端 resolveModel 会用 default fallback
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  // 阶段 8.5：首屏拉取 MCP 资源 / 模板列表
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/mcp');
        if (!res.ok) return;
        const data = (await res.json()) as {
          resources: McpResourceInfo[];
          prompts: McpPromptInfo[];
        };
        if (cancelled) return;
        setMcpResources(data.resources || []);
        setMcpPrompts(data.prompts || []);
      } catch {
        // MCP 列表失败不影响主体功能
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * 点击某个资源 → 读取全文 → 作为"参考资料"追加进输入框。
   * 这正是 Resources 的用法：由【用户】决定把哪份文档塞进上下文，不经过 LLM 工具调用。
   */
  async function handleInsertResource(r: McpResourceInfo) {
    if (mcpBusy) return;
    setMcpBusy(true);
    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'readResource', uri: r.uri }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (data.error) {
        setError(`读取资源失败：${data.error}`);
        return;
      }
      const block = `\n\n[参考资料 · ${r.name}]\n${data.text ?? ''}\n`;
      setInput((prev) => prev + block);
    } catch (e) {
      setError(`读取资源失败：${(e as Error).message}`);
    } finally {
      setMcpBusy(false);
    }
  }

  /**
   * 点击某个 prompt 模板 → 用当前输入框内容作为参数 → 展开成完整提示词填回输入框。
   * 这是 Prompts 的用法：把复杂提示词沉淀到 server，用户触发时一键展开。
   */
  async function handleApplyPrompt(p: McpPromptInfo) {
    if (mcpBusy) return;
    setMcpBusy(true);
    try {
      // 约定：第一个参数（如 requirement）取当前输入框内容
      const argName = p.arguments?.[0]?.name;
      const args: Record<string, string> = argName
        ? { [argName]: input.trim() }
        : {};
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getPrompt', name: p.name, arguments: args }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (data.error) {
        setError(`展开模板失败：${data.error}`);
        return;
      }
      if (data.text) setInput(data.text);
      setMcpPanelOpen(false);
    } catch (e) {
      setError(`展开模板失败：${(e as Error).message}`);
    } finally {
      setMcpBusy(false);
    }
  }


  // 自动滚到底
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [bubbles, finalDoc]);

  /**
   * 工厂：返回处理"一段 /api/agent NDJSON 流"的事件分发器。
   * 每个 agent 流（refine 多轮时每轮一段）单独造一份，闭包内的 createdTurns 互不干扰。
   *
   * @param round  迭代轮次。单次发送固定 0；自动迭代时 1/2/3...
   *               注意：/api/agent 每次请求 turn 都从 1 重新计数，因此前端必须把"哪一轮的 turn=1"
   *               区分开来，否则 setBubbles 会按 turn 命中前一轮的旧气泡，导致后续轮看起来没打字机效果。
   * @param roundPrefix  可选 —— refine 模式下会在 system_info 文案里带上"第 N 轮"。
   */
  function createAgentEventHandler(round: number = 0, roundPrefix?: string) {
    const createdTurns = new Set<number>();
    // 闭包内缓存当前 agent 流的模型 label —— 在 start 事件里写入，
    // 后续创建 assistant 气泡时塞进去，让用户看到"这一轮用的是哪个模型"
    let latestModelLabel = '';

    const ensureAssistantBubble = (turn: number) => {
      if (createdTurns.has(turn)) return;
      createdTurns.add(turn);
      setBubbles((prev) => [
        ...prev,
        {
          kind: 'assistant',
          round,
          turn,
          modelLabel: latestModelLabel || undefined,
          thinking: true,
          tools: [],
        },
      ]);
    };

    // 按 (round, turn) 复合定位气泡。
    // 不能只看 turn，因为多轮迭代时 turn 编号会重复（每轮都从 1 开始）。
    const updateAssistant = (
      turn: number,
      updater: (cur: Extract<Bubble, { kind: 'assistant' }>) => Extract<
        Bubble,
        { kind: 'assistant' }
      >,
    ) => {
      setBubbles((prev) => {
        let found = false;
        return prev.map((b) => {
          if (
            !found &&
            b.kind === 'assistant' &&
            b.round === round &&
            b.turn === turn
          ) {
            found = true;
            return updater(b);
          }
          return b;
        });
      });
    };

    return function handle(evt: AgentEvent) {
      if (evt.type === 'start') {
        latestModelLabel = evt.modelLabel || evt.model;
        setBubbles((b) => [
          ...b,
          {
            kind: 'system_info',
            text: `🟢 ${roundPrefix || ''}Agent 启动 · 模型 ${latestModelLabel} · 可用工具：${evt.tools.join(', ')}`,
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
          const existingIdx = cur.tools.findIndex((t) => t.id === evt.id);
          if (existingIdx >= 0) {
            const next = cur.tools.slice();
            next[existingIdx] = {
              ...next[existingIdx],
              id: evt.id,
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
      } else if (evt.type === 'final') {
        // 作者最终输出的 markdown：
        // 由于本项目里"最终文档"和"思考流"用的是同一个 content 通道（delta.content），
        // 整个 markdown 在 think_delta 阶段就已经流式渲染到 assistant 气泡的"思考过程"块里了，
        // 这里不再追加 final 气泡，避免出现两份一样的 markdown。
        // 但仍要存 finalDoc，供"下载"和"提交评审"使用。
        if (evt.text?.trim()) {
          setFinalDoc({ markdown: evt.text });
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
    };
  }

  /** 重置所有运行态（发送/评审/迭代 共用） */
  function resetAllRunStates() {
    setError('');
    setSummary(null);
    setFinalDoc(null);
    setTrace(null);
    setReviewRunning(false);
    setReviewRawText('');
    setReviewResult(null);
    setReviewError('');
    setReviewModelLabel('');
    setRefineRunning(false);
    setRefineRounds([]);
    setRefineFinalApproved(null);
    setRefineCurrentRound(0);
  }

  async function handleSubmit() {
    if (!input.trim() || running) return;

    setRunning(true);
    resetAllRunStates();

    setBubbles((b) => [...b, { kind: 'user', text: input }]);
    const userInput = input;
    setInput('');

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput, modelId: writerModelId }),
      });
      if (!res.ok || !res.body) throw new Error((await res.text()) || `HTTP ${res.status}`);

      const handleAgentEvent = createAgentEventHandler();
      await pumpNdjsonStream(res.body, (evt) => handleAgentEvent(evt as AgentEvent));
    } catch (e) {
      setError((e as Error).message || '请求失败');
    } finally {
      setRunning(false);
    }
  }

  /** 自动迭代：作者-评审循环，直到 approved 或达到最大轮次 */
  async function handleSubmitRefine() {
    if (!input.trim() || running || refineRunning) return;

    setRunning(true);
    setRefineRunning(true);
    resetAllRunStates();
    setRefineRunning(true); // resetAll 把它清了，这里恢复

    setBubbles((b) => [...b, { kind: 'user', text: input }]);
    const userInput = input;
    setInput('');

    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput,
          writerModelId,
          reviewerModelId,
          maxRounds: 3,
        }),
      });
      if (!res.ok || !res.body) throw new Error((await res.text()) || `HTTP ${res.status}`);

      // 每轮一份 agent handler（避免 createdTurns 串扰）
      let currentAgentHandler = createAgentEventHandler(1, '[第 1 轮] ');
      let currentRound = 0;

      await pumpNdjsonStream(res.body, (raw) => {
        const evt = raw as RefineEvent;

        if (evt.type === 'iter_start') {
          setBubbles((b) => [
            ...b,
            {
              kind: 'system_info',
              text: `🤖 自动迭代开始（最多 ${evt.maxRounds} 轮）`,
            },
          ]);
        } else if (evt.type === 'iter_round_start') {
          currentRound = evt.round;
          setRefineCurrentRound(evt.round);
          setRefineRounds((prev) => [
            ...prev,
            { round: evt.round, phase: 'writing' },
          ]);
          // 每进入新一轮就换一份 agent handler（带上 round 用于 (round,turn) 复合定位气泡）
          currentAgentHandler = createAgentEventHandler(
            evt.round,
            `[第 ${evt.round} 轮] `,
          );
          // 清掉上一轮的"文档卡片"（即将被新轮的覆盖）；
          // 评审结果不再清零 —— 因为历史评分已经存进 refineRounds[round].review，
          // 进度卡片里能展开看。这里只清"实时进度条"用的临时变量。
          if (evt.round > 1) {
            setFinalDoc(null);
            setReviewRawText('');
            setReviewError('');
          }
        } else if (evt.type === 'iter_phase') {
          setRefineRounds((prev) =>
            prev.map((r) =>
              r.round === evt.round ? { ...r, phase: evt.phase } : r,
            ),
          );
          if (evt.phase === 'reviewing') {
            // 新一轮评审开始 —— 清空全局"当前评审"展示用的临时变量。
            // 历史评审数据不会丢，它们已存进 refineRounds[round].review，
            // 在 RefineProgressCard 里点对应轮次可展开看。
            setReviewRunning(true);
            setReviewRawText('');
            setReviewResult(null);
            setReviewError('');
            setReviewModelLabel('');
          }
        } else if (evt.type === 'inner_agent') {
          // 作者 Agent 启动时，从 start 事件抓 modelLabel 同步到 refineRounds
          // （这样在迭代进度卡里能看到"本轮作者用的是哪个模型"）
          if (evt.event.type === 'start') {
            const e = evt.event;
            const label = e.modelLabel || e.model;
            setRefineRounds((prev) =>
              prev.map((it) =>
                it.round === evt.round ? { ...it, writerModelLabel: label } : it,
              ),
            );
          }
          currentAgentHandler(evt.event);
        } else if (evt.type === 'inner_review') {
          const r = evt.event;
          if (r.type === 'start') {
            // 评审 Agent 启动 —— 记录这一轮评审使用的模型
            const label = r.modelLabel || r.model;
            setReviewModelLabel(label);
            setRefineRounds((prev) =>
              prev.map((it) =>
                it.round === evt.round
                  ? { ...it, reviewerModelLabel: label }
                  : it,
              ),
            );
          } else if (r.type === 'delta') {
            // 同步到全局 reviewRawText（顶部"当前评审进度"用），
            // 也累加进当前轮的 refineRounds[evt.round].reviewRaw（迭代结束后历史可见）
            setReviewRawText((prev) => prev + r.text);
            setRefineRounds((prev) =>
              prev.map((it) =>
                it.round === evt.round
                  ? { ...it, reviewRaw: (it.reviewRaw || '') + r.text }
                  : it,
              ),
            );
          } else if (r.type === 'parsed') {
            setReviewResult(r.review);
            setRefineRounds((prev) =>
              prev.map((it) =>
                it.round === evt.round ? { ...it, review: r.review } : it,
              ),
            );
          } else if (r.type === 'error') {
            setReviewError(r.message);
            setRefineRounds((prev) =>
              prev.map((it) =>
                it.round === evt.round ? { ...it, reviewError: r.message } : it,
              ),
            );
          } else if (r.type === 'done') {
            setReviewRunning(false);
          }
        } else if (evt.type === 'iter_round_end') {
          setRefineRounds((prev) =>
            prev.map((r) =>
              r.round === evt.round
                ? {
                    ...r,
                    phase: 'done',
                    score: evt.score,
                    verdict: evt.verdict,
                    approved: evt.approved,
                  }
                : r,
            ),
          );
        } else if (evt.type === 'iter_done') {
          setRefineFinalApproved(evt.finalApproved);
          setBubbles((b) => [
            ...b,
            {
              kind: 'system_info',
              text:
                `🏁 迭代结束 · 共 ${evt.rounds} 轮 · ` +
                (evt.finalApproved ? '✅ 评审通过' : '⚠️ 未通过但达到上限') +
                ` · ${(evt.elapsedMs / 1000).toFixed(1)}s`,
            },
          ]);
        } else if (evt.type === 'iter_error') {
          setError(evt.message);
        }
        // currentRound 仅用于调试，避免 lint 警告
        void currentRound;
      });
    } catch (e) {
      setError((e as Error).message || '迭代失败');
    } finally {
      setRunning(false);
      setRefineRunning(false);
      setReviewRunning(false);
    }
  }

  /** 通用：把 NDJSON ReadableStream 按行解析，逐行回调 */
  async function pumpNdjsonStream(
    body: ReadableStream<Uint8Array>,
    onEvent: (evt: unknown) => void,
  ): Promise<void> {
    const reader = body.getReader();
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
        try {
          onEvent(JSON.parse(line));
        } catch {
          /* ignore bad line */
        }
      }
    }
  }

  /** 提交评审：调 /api/review 流式接收 review JSON */
  async function handleSubmitReview() {
    if (!finalDoc || reviewRunning) return;

    setReviewRunning(true);
    setReviewRawText('');
    setReviewResult(null);
    setReviewError('');
    setReviewModelLabel('');

    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markdown: finalDoc.markdown,
          modelId: reviewerModelId,
        }),
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
            | { type: 'start'; model: string; modelId?: string; modelLabel?: string }
            | { type: 'delta'; text: string }
            | { type: 'parsed'; review: ReviewResult }
            | { type: 'error'; message: string }
            | { type: 'done'; elapsedMs: number; totalChars: number };

          try {
            evt = JSON.parse(line);
          } catch {
            continue;
          }

          if (evt.type === 'start') {
            setReviewModelLabel(evt.modelLabel || evt.model);
          } else if (evt.type === 'delta') {
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
            {/* 模型选择：作者 + 评审 各自独立 */}
            {models.length > 0 && (
              <div className="flex items-center gap-3 mr-2 px-2 py-1 rounded-md border bg-slate-50">
                <ModelSelect
                  label="✍️ 作者"
                  value={writerModelId}
                  onChange={setWriterModelId}
                  models={models}
                  disabled={running || reviewRunning}
                />
                <span className="text-slate-300">|</span>
                <ModelSelect
                  label="🧑‍⚖️ 评审"
                  value={reviewerModelId}
                  onChange={setReviewerModelId}
                  models={models}
                  disabled={running || reviewRunning}
                />
                {writerModelId !== reviewerModelId && (
                  <span
                    className="ml-1 text-[10px] text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded"
                    title="作者与评审使用不同模型 —— 可以做交叉评审"
                  >
                    混搭
                  </span>
                )}
              </div>
            )}
            {finalDoc && (
              <button
                onClick={() =>
                  downloadFile(
                    `optimized-${Date.now()}.md`,
                    finalDoc.markdown,
                    'text/markdown;charset=utf-8',
                  )
                }
                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600"
              >
                📥 下载文档
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

          {(refineRunning || refineRounds.length > 0) && (
            <RefineProgressCard
              rounds={refineRounds}
              running={refineRunning}
              currentRound={refineCurrentRound}
              finalApproved={refineFinalApproved}
              writerModelLabel={
                models.find((m) => m.id === writerModelId)?.label || writerModelId
              }
              reviewerModelLabel={
                models.find((m) => m.id === reviewerModelId)?.label || reviewerModelId
              }
            />
          )}

          {finalDoc && (
            <FinalDocCard
              doc={finalDoc}
              reviewRunning={reviewRunning}
              hasReview={!!reviewResult || !!reviewRawText}
              onSubmitReview={handleSubmitReview}
              hideManualReviewBtn={refineRunning} // 迭代中隐藏手动评审按钮
            />
          )}

          {/*
            ReviewCard 的可见性策略：
              - 手动评审（非迭代）：评审运行中 / 已出结果 / 有错误都显示
              - 自动迭代模式：
                  · 评审运行中：显示（让用户看实时打字）
                  · 评审结束且 refineRunning：隐藏（避免和 RefineProgressCard 重复）
                  · 整个迭代结束（!refineRunning）：隐藏（历史评分卡片里看）
          */}
          {(reviewRunning ||
            (!refineRunning && refineRounds.length === 0 &&
              (reviewRawText || reviewResult || reviewError))) && (
            <ReviewCard
              running={reviewRunning}
              raw={reviewRawText}
              result={reviewResult}
              error={reviewError}
              modelLabel={reviewModelLabel}
            />
          )}
        </div>
      </div>

      {/* 输入区 */}
      <footer className="border-t bg-white">
        <div className="max-w-5xl mx-auto px-4 py-3">
          {/* 阶段 8.5：MCP 资源 / 模板工具条 */}
          <McpToolbar
            resources={mcpResources}
            prompts={mcpPrompts}
            open={mcpPanelOpen}
            busy={mcpBusy}
            disabled={running}
            onToggle={() => setMcpPanelOpen((v) => !v)}
            onInsertResource={handleInsertResource}
            onApplyPrompt={handleApplyPrompt}
          />
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
              title="单次跑作者 Agent"
            >
              {running && !refineRunning ? '运行中…' : '发送'}
            </button>
            <button
              onClick={handleSubmitRefine}
              disabled={!input.trim() || running}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              title="作者 → 评审 → 改写循环（最多 3 轮）"
            >
              {refineRunning
                ? `迭代中…(${refineCurrentRound})`
                : '🤖 自动迭代'}
            </button>
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">
            提示：发送 = 单次产出；自动迭代 = 作者→评审→改写循环，直到评审通过或达 3 轮上限。
          </div>
        </div>
      </footer>
    </main>
  );
}

// ===== 阶段 8.5：MCP 资源 / 模板工具条 =====
function McpToolbar({
  resources,
  prompts,
  open,
  busy,
  disabled,
  onToggle,
  onInsertResource,
  onApplyPrompt,
}: {
  resources: McpResourceInfo[];
  prompts: McpPromptInfo[];
  open: boolean;
  busy: boolean;
  disabled: boolean;
  onToggle: () => void;
  onInsertResource: (r: McpResourceInfo) => void;
  onApplyPrompt: (p: McpPromptInfo) => void;
}) {
  // server 没暴露任何资源/模板时不渲染
  if (resources.length === 0 && prompts.length === 0) return null;

  return (
    <div className="mb-2">
      <button
        onClick={onToggle}
        className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
        title="来自 MCP server 的 Resources / Prompts"
      >
        <span>{open ? '▾' : '▸'}</span>
        <span>📚 MCP 知识库资源 / 模板</span>
        <span className="text-slate-400">
          （{resources.length} 资源 · {prompts.length} 模板）
        </span>
      </button>

      {open && (
        <div className="mt-2 p-3 rounded-lg border bg-slate-50 space-y-3">
          {/* Prompts：点击展开模板填入输入框 */}
          {prompts.length > 0 && (
            <div>
              <div className="text-[11px] font-medium text-slate-500 mb-1">
                ⚡ 提示词模板（点击用当前输入作参数展开）
              </div>
              <div className="flex flex-wrap gap-2">
                {prompts.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => onApplyPrompt(p)}
                    disabled={busy || disabled}
                    title={p.description || p.name}
                    className="px-2.5 py-1 text-xs rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                  >
                    /{p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Resources：点击把整篇文档塞进输入框 */}
          {resources.length > 0 && (
            <div>
              <div className="text-[11px] font-medium text-slate-500 mb-1">
                📄 知识库资源（点击把全文作为参考资料插入输入框）
              </div>
              <div className="flex flex-wrap gap-2">
                {resources.map((r) => (
                  <button
                    key={r.uri}
                    onClick={() => onInsertResource(r)}
                    disabled={busy || disabled}
                    title={r.description || r.uri}
                    className="px-2.5 py-1 text-xs rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {busy && <div className="text-[11px] text-slate-400">处理中…</div>}
        </div>
      )}
    </div>
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

  // ===== 根据迭代轮次切换配色，给用户"作者岗位换了"的视觉感知 =====
  // round=0：单次发送，灰白主调
  // round=1：迭代首轮 —— 蓝色（首次创作）
  // round=2：迭代次轮 —— 紫色（基于反馈改写）
  // round=3：迭代末轮 —— 粉色（最后冲刺）
  // round>=4：兜底使用粉色
  const roundTheme = (() => {
    switch (bubble.round) {
      case 0:
        return {
          container: 'bg-white border',
          header: 'bg-slate-50 text-slate-500',
          accentDot: bubble.thinking ? 'bg-amber-400' : 'bg-emerald-500',
          badge: null as null | { text: string; cls: string },
        };
      case 1:
        return {
          container: 'bg-white border-2 border-blue-200',
          header: 'bg-blue-50 text-blue-700',
          accentDot: bubble.thinking ? 'bg-blue-400' : 'bg-emerald-500',
          badge: {
            text: '✍️ 首次创作',
            cls: 'bg-blue-500 text-white',
          },
        };
      case 2:
        return {
          container: 'bg-white border-2 border-violet-200',
          header: 'bg-violet-50 text-violet-700',
          accentDot: bubble.thinking ? 'bg-violet-400' : 'bg-emerald-500',
          badge: {
            text: '🔁 基于评审反馈改写',
            cls: 'bg-violet-500 text-white',
          },
        };
      default:
        return {
          container: 'bg-white border-2 border-pink-200',
          header: 'bg-pink-50 text-pink-700',
          accentDot: bubble.thinking ? 'bg-pink-400' : 'bg-emerald-500',
          badge: {
            text: `🔥 第 ${bubble.round} 轮深度打磨`,
            cls: 'bg-pink-500 text-white',
          },
        };
    }
  })();

  return (
    <div className="flex justify-start">
      <div
        className={
          'max-w-[90%] w-full rounded-2xl rounded-tl-sm shadow-sm overflow-hidden ' +
          roundTheme.container
        }
      >
        <div
          className={
            'px-3 py-1.5 border-b text-xs flex items-center gap-2 ' +
            roundTheme.header
          }
        >
          <span
            className={
              'inline-block w-1.5 h-1.5 rounded-full ' +
              roundTheme.accentDot +
              (bubble.thinking ? ' animate-pulse' : '')
            }
          ></span>
          助手 ·
          {bubble.round > 0 && (
            <span className="font-medium">迭代第 {bubble.round} 轮 / </span>
          )}
          第 {bubble.turn} 轮
          {bubble.modelLabel && (
            <span
              className="px-1.5 py-0.5 rounded bg-white/80 border text-[10px] font-medium text-slate-700 ml-1"
              title="本轮作者 Agent 使用的模型"
            >
              🤖 {bubble.modelLabel}
            </span>
          )}
          {bubble.tools.length > 0 && (
            <span className="text-slate-400">
              · {bubble.tools.length} 次工具调用
            </span>
          )}
          {roundTheme.badge && (
            <span
              className={
                'ml-auto px-2 py-0.5 rounded text-[10px] font-medium ' +
                roundTheme.badge.cls
              }
            >
              {roundTheme.badge.text}
            </span>
          )}
        </div>

        {showThinkBlock && (
          // 思考过程改为可折叠：
          //  - 流式输出中（thinking）默认展开，让用户看到打字机效果
          //  - 输出完成后默认折叠，避免长 markdown 占满屏幕（点 summary 再展开）
          //  - 使用 key={String(bubble.thinking)} 让"流式结束"瞬间触发 details 重新挂载，
          //    从而切换默认 open 状态（避免要用受控 open + onToggle 额外维护 state）
          <details
            key={String(bubble.thinking)}
            open={bubble.thinking}
            className="border-l-4 border-amber-300 bg-amber-50/60 group"
          >
            <summary className="cursor-pointer list-none px-4 py-2 flex items-center gap-1.5 text-[11px] font-medium text-amber-700 hover:bg-amber-100/60">
              <span className="text-amber-500 group-open:rotate-90 transition-transform inline-block w-3">
                ▸
              </span>
              <span>💭</span>
              <span>{bubble.thinking ? '思考中…' : '思考过程'}</span>
              {!bubble.thinking && hasThink && (
                <span className="text-slate-400 font-normal ml-1">
                  ({bubble.think!.length} 字符 · 点击展开)
                </span>
              )}
            </summary>
            <div className="px-4 pb-2.5 pt-1">
              {hasThink ? (
                <div className="text-sm text-slate-700 md leading-6">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {bubble.think + (bubble.thinking ? '▍' : '')}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic">
                  （模型正在规划下一步…）
                </div>
              )}
            </div>
          </details>
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
  return (
    <details className="group">
      <summary className="cursor-pointer px-3 py-2 flex items-center gap-2 text-xs hover:bg-slate-100 list-none">
        <span className="text-slate-400 group-open:rotate-90 transition-transform">▸</span>
        <span
          className={
            'inline-block px-1.5 py-0.5 rounded text-white text-[10px] font-medium ' +
            (tool.pending ? 'bg-amber-500' : 'bg-emerald-600')
          }
        >
          {tool.pending ? '调用中' : 'OK'}
        </span>
        <code className="font-mono text-slate-800">{tool.name}</code>
        <span className="text-slate-400 truncate flex-1">
          {tool.args ? JSON.stringify(tool.args) : '{}'}
        </span>
        {tool.durationMs !== undefined && (
          <span className="text-slate-400">{tool.durationMs}ms</span>
        )}
      </summary>

      <div className="px-3 pb-3 pt-1 space-y-2">
        <div>
          <div className="text-[11px] text-slate-500 mb-0.5">参数</div>
          <pre className="text-[11px] bg-slate-900 text-slate-100 rounded p-2 overflow-x-auto whitespace-pre-wrap break-words max-h-80 scrollbar-thin">
            {JSON.stringify(tool.args, null, 2)}
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

// 作者最终输出文档卡片（轻量版：文档主体已在对话流的 final 气泡里渲染了，
// 这里只提供"字符统计 + 提交评审"入口，不再重复展示文档内容）
function FinalDocCard({
  doc,
  reviewRunning,
  hasReview,
  onSubmitReview,
  hideManualReviewBtn,
}: {
  doc: { markdown: string };
  reviewRunning: boolean;
  hasReview: boolean;
  onSubmitReview: () => void;
  hideManualReviewBtn?: boolean;
}) {
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-3">
      <h3 className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
        ✅ 已产出最终文档
        <span className="text-xs font-normal text-emerald-700">
          ({doc.markdown.length} 字符)
        </span>
      </h3>
      {!hideManualReviewBtn && (
        <button
          onClick={onSubmitReview}
          disabled={reviewRunning}
          className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-700 disabled:opacity-50"
        >
          {reviewRunning ? '评审中…' : hasReview ? '🔁 重新评审' : '📝 提交评审'}
        </button>
      )}
    </div>
  );
}

// 评审 verdict 文本和样式 —— ReviewCard、ReviewDetail、RoundRow 共用
const VERDICT_META: Record<string, { label: string; bg: string; text: string }> = {
  approved: { label: '✅ 通过', bg: 'bg-emerald-500', text: 'text-white' },
  needs_revision: { label: '⚠️ 需修改', bg: 'bg-amber-500', text: 'text-white' },
  rejected: { label: '❌ 不通过', bg: 'bg-red-500', text: 'text-white' },
};

/**
 * 评审结果详情（纯展示组件，不带容器外壳）。
 * 提取出来供 ReviewCard 和 RefineProgressCard 历史轮展开复用。
 */
function ReviewDetail({ result }: { result: ReviewResult }) {
  return (
    <div className="space-y-3">
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
                (VERDICT_META[result.overall.verdict]?.bg || 'bg-slate-500') +
                ' ' +
                (VERDICT_META[result.overall.verdict]?.text || 'text-white')
              }
            >
              {VERDICT_META[result.overall.verdict]?.label || result.overall.verdict}
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
    </div>
  );
}

// ===== 评审结果卡片（手动评审 / 迭代当前轮"实时"评审用） =====
function ReviewCard({
  running,
  raw,
  result,
  error,
  modelLabel,
}: {
  running: boolean;
  raw: string;
  result: ReviewResult | null;
  error: string;
  modelLabel?: string;
}) {
  return (
    <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-semibold text-violet-800 flex items-center gap-2">
          🧑‍⚖️ 评审 Agent
          {modelLabel && (
            <span
              className="px-1.5 py-0.5 rounded bg-white border text-[10px] font-medium text-violet-700"
              title="本次评审使用的模型"
            >
              🤖 {modelLabel}
            </span>
          )}
        </h3>
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

      {result && <ReviewDetail result={result} />}
    </div>
  );
}

// ===== 自动迭代进度卡片 =====
function RefineProgressCard({
  rounds,
  running,
  currentRound,
  finalApproved,
  writerModelLabel,
  reviewerModelLabel,
}: {
  rounds: IterRoundSummary[];
  running: boolean;
  currentRound: number;
  finalApproved: boolean | null;
  writerModelLabel?: string;
  reviewerModelLabel?: string;
}) {
  const sameModel =
    writerModelLabel && reviewerModelLabel && writerModelLabel === reviewerModelLabel;

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <h3 className="text-sm font-semibold text-indigo-800 flex items-center gap-2">
          🤖 自动迭代（Actor-Critic）
          {running && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
          )}
        </h3>
        <div className="text-xs">
          {finalApproved === true && (
            <span className="px-2 py-0.5 rounded bg-emerald-500 text-white font-medium">
              ✅ 评审通过
            </span>
          )}
          {finalApproved === false && (
            <span className="px-2 py-0.5 rounded bg-amber-500 text-white font-medium">
              ⚠️ 未通过（达上限）
            </span>
          )}
          {finalApproved === null && running && (
            <span className="text-indigo-600">第 {currentRound} 轮进行中…</span>
          )}
        </div>
      </div>

      {/* 双方模型展示条 —— 让用户一眼看清 actor 和 critic 分别是谁 */}
      {(writerModelLabel || reviewerModelLabel) && (
        <div className="bg-white border border-indigo-100 rounded-lg px-3 py-2 mb-3 flex items-center gap-3 text-[11px] flex-wrap">
          {writerModelLabel && (
            <span className="flex items-center gap-1.5">
              <span className="text-slate-500">✍️ 作者</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-medium">
                🤖 {writerModelLabel}
              </span>
            </span>
          )}
          {writerModelLabel && reviewerModelLabel && (
            <span className="text-slate-300">→</span>
          )}
          {reviewerModelLabel && (
            <span className="flex items-center gap-1.5">
              <span className="text-slate-500">🧑‍⚖️ 评审</span>
              <span className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-800 font-medium">
                🤖 {reviewerModelLabel}
              </span>
            </span>
          )}
          {sameModel && (
            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px]">
              同模型自评（容易打高分）
            </span>
          )}
          {!sameModel && writerModelLabel && reviewerModelLabel && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px]">
              交叉评审
            </span>
          )}
        </div>
      )}

      <div className="space-y-2">
        {rounds.map((r) => (
          <RoundRow key={r.round} round={r} />
        ))}
      </div>

      <div className="mt-3 text-[11px] text-indigo-600/70 leading-5">
        💡 迭代会自动把评审反馈喂给作者重写。score ≥ 9 则提前结束，否则跑满最大轮数。
        每轮完成后可点行展开看完整评分详情。
      </div>
    </div>
  );
}

function RoundRow({ round }: { round: IterRoundSummary }) {
  const isDone = round.phase === 'done';
  const phaseLabel: Record<IterRoundSummary['phase'], string> = {
    writing: '✍️ 作者写作中',
    reviewing: '🧑‍⚖️ 评审中',
    done: '完成',
  };
  const canExpand = !!round.review;

  const summaryContent = (
    <>
      {canExpand && (
        <span className="text-slate-400 group-open:rotate-90 transition-transform inline-block w-3">
          ▸
        </span>
      )}
      {!canExpand && <span className="inline-block w-3" />}
      <div className="font-semibold text-slate-700 w-14 shrink-0">
        第 {round.round} 轮
      </div>

      <div className="flex-1 text-slate-600">
        {isDone ? (
          <span>
            评审结果：
            <span className="font-medium text-slate-800">
              {round.score}/10
            </span>
            <span className="ml-2 text-slate-400">/</span>
            <span className="ml-1">{verdictLabel(round.verdict)}</span>
            {canExpand && (
              <span className="ml-2 text-[10px] text-violet-500">
                点击展开详情 ↓
              </span>
            )}
          </span>
        ) : (
          <span className="text-indigo-600 flex items-center gap-1.5 flex-wrap">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            {phaseLabel[round.phase]}
            {round.phase === 'writing' && round.writerModelLabel && (
              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-medium">
                🤖 {round.writerModelLabel}
              </span>
            )}
            {round.phase === 'reviewing' && round.reviewerModelLabel && (
              <span className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-800 text-[10px] font-medium">
                🤖 {round.reviewerModelLabel}
              </span>
            )}
          </span>
        )}
      </div>

      {isDone && (
        <span
          className={
            'px-2 py-0.5 rounded text-white font-medium ' +
            (round.approved
              ? 'bg-emerald-500'
              : round.verdict === 'rejected'
              ? 'bg-red-500'
              : 'bg-amber-500')
          }
        >
          {round.approved ? '通过' : '继续改'}
        </span>
      )}
    </>
  );

  // 没有评审结果（还在跑或失败），就不让展开
  if (!canExpand) {
    return (
      <div className="bg-white border rounded-lg px-3 py-2 flex items-center gap-3 text-xs">
        {summaryContent}
      </div>
    );
  }

  return (
    <details className="group bg-white border rounded-lg">
      <summary className="list-none cursor-pointer px-3 py-2 flex items-center gap-3 text-xs hover:bg-slate-50 rounded-lg">
        {summaryContent}
      </summary>
      <div className="px-3 pb-3 pt-1 border-t bg-slate-50/40">
        {round.reviewError && (
          <div className="mb-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
            ❌ {round.reviewError}
          </div>
        )}
        {round.review && <ReviewDetail result={round.review} />}
      </div>
    </details>
  );
}

function verdictLabel(v?: string): string {
  if (v === 'approved') return '✅ 通过';
  if (v === 'needs_revision') return '⚠️ 需修改';
  if (v === 'rejected') return '❌ 不通过';
  return v || '-';
}

// ===== 单个模型选择器（顶栏复用：作者 / 评审） =====
function ModelSelect({
  label,
  value,
  onChange,
  models,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  models: ModelOption[];
  disabled?: boolean;
}) {
  const cur = models.find((m) => m.id === value);
  return (
    <label className="flex items-center gap-1 text-slate-600">
      <span className="text-slate-500 text-[11px] whitespace-nowrap">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="border rounded-md px-1.5 py-0.5 text-xs bg-white hover:border-brand-500 focus:outline-none focus:border-brand-500 disabled:opacity-50"
        title={cur?.description || '选择该 Agent 使用的 LLM'}
      >
        {models.map((m) => (
          <option key={m.id} value={m.id} disabled={!m.configured}>
            {m.label}
            {!m.configured ? '（未配置）' : ''}
          </option>
        ))}
      </select>
    </label>
  );
}

