/**
 * RAG 离线 ingest 脚本：把 knowledge/*.md 切片 + 向量化 → 写入 knowledge.index.json
 *
 * 运行：npm run ingest
 *
 * 设计：
 * - 每次全量重建（小知识库够用）
 * - embeddings 接口走 OpenAI 兼容协议，默认指向阿里云 DashScope（text-embedding-v2）
 * - 失败立即抛错，避免生成残缺索引
 */
// 注意：dotenv 默认只读 .env，需要手动指定 .env.local
// 优先级：.env.local > .env（与 Next.js 行为保持一致）
import * as path from 'path';
import * as fs from 'fs';
import { config as loadEnv } from 'dotenv';
loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv({ path: path.resolve(process.cwd(), '.env') });

import {
  KNOWLEDGE_DIR,
  INDEX_PATH,
  chunkMarkdown,
  createEmbeddingClient,
  getEmbeddingModel,
  type KnowledgeChunk,
} from '../src/lib/rag';

async function main() {
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    console.error(`[错误] 找不到知识库目录：${KNOWLEDGE_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(KNOWLEDGE_DIR)
    .filter((f) => f.endsWith('.md') || f.endsWith('.markdown'));

  if (files.length === 0) {
    console.error(`[错误] knowledge/ 下没有 .md 文件`);
    process.exit(1);
  }

  // 1) 切片
  const flat: Omit<KnowledgeChunk, 'vector'>[] = [];
  for (const f of files) {
    const raw = fs.readFileSync(path.join(KNOWLEDGE_DIR, f), 'utf-8');
    const chunks = chunkMarkdown(f, raw);
    console.log(`  · ${f}：切出 ${chunks.length} 片`);
    flat.push(...chunks);
  }
  console.log(`>>> 共 ${flat.length} 个切片，开始向量化...`);
  console.log('phx flat', flat)
  // 2) 向量化（一次性 batch 调用）
  const client = createEmbeddingClient();
  const model = getEmbeddingModel();

  // 大多数 embedding 接口允许 input 是字符串数组，一次最多 25 条左右，分批调用更稳
  const BATCH = 16;
  const vectors: number[][] = [];
  for (let i = 0; i < flat.length; i += BATCH) {
    const batch = flat.slice(i, i + BATCH).map((c) => c.text);
    const res = await client.embeddings.create({ model, input: batch });
    for (const item of res.data) vectors.push(item.embedding as number[]);
    console.log(`  · 已完成 ${Math.min(i + BATCH, flat.length)} / ${flat.length}`);
  }

  if (vectors.length !== flat.length) {
    throw new Error(`向量数量(${vectors.length}) 与切片数量(${flat.length}) 不一致`);
  }

  // 3) 写盘
  const index: KnowledgeChunk[] = flat.map((c, i) => ({ ...c, vector: vectors[i] }));
  fs.writeFileSync(INDEX_PATH, JSON.stringify(index), 'utf-8');
  const sizeKB = (fs.statSync(INDEX_PATH).size / 1024).toFixed(1);
  console.log(`\n✅ 索引已写入：${INDEX_PATH}（${sizeKB} KB，${index.length} 条）`);
  console.log(`   embedding 模型：${model}，维度：${index[0]?.vector.length}`);
}

main().catch((err) => {
  console.error('\n[ingest 失败]', err);
  process.exit(1);
});
