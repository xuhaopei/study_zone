/**
 * 极简 RAG 工具（CLI 版，复用 ../req-optimizer-web/ 已经 ingest 好的索引）
 *
 * 不重复造轮子：embedding 配置、索引文件都从 .env + web 项目的 knowledge.index.json 读。
 */
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';

export interface KnowledgeChunk {
  source: string;
  title: string;
  text: string;
  vector: number[];
}

export interface RetrievedChunk extends KnowledgeChunk {
  score: number;
}

const KNOWLEDGE_DIR =
  process.env.KNOWLEDGE_DIR && path.resolve(process.cwd(), process.env.KNOWLEDGE_DIR);
const KNOWLEDGE_INDEX =
  process.env.KNOWLEDGE_INDEX && path.resolve(process.cwd(), process.env.KNOWLEDGE_INDEX);

export function getKnowledgeDir(): string {
  if (!KNOWLEDGE_DIR) throw new Error('未配置 KNOWLEDGE_DIR');
  return KNOWLEDGE_DIR;
}

export function getKnowledgeIndexPath(): string {
  if (!KNOWLEDGE_INDEX) throw new Error('未配置 KNOWLEDGE_INDEX');
  return KNOWLEDGE_INDEX;
}

let _index: KnowledgeChunk[] | null = null;
export function loadIndex(): KnowledgeChunk[] {
  if (_index) return _index;
  const p = getKnowledgeIndexPath();
  if (!fs.existsSync(p)) {
    throw new Error(`找不到索引文件：${p}\n请先在 web 项目里跑：npm run ingest`);
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
