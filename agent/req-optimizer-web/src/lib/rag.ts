/**
 * 极简 RAG 工具库（无外部向量库，纯 JSON 文件 + 内存索引）
 *
 * 流程：
 *   1. ingest 阶段：扫描 knowledge/*.md → 按"## 二级标题"切片 →
 *      调用 embeddings 接口 → 把每片的 { source, title, text, vector } 写入 knowledge.index.json
 *   2. 查询阶段：把用户输入也向量化 → 与索引里每条 vector 算余弦相似度 → 取 Top-K
 *
 * 注意：
 * - DeepSeek 目前不提供 embeddings，所以 embeddings 默认走另一个供应商。
 *   这里默认用阿里云 DashScope 的 OpenAI 兼容接口（text-embedding-v2，1536 维）。
 *   你也可以通过 .env.local 覆盖 EMBEDDING_BASE_URL / EMBEDDING_API_KEY / EMBEDDING_MODEL。
 */
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';

export interface KnowledgeChunk {
  /** 文件名（不含路径） */
  source: string;
  /** 二级标题，用于展示 */
  title: string;
  /** 切片正文 */
  text: string;
  /** 向量 */
  vector: number[];
}

export interface RetrievedChunk extends KnowledgeChunk {
  /** 与 query 的余弦相似度，0~1，越大越相关 */
  score: number;
}

/** 索引文件的绝对路径 */
export const INDEX_PATH = path.resolve(process.cwd(), 'knowledge.index.json');
/** 知识库源目录 */
export const KNOWLEDGE_DIR = path.resolve(process.cwd(), 'knowledge');

/** 创建一个 embeddings 专用的 OpenAI 客户端（默认指向 DashScope OpenAI 兼容端点） */
export function createEmbeddingClient() {
  const apiKey = process.env.EMBEDDING_API_KEY || process.env.DASHSCOPE_API_KEY;
  const baseURL =
    process.env.EMBEDDING_BASE_URL ||
    'https://dashscope.aliyuncs.com/compatible-mode/v1';
  if (!apiKey) {
    throw new Error(
      '缺少 EMBEDDING_API_KEY（或 DASHSCOPE_API_KEY）。请在 .env.local 配置一个支持 embeddings 的 OpenAI 兼容服务。',
    );
  }
  return new OpenAI({ apiKey, baseURL });
}

export function getEmbeddingModel() {
  return process.env.EMBEDDING_MODEL || 'text-embedding-v2';
}

/**
 * 把一篇 markdown 按 "## 二级标题" 切成多个语义块。
 * 每块包含从这个 ## 标题到下一个 ## 之间的所有内容。
 * 如果整篇没有 ##，则把整文当作一块。
 */
export function chunkMarkdown(filename: string, raw: string): Omit<KnowledgeChunk, 'vector'>[] {
  const text = raw.replace(/\r\n/g, '\n').trim();
  const lines = text.split('\n');
  const chunks: Omit<KnowledgeChunk, 'vector'>[] = [];

  let currentTitle = '';
  let currentBuf: string[] = [];

  const flush = () => {
    const body = currentBuf.join('\n').trim();
    if (body) {
      chunks.push({
        source: filename,
        title: currentTitle || filename,
        text: body,
      });
    }
  };

  for (const line of lines) {
    const m = line.match(/^##\s+(.+)/);
    if (m) {
      flush();
      currentTitle = m[1].trim();
      currentBuf = [line];
    } else {
      currentBuf.push(line);
    }
  }
  flush();

  // 没有 ## 的极端情况兜底
  if (chunks.length === 0 && text) {
    chunks.push({ source: filename, title: filename, text });
  }
  return chunks;
}

/** 余弦相似度。两边都已是普通数组即可。 */
export function cosineSim(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** 一次性加载索引到内存（API 路由是常驻进程，文件读一次就够） */
let indexCache: KnowledgeChunk[] | null = null;
export function loadIndex(): KnowledgeChunk[] {
  if (indexCache) return indexCache;
  if (!fs.existsSync(INDEX_PATH)) {
    indexCache = [];
    return indexCache;
  }
  const json = fs.readFileSync(INDEX_PATH, 'utf-8');
  indexCache = JSON.parse(json) as KnowledgeChunk[];
  return indexCache;
}

/** 强制重新加载（ingest 之后用） */
export function clearIndexCache() {
  indexCache = null;
}

/** 检索 Top-K，返回带 score 的命中片段 */
export async function retrieve(query: string, topK = 3): Promise<RetrievedChunk[]> {
  const index = loadIndex();
  if (index.length === 0) return [];

  const client = createEmbeddingClient();
  const res = await client.embeddings.create({
    model: getEmbeddingModel(),
    input: query,
  });
  const qvec = res.data[0].embedding as number[];

  return index
    .map((c) => ({ ...c, score: cosineSim(qvec, c.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/** 把命中片段拼成可塞进 system prompt 的字符串 */
export function formatChunksForPrompt(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return '';
  const parts = chunks.map(
    (c, i) =>
      `【知识片段 ${i + 1}】来源：${c.source} > ${c.title}（相似度 ${c.score.toFixed(3)}）\n${c.text}`,
  );
  return parts.join('\n\n---\n\n');
}
