/**
 * Agent 可调用的工具集合（Next.js 版，与 req-optimizer CLI 项目的 6 个工具保持一致）
 *
 * 每个工具：spec（发给 LLM）+ handler（实际执行）。
 */
import * as fs from 'fs';
import * as path from 'path';
import { retrieve, getKnowledgeDir } from './rag';

export interface ToolSpec {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export type ToolHandler = (args: Record<string, unknown>) => Promise<string>;

// ============ 1. search_knowledge ============
const search_knowledge: { spec: ToolSpec; handler: ToolHandler } = {
  spec: {
    type: 'function',
    function: {
      name: 'search_knowledge',
      description:
        '在公司内部知识库里做语义检索，返回与 query 最相关的知识片段。' +
        '当你需要查具体的规范、最佳实践、合规要求、行业指标时使用。',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '要检索的关键词或自然语言问题' },
          topK: { type: 'integer', description: '返回多少条，默认 3，最大 6', default: 3 },
        },
        required: ['query'],
      },
    },
  },
  handler: async (args) => {
    const query = String(args.query || '').trim();
    const topK = Math.min(Math.max(Number(args.topK) || 3, 1), 6);
    if (!query) return '错误：query 不能为空';
    const chunks = await retrieve(query, topK);
    if (chunks.length === 0) return '（未检索到相关片段）';
    return chunks
      .map(
        (c, i) =>
          `[${i + 1}] ${c.source} > ${c.title} (相似度 ${c.score.toFixed(3)})\n${c.text}`,
      )
      .join('\n\n---\n\n');
  },
};

// ============ 2. list_knowledge ============
const list_knowledge: { spec: ToolSpec; handler: ToolHandler } = {
  spec: {
    type: 'function',
    function: {
      name: 'list_knowledge',
      description:
        '列出知识库目录下所有文件名以及每个文件的二级标题清单。' +
        '当你想了解知识库总览、决定下一步搜索哪个主题时使用。',
      parameters: { type: 'object', properties: {} },
    },
  },
  handler: async () => {
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
};

// ============ 3. read_knowledge_file ============
const read_knowledge_file: { spec: ToolSpec; handler: ToolHandler } = {
  spec: {
    type: 'function',
    function: {
      name: 'read_knowledge_file',
      description:
        '读取知识库里某个文件的完整内容。当 search_knowledge 返回的片段不够，' +
        '或你需要看到上下文全文时使用。先用 list_knowledge 拿到准确文件名。',
      parameters: {
        type: 'object',
        properties: {
          filename: {
            type: 'string',
            description: '文件名（含扩展名），例如 "登录-最佳实践.md"',
          },
        },
        required: ['filename'],
      },
    },
  },
  handler: async (args) => {
    const filename = String(args.filename || '');
    if (!filename) return '错误：filename 不能为空';
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return '错误：filename 不能包含路径分隔符';
    }
    const dir = getKnowledgeDir();
    const full = path.join(dir, filename);
    if (!fs.existsSync(full)) return `错误：文件不存在 ${filename}`;
    return fs.readFileSync(full, 'utf-8');
  },
};

// ============ 4. save_optimized_doc ============
// 注意：网页版改为返回 markdown 内容本身，由前端处理保存/下载
const save_optimized_doc: { spec: ToolSpec; handler: ToolHandler } = {
  spec: {
    type: 'function',
    function: {
      name: 'save_optimized_doc',
      description:
        '提交最终优化好的需求文档（Markdown）。' +
        '只有当你已经收集完所需信息、产出了完整 6 段式文档时才调用。' +
        '调用此工具后任务即完成。',
      parameters: {
        type: 'object',
        properties: {
          markdown: { type: 'string', description: '完整的 Markdown 文档内容' },
          filename: {
            type: 'string',
            description: '推荐的文件名，可选，默认 optimized-by-agent.md',
          },
        },
        required: ['markdown'],
      },
    },
  },
  handler: async (args) => {
    const md = String(args.markdown || '');
    if (!md.trim()) return '错误：markdown 不能为空';
    const filename = String(args.filename || 'optimized-by-agent.md');
    return `✅ 已提交最终文档：${filename}（${md.length} 字符）。用户可在页面下载。`;
  },
};

// ============ 5. get_current_time ============
const get_current_time: { spec: ToolSpec; handler: ToolHandler } = {
  spec: {
    type: 'function',
    function: {
      name: 'get_current_time',
      description: '获取服务器当前时间，返回 ISO 字符串。需要时间戳/日期时使用。',
      parameters: { type: 'object', properties: {} },
    },
  },
  handler: async () => new Date().toISOString(),
};

// ============ 6. fetch_url ============
const fetch_url: { spec: ToolSpec; handler: ToolHandler } = {
  spec: {
    type: 'function',
    function: {
      name: 'fetch_url',
      description:
        '抓取指定 URL 的网页内容，返回截断后的纯文本（最多 4000 字符）。' +
        '用于获取知识库里没有的外部资料。仅 http/https 协议。',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: '完整 URL，必须以 http(s):// 开头' },
        },
        required: ['url'],
      },
    },
  },
  handler: async (args) => {
    const url = String(args.url || '');
    if (!/^https?:\/\//i.test(url)) return '错误：url 必须以 http(s):// 开头';
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
};

// ============ 导出 ============
export const TOOLS: Record<string, { spec: ToolSpec; handler: ToolHandler }> = {
  search_knowledge,
  list_knowledge,
  read_knowledge_file,
  save_optimized_doc,
  get_current_time,
  fetch_url,
};

export const TOOL_SPECS: ToolSpec[] = Object.values(TOOLS).map((t) => t.spec);

export async function runTool(name: string, argsJson: string): Promise<string> {
  const tool = TOOLS[name];
  if (!tool) return `错误：未知工具 ${name}`;
  let args: Record<string, unknown> = {};
  try {
    args = argsJson ? (JSON.parse(argsJson) as Record<string, unknown>) : {};
  } catch (e) {
    return `错误：参数 JSON 解析失败 ${(e as Error).message}\n原始：${argsJson}`;
  }
  try {
    return await tool.handler(args);
  } catch (e) {
    return `错误：工具执行失败 ${(e as Error).message}`;
  }
}

/**
 * 提取最后一次 save_optimized_doc 调用的 markdown，供前端直接下载。
 * 我们这里不再依赖 handler 内部保存——保存交给前端。
 */
export function extractSavedDoc(argsJson: string): { markdown: string; filename: string } | null {
  try {
    const args = JSON.parse(argsJson || '{}') as Record<string, unknown>;
    const md = String(args.markdown || '');
    if (!md.trim()) return null;
    return {
      markdown: md,
      filename: String(args.filename || 'optimized-by-agent.md'),
    };
  } catch {
    return null;
  }
}
