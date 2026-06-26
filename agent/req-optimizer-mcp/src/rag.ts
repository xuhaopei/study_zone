/**
 * RAG 工具（MCP server 版）：复用 ../req-optimizer-web/ 已经 ingest 好的索引文件。
 *
 * 与 req-optimizer-agent-web/src/lib/rag.ts 几乎一致，差别：
 *   - process.cwd() 在 MCP 模式下由 Host 决定（通常是 IDE 工作目录），
 *     所以路径默认相对于 .env.local 所在目录而非 cwd
 *
 * 索引一次加载常驻内存（MCP server 是常驻进程，直到 Host 退出）。
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

// 本项目根目录（MCP server 启动后 cwd 可能是 IDE 工作目录，不可靠）
// 用 import.meta.url 推出 src 目录，再往上一级
const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(__filename), '..');

export interface KnowledgeChunk {
  source: string;
  title: string;
  text: string;
  vector: number[];
}

export interface RetrievedChunk extends KnowledgeChunk {
  score: number;
}

function resolveFromProjectRoot(p: string | undefined): string | undefined {
  if (!p) return undefined;
  return path.isAbsolute(p) ? p : path.resolve(PROJECT_ROOT, p);
}

export function getKnowledgeDir(): string {
  const p = resolveFromProjectRoot(process.env.KNOWLEDGE_DIR);
  if (!p) throw new Error('未配置 KNOWLEDGE_DIR');
  return p;
}

export function getKnowledgeIndexPath(): string {
  const p = resolveFromProjectRoot(process.env.KNOWLEDGE_INDEX);
  if (!p) throw new Error('未配置 KNOWLEDGE_INDEX');
  return p;
}

let _index: KnowledgeChunk[] | null = null;
export function loadIndex(): KnowledgeChunk[] {
  if (_index) return _index;
  const p = getKnowledgeIndexPath();
  if (!fs.existsSync(p)) {
    throw new Error(
      `找不到索引文件：${p}\n请先到 req-optimizer-web 项目跑：npm run ingest`,
    );
  }
  _index = JSON.parse(fs.readFileSync(p, 'utf-8')) as KnowledgeChunk[];
  return _index;
}

function createEmbeddingClient() {
  const apiKey = process.env.EMBEDDING_API_KEY;
  const baseURL =
    process.env.EMBEDDING_BASE_URL ||
    'https://dashscope.aliyuncs.com/compatible-mode/v1';
  if (!apiKey) throw new Error('未配置 EMBEDDING_API_KEY');
  return new OpenAI({ apiKey, baseURL });
}

function cosineSim(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function retrieve(query: string, topK = 3): Promise<RetrievedChunk[]> {
  const index = loadIndex();
  if (index.length === 0) return [];

  const client = createEmbeddingClient();
  const res = await client.embeddings.create({
    model: process.env.EMBEDDING_MODEL || 'text-embedding-v2',
    input: query,
  });
  const qvec = res.data[0].embedding as number[];

  return index
    .map((c) => ({ ...c, score: cosineSim(qvec, c.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
