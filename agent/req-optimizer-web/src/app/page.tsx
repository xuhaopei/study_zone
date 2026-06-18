'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const SAMPLE = `我们想做一个用户登录的功能，要安全一点，最好能记住用户。
然后页面要好看，手机上也能用。
登录之后能看到自己的资料，有问题要给提示。
还要能找回密码，越快越好，下周能上吗？`;

/** 接受的文件后缀（与 /api/upload 后端保持一致） */
const ACCEPT_EXT = ['txt', 'md', 'markdown', 'docx'] as const;
const ACCEPT_ATTR = '.txt,.md,.markdown,.docx';

export default function HomePage() {
  const [requirement, setRequirement] = useState(SAMPLE);
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0); // 秒

  // 上传相关状态
  const [uploading, setUploading] = useState(false);
  const [uploadInfo, setUploadInfo] = useState<{ name: string; chars: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // RAG 相关状态
  const [useRag, setUseRag] = useState(true);
  const [retrieved, setRetrieved] = useState<
    { source: string; title: string; score: number }[]
  >([]);
  const [ragWarning, setRagWarning] = useState('');

  // 实际发给 LLM 的完整 messages（用于演示/调试）
  const [promptInfo, setPromptInfo] = useState<{
    model: string;
    temperature: number;
    messages: { role: 'system' | 'user' | 'assistant'; content: string; chars: number }[];
  } | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 流式输出时让预览区自动滚到底
  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.scrollTop = previewRef.current.scrollHeight;
    }
  }, [output]);

  async function handleOptimize() {
    if (!requirement.trim() || loading) return;

    setOutput('');
    setError('');
    setRetrieved([]);
    setRagWarning('');
    setPromptInfo(null);
    setLoading(true);
    setElapsed(0);

    const startedAt = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.round((Date.now() - startedAt) / 100) / 10);
    }, 100);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirement, useRag }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      // 服务端是 NDJSON：每行一个 JSON 事件
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        // 按换行切分，最后一段可能不完整，留到下次
        let nl: number;
        while ((nl = buf.indexOf('\n')) !== -1) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          try {
            const evt = JSON.parse(line) as
              | { type: 'meta'; chunks: { source: string; title: string; score: number }[]; ragError?: string }
              | {
                  type: 'prompt';
                  model: string;
                  temperature: number;
                  messages: { role: 'system' | 'user' | 'assistant'; content: string; chars: number }[];
                }
              | { type: 'delta'; text: string }
              | { type: 'error'; message: string }
              | { type: 'done' };

            if (evt.type === 'meta') {
              setRetrieved(evt.chunks || []);
              if (evt.ragError) setRagWarning(`知识库检索失败：${evt.ragError}（已降级为无 RAG 模式）`);
            } else if (evt.type === 'prompt') {
              setPromptInfo({
                model: evt.model,
                temperature: evt.temperature,
                messages: evt.messages,
              });
            } else if (evt.type === 'delta') {
              setOutput((prev) => prev + evt.text);
            } else if (evt.type === 'error') {
              throw new Error(evt.message);
            }
            // done 不需要特别处理，循环会自然结束
          } catch (parseErr) {
            // 非 JSON 行兜底（理论不会发生）：当作纯文本追加
            console.warn('NDJSON 解析失败，原文：', line, parseErr);
          }
        }
      }
    } catch (e: unknown) {
      if ((e as Error).name !== 'AbortError') {
        setError((e as Error).message || '调用失败');
      }
    } finally {
      clearInterval(timer);
      setLoading(false);
      abortRef.current = null;
    }
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  function handleDownload() {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optimized-requirement-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
  }

  /** 上传文件 → 走 /api/upload 解析为纯文本 → 回填 textarea */
  async function handleUploadFile(file: File) {
    setError('');
    const ext = file.name.toLowerCase().split('.').pop() || '';
    if (!ACCEPT_EXT.includes(ext as (typeof ACCEPT_EXT)[number])) {
      setError(`不支持的文件类型：.${ext}（仅支持 ${ACCEPT_EXT.map((e) => '.' + e).join(' / ')}）`);
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = (await res.json()) as
        | { ok: true; filename: string; chars: number; text: string }
        | { ok: false; error: string };

      if (!('ok' in data) || !data.ok) {
        throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
      }
      setRequirement(data.text);
      setUploadInfo({ name: data.filename, chars: data.chars });
    } catch (e) {
      setError((e as Error).message || '上传失败');
    } finally {
      setUploading(false);
    }
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleUploadFile(f);
    e.target.value = ''; // 清掉，避免选同一文件不触发 onChange
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleUploadFile(f);
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* 顶部 */}
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">需求优化 Agent</h1>
            <p className="text-sm text-slate-500">
              把"烂需求"自动重写成结构化、可评审的需求文档 · 模型：DeepSeek
            </p>
          </div>
          <a
            className="text-sm text-brand-500 hover:underline"
            href="https://platform.deepseek.com"
            target="_blank"
            rel="noreferrer"
          >
            DeepSeek 控制台 ↗
          </a>
        </div>
      </header>

      {/* 主体：左输入 / 右输出 */}
      <section className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左：输入 */}
        <div className="bg-white rounded-xl border shadow-sm flex flex-col">
          <div className="px-4 py-3 border-b flex items-center justify-between gap-2">
            <h2 className="font-semibold text-slate-800 shrink-0">原始需求（烂需求）</h2>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              {uploadInfo && (
                <span
                  className="text-slate-600 truncate max-w-[180px]"
                  title={`${uploadInfo.name} · ${uploadInfo.chars} 字`}
                >
                  📎 {uploadInfo.name}
                </span>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_ATTR}
                className="hidden"
                onChange={onPickFile}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="hover:text-brand-500"
                type="button"
                disabled={uploading}
              >
                {uploading ? '解析中…' : '上传文件'}
              </button>
              <button
                onClick={() => {
                  setRequirement(SAMPLE);
                  setUploadInfo(null);
                }}
                className="hover:text-brand-500"
                type="button"
              >
                恢复样例
              </button>
            </div>
          </div>

          {/* textarea + 拖拽蒙层 */}
          <div
            className="relative flex-1 flex"
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <textarea
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              placeholder="把含糊不清的业务需求贴在这里，或把 .txt / .md / .docx 拖进来…"
              className="flex-1 p-4 text-sm leading-6 outline-none resize-none rounded-b-xl"
              spellCheck={false}
            />
            {dragOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-brand-50/90 border-2 border-dashed border-brand-500 rounded-b-xl pointer-events-none">
                <div className="text-brand-600 text-sm font-medium">
                  松手即可上传 · 支持 .txt / .md / .docx（≤ 2MB）
                </div>
              </div>
            )}
          </div>

          <div className="border-t p-3 flex items-center gap-3 flex-wrap">
            {!loading ? (
              <button
                onClick={handleOptimize}
                disabled={!requirement.trim() || uploading}
                className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-50"
              >
                ✨ 一键优化
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="px-4 py-2 rounded-lg bg-slate-700 text-white text-sm font-medium hover:bg-slate-800"
              >
                停止
              </button>
            )}
            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useRag}
                onChange={(e) => setUseRag(e.target.checked)}
                className="accent-brand-500"
              />
              使用知识库 (RAG)
            </label>
            <span className="text-xs text-slate-500">
              {loading
                ? `生成中… ${elapsed.toFixed(1)}s`
                : uploading
                ? '正在解析文件…'
                : `已就绪 · 当前 ${requirement.length} 字`}
            </span>
          </div>
        </div>

        {/* 右：输出 */}
        <div className="bg-white rounded-xl border shadow-sm flex flex-col">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">优化后的结构化文档</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopy}
                disabled={!output}
                className="text-xs text-slate-500 hover:text-brand-500 disabled:opacity-40"
                type="button"
              >
                复制
              </button>
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs text-slate-500 hover:text-brand-500 disabled:opacity-40"
                type="button"
              >
                下载 .md
              </button>
            </div>
          </div>

          <div
            ref={previewRef}
            className="flex-1 overflow-auto p-4 text-sm prose-doc"
          >
            {error && (
              <div className="text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg mb-3">
                {error}
              </div>
            )}

            {/* RAG 命中片段展示 */}
            {useRag && (retrieved.length > 0 || ragWarning) && (
              <details className="mb-4 bg-amber-50 border border-amber-200 rounded-lg" open>
                <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-amber-800">
                  📚 本次参考的知识片段（{retrieved.length}）
                </summary>
                <div className="px-3 pb-3 pt-1 space-y-1.5">
                  {ragWarning && (
                    <div className="text-xs text-amber-700">{ragWarning}</div>
                  )}
                  {retrieved.map((c, i) => (
                    <div
                      key={i}
                      className="text-xs text-slate-700 flex items-center gap-2"
                    >
                      <span className="inline-block w-4 text-amber-700">{i + 1}.</span>
                      <span className="text-slate-500">{c.source}</span>
                      <span className="text-slate-400">›</span>
                      <span className="text-slate-800">{c.title}</span>
                      <span className="ml-auto text-slate-400">
                        相似度 {c.score.toFixed(3)}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {!output && !error && (
              <div className="text-slate-400 text-sm">
                左侧输入需求后点击"一键优化"，模型会按 6 段式结构流式输出文档。
              </div>
            )}
            {output && (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
            )}
          </div>
        </div>
      </section>

      {/* 调试面板：实际发送给 LLM 的 messages */}
      {promptInfo && (
        <section className="max-w-7xl w-full mx-auto px-6 pb-6">
          <details className="bg-white rounded-xl border shadow-sm" open>
            <summary className="cursor-pointer px-4 py-3 border-b flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-800">
                🧠 实际发送给 LLM 的 messages
              </span>
              <span className="text-xs text-slate-500">
                model: <code className="text-slate-700">{promptInfo.model}</code>
                <span className="mx-2">·</span>
                temperature: <code className="text-slate-700">{promptInfo.temperature}</code>
                <span className="mx-2">·</span>
                共 {promptInfo.messages.length} 条 ·{' '}
                {promptInfo.messages.reduce((s, m) => s + m.chars, 0)} 字
              </span>
            </summary>

            <div className="p-4 space-y-3">
              {promptInfo.messages.map((m, i) => (
                <div
                  key={i}
                  className="border rounded-lg overflow-hidden bg-slate-50/50"
                >
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-100 border-b text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          'inline-block px-2 py-0.5 rounded text-white font-medium ' +
                          (m.role === 'system'
                            ? 'bg-slate-600'
                            : m.role === 'user'
                            ? 'bg-brand-500'
                            : 'bg-emerald-600')
                        }
                      >
                        {m.role}
                      </span>
                      <span className="text-slate-500">#{i + 1}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500">{m.chars} 字</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(m.content)}
                      className="text-slate-500 hover:text-brand-500"
                    >
                      复制
                    </button>
                  </div>
                  <pre className="px-3 py-2 text-[12.5px] leading-6 text-slate-800 whitespace-pre-wrap break-words max-h-72 overflow-auto">
                    {m.content}
                  </pre>
                </div>
              ))}
            </div>
          </details>
        </section>
      )}

      <footer className="text-center text-xs text-slate-400 py-4">
        阶段 3 演示页 · 后端流式 → 前端打字机 → ReactMarkdown 渲染 · RAG 增强
      </footer>
    </main>
  );
}
