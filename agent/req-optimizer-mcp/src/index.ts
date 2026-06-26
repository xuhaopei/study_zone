#!/usr/bin/env node
/**
 * Req-Optimizer MCP Server · 阶段 8.1（重构版）
 *
 * 把 req-optimizer-agent-web 里的 5 个工具搬过来：
 *   1. search_knowledge      RAG 语义检索
 *   2. list_knowledge        列出知识库总览
 *   3. read_knowledge_file   读取整篇文档
 *   4. get_current_time      获取当前 ISO 时间
 *   5. fetch_url             抓取外部网页（前 4000 字符）
 *
 * 学习要点：
 *   - 用一份 zod schema 同时给出"运行时校验"+"协议 inputSchema"，避免重复声明
 *   - 工具定义统一进 TOOL_DEFS 数组，新增工具只改一处
 *   - dotenv 加载 .env.local（MCP server 启动时拿不到 IDE 的环境变量，需要自己加载）
 *   - 用 console.error 作 stderr 日志（不污染 stdio 协议）
 */

// 必须最先加载 .env.local —— 后面所有 process.env.* 才有值
// 注意：dotenv/config 会以 process.cwd() 为基准找 .env，
// 但 MCP server 启动时 cwd 是 Host 的工作目录，不可靠 —— 我们手动指定本项目根目录
import { config as loadEnv } from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(__filename), '..');

// 优先 .env.local，其次 .env
for (const f of ['.env.local', '.env']) {
  const p = path.join(PROJECT_ROOT, f);
  if (fs.existsSync(p)) {
    loadEnv({ path: p });
    console.error(`[req-optimizer-mcp] loaded env from ${f}`);
    break;
  }
}

// ⚠️ 业务 import 必须在 dotenv 之后，否则 rag.ts 里读 process.env.EMBEDDING_API_KEY 会拿不到
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { getKnowledgeDir, retrieve } from './rag.js';

// ============================================================
// 工具定义：一份 zod schema 同时承担"运行时校验" + "协议 inputSchema"
// ============================================================
// 关键技巧：
//   - schema：用 z.object({...}) 声明，.describe() 加字段说明（会出现在 JSON Schema 里）
//   - handler：接收 unknown args，内部用 schema.parse 校验
//   - 通过 zodToJsonSchema(schema) 自动生成 MCP 要的 inputSchema
//
// 新增工具只需在 TOOL_DEFS 里加一项，list_tools / call_tool 自动适配。
// ============================================================

interface ToolDef<S extends z.ZodTypeAny> {
  name: string;
  description: string;
  /** zod schema，描述入参 */
  schema: S;
  /** 工具实现：拿到已校验的入参，返回纯文本结果 */
  handler: (args: z.infer<S>) => Promise<string>;
}

/** 工具数组（按声明顺序展示给 LLM） */
const TOOL_DEFS = [
  defineTool({
    name: 'search_knowledge',
    description:
      '在公司内部知识库里做语义检索（RAG），返回与 query 最相关的知识片段。' +
      '当你需要查具体的规范、最佳实践、合规要求、行业指标时使用。',
    schema: z.object({
      query: z.string().min(1).describe('要检索的关键词或自然语言问题'),
      topK: z
        .number()
        .int()
        .min(1)
        .max(6)
        .default(3)
        .describe('返回多少条，默认 3，最大 6'),
    }),
    async handler({ query, topK }) {
      const chunks = await retrieve(query.trim(), topK);
      if (chunks.length === 0) return '（未检索到相关片段）';
      return chunks
        .map(
          (c, i) =>
            `[${i + 1}] ${c.source} > ${c.title} (相似度 ${c.score.toFixed(3)})\n${c.text}`,
        )
        .join('\n\n---\n\n');
    },
  }),

  defineTool({
    name: 'list_knowledge',
    description:
      '列出知识库目录下所有文件名以及每个文件的二级标题清单。' +
      '当你想了解知识库总览、决定下一步搜索哪个主题时使用。',
    // 无参工具：用空 object schema
    schema: z.object({}),
    async handler() {
      const dir = getKnowledgeDir();
      if (!fs.existsSync(dir)) return `错误：知识库目录不存在 ${dir}`;
      const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
      if (files.length === 0) return '（知识库为空）';
      const lines: string[] = [];
      for (const f of files) {
        lines.push(`📄 ${f}`);
        const raw = fs.readFileSync(path.join(dir, f), 'utf-8');
        const titles = raw.split('\n').filter((l) => /^##\s+/.test(l));
        for (const t of titles) {
          lines.push(`   ${t.replace(/^##\s+/, '· ')}`);
        }
      }
      return lines.join('\n');
    },
  }),

  defineTool({
    name: 'read_knowledge_file',
    description:
      '读取知识库里某个文件的完整内容。' +
      '当 search_knowledge 返回的片段不够，或你需要看到上下文全文时使用。' +
      '先用 list_knowledge 拿到准确文件名。',
    schema: z.object({
      filename: z
        .string()
        .min(1)
        // 用 zod refine 在 schema 层就把"路径分隔符"拦截掉
        .refine((s) => !s.includes('..') && !s.includes('/') && !s.includes('\\'), {
          message: 'filename 不能包含路径分隔符',
        })
        .describe('文件名（含扩展名），例如 "登录-最佳实践.md"'),
    }),
    async handler({ filename }) {
      const dir = getKnowledgeDir();
      const full = path.join(dir, filename);
      if (!fs.existsSync(full)) return `错误：文件不存在 ${filename}`;
      return fs.readFileSync(full, 'utf-8');
    },
  }),

  defineTool({
    name: 'get_current_time',
    description: '获取服务器当前时间，返回 ISO 字符串。需要时间戳/日期时使用。',
    schema: z.object({}),
    async handler() {
      return new Date().toISOString();
    },
  }),

  defineTool({
    name: 'fetch_url',
    description:
      '抓取指定 URL 的网页内容，返回截断后的纯文本（最多 4000 字符）。' +
      '用于获取知识库里没有的外部资料。仅 http/https 协议。',
    schema: z.object({
      url: z
        .string()
        .url() // zod 内置 URL 校验
        .refine((u) => /^https?:\/\//i.test(u), {
          message: 'url 必须以 http(s):// 开头',
        })
        .describe('完整 URL，必须以 http(s):// 开头'),
    }),
    async handler({ url }) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 8000);
        const res = await fetch(url, { signal: ctrl.signal });
        clearTimeout(timer);
        if (!res.ok) return `错误：HTTP ${res.status}`;
        const text = await res.text();
        const plain = text
          .replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        return plain.slice(0, 4000);
      } catch (e) {
        return `错误：${(e as Error).message}`;
      }
    },
  }),
];

/**
 * 工具定义辅助函数 —— 关键作用是让 TS 推导出每个工具的入参类型。
 * 不加这个函数直接写数组，handler 里 args 会是 `any`，失去类型保护。
 */
function defineTool<S extends z.ZodTypeAny>(def: ToolDef<S>): ToolDef<S> {
  return def;
}

// ============================================================
// MCP Server 实例 + handler
// ============================================================
const server = new Server(
  {
    name: 'req-optimizer-mcp',
    version: '0.3.0',
  },
  {
    capabilities: { tools: {} },
  },
);

// list_tools：从 TOOL_DEFS 派生，zodToJsonSchema 自动转出 inputSchema
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOL_DEFS.map((t) => ({
      name: t.name,
      description: t.description,
      // zodToJsonSchema 默认会包一层 $schema/$ref，target=openAi 模式只输出我们需要的部分
      // 这里直接用默认即可（MCP Host 容忍多余字段）
      inputSchema: zodToJsonSchema(t.schema, { target: 'openAi' }) as never,
    })),
  };
});

// call_tool：按 name 找到对应 def，用 zod 校验入参，调 handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: rawArgs } = request.params;
  const tool = TOOL_DEFS.find((t) => t.name === name);
  if (!tool) {
    return {
      content: [{ type: 'text', text: `未知工具: ${name}` }],
      isError: true,
    };
  }

  // ⭐ 这里就是 zod 的关键价值：一行搞定"类型检查 + 默认值填充 + 错误信息"
  const parsed = tool.schema.safeParse(rawArgs ?? {});
  if (!parsed.success) {
    return {
      content: [
        {
          type: 'text',
          text: `参数校验失败：\n${parsed.error.errors
            .map((e) => `  - ${e.path.join('.') || '(root)'}: ${e.message}`)
            .join('\n')}`,
        },
      ],
      isError: true,
    };
  }

  try {
    // parsed.data 类型已经被 zod 推导，handler 拿到的入参完全类型安全
    const text = await tool.handler(parsed.data as never);
    return { content: [{ type: 'text', text }] };
  } catch (err) {
    const msg = (err as Error).message || String(err);
    console.error(`[req-optimizer-mcp] tool ${name} failed:`, msg);
    return {
      content: [{ type: 'text', text: `工具执行失败: ${msg}` }],
      isError: true,
    };
  }
});

// ============================================================
// 启动
// ============================================================
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    `[req-optimizer-mcp] server started, tools: ${TOOL_DEFS.map((t) => t.name).join(' / ')}`,
  );
}

main().catch((err) => {
  console.error('[req-optimizer-mcp] fatal:', err);
  process.exit(1);
});
