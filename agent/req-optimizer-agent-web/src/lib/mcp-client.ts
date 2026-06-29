/**
 * MCP Client（阶段 8.3）—— 工具源从"本地硬编码"切换为"MCP 动态发现"
 *
 * 旧架构：api/agent/route.ts → import { TOOL_SPECS, runTool } from './tools'
 *         （工具的 spec 和 handler 都写死在本项目里）
 *
 * 新架构：api/agent/route.ts → 本模块 → 启动 req-optimizer-mcp 子进程（stdio）
 *         · listTools()  动态发现工具列表（spec 不再写死在 web 端）
 *         · callTool()   把执行委托给 server 进程（handler 跑在 server 端）
 *
 * 好处：
 *   - web 端不再关心工具实现细节，server 加工具，web 自动就有
 *   - RAG 索引、知识库读取等"重资源"集中在 server 进程，避免 web 进程重复加载
 *   - 同一个 server 任何 MCP Host（Cursor/Claude Desktop/本 web）都能复用
 *
 * 连接生命周期：
 *   - 整个 Next 进程内只连一次（模块级单例 Promise），子进程常驻
 *   - 连接失败会清空单例，下次请求重试
 *
 * ─────────────────────────────────────────────────────────────────────
 * 传输方式（Transport）：stdio vs HTTP —— 以后回看就靠这段
 * ─────────────────────────────────────────────────────────────────────
 * MCP 把"传输层"和"协议层"解耦：不管底层怎么连，listTools()/callTool()
 * 的用法完全一样。要切换连接方式，只需要换下面 getClient() 里的 transport，
 * 其余业务代码（getMcpToolSpecs / callMcpTool）一行都不用改。
 *
 * ① stdio（本文件当前用法，本地工具的绝对主流）
 *    - Host 把 server 当【子进程】在本地拉起，走标准输入输出管道通信
 *    - 适用：server 和 web 跑在同一台机器
 *    - 注意：args 里的路径不是"读文件"，而是"用 node 去执行这个 js"
 *      等价于在后台跑命令：  node ../req-optimizer-mcp/dist/index.js
 *    - 特点：一对一（每个 Host 各拉一个子进程），随 Host 启停
 *
 *      import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
 *      const transport = new StdioClientTransport({
 *        command: process.execPath,   // 当前 node 可执行文件
 *        args: [entry],               // 要执行的 server 入口 dist/index.js
 *        stderr: 'inherit',
 *      });
 *
 * ② Streamable HTTP（远程 / 多客户端共享 的主流，旧版叫 SSE）
 *    - server 是一个独立的【HTTP 服务】，Host 通过 URL 连接
 *    - 适用：server 部署在远程/云端，或多个客户端共享同一个 server 实例，
 *      或对接第三方云上的 MCP（此时根本拿不到本地文件路径，只有 URL）
 *    - 特点：多对一（一个 server 服务多个 Host），需独立部署、自己管生命周期
 *
 *      import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
 *      const transport = new StreamableHTTPClientTransport(
 *        new URL(process.env.MCP_SERVER_URL!),   // 如 https://your-server.com/mcp
 *      );
 *
 * 决策口诀：本地同机 → stdio；远程/共享/第三方 → HTTP。
 * ─────────────────────────────────────────────────────────────────────
 */
import * as path from 'path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
// 方案 B（HTTP）切换时解开下一行注释，并注释掉上面的 StdioClientTransport：
// import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { ToolSpec } from './tools';

/**
 * 解析 MCP server 入口（编译后的 dist/index.js）。
 * 优先读环境变量 MCP_SERVER_ENTRY；否则按相对 web 项目根目录的默认位置推导。
 *   web 项目：agent/req-optimizer-agent-web
 *   mcp 项目：agent/req-optimizer-mcp
 * 所以默认就是 ../req-optimizer-mcp/dist/index.js
 */
function resolveServerEntry(): string {
  const fromEnv = process.env.MCP_SERVER_ENTRY;
  if (fromEnv) {
    return path.isAbsolute(fromEnv) ? fromEnv : path.resolve(process.cwd(), fromEnv);
  }
  return path.resolve(process.cwd(), '../req-optimizer-mcp/dist/index.js');
}

let _clientPromise: Promise<Client> | null = null;

/** 拿到（必要时建立）与 MCP server 的连接，进程内单例复用 */
async function getClient(): Promise<Client> {
  if (_clientPromise) return _clientPromise;

  _clientPromise = (async () => {
    const entry = resolveServerEntry();

    // ⭐ 切换 stdio / HTTP 的唯一改动点就在这里（详见文件顶部"传输方式"说明）
    // 当前启用【方案 A：stdio】，下面【方案 B：HTTP】已注释，二选一即可。

    // ─── 方案 A：stdio（本地子进程，当前启用）──────────────────────────
    // 用当前 Node 可执行文件去跑 server 的 dist/index.js
    // stderr: 'inherit' —— server 里的 console.error 日志直接打到 web 进程的终端，方便调试
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [entry],
      stderr: 'inherit',
    });

    // ─── 方案 B：Streamable HTTP（远程/共享，当前注释）───────────────────
    // 用法：server 端要先以 HTTP 模式独立跑起来并暴露一个 /mcp 端点，
    //      然后 web 端配 MCP_SERVER_URL=https://your-server.com/mcp 即可。
    // 切换步骤：
    //   1. 顶部 import 解开下一行注释：
    //      import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
    //   2. 注释掉上面【方案 A】的 transport，解开下面这段：
    //
    // const url = process.env.MCP_SERVER_URL;
    // if (!url) throw new Error('未配置 MCP_SERVER_URL（HTTP 模式必填）');
    // const transport = new StreamableHTTPClientTransport(new URL(url));
    //
    // 注意：HTTP 模式下不需要 entry/子进程，resolveServerEntry() 可以不用调；
    //      其余 client.connect / listTools / callTool 与 stdio 完全一致。
    // ──────────────────────────────────────────────────────────────────

    const client = new Client(
      { name: 'req-optimizer-agent-web', version: '1.0.0' },
      { capabilities: {} },
    );

    // connect 会自动完成 initialize 握手（两种 transport 都一样）
    await client.connect(transport);
    // 连接成功是普通信息日志 → 走 stdout（client 进程没有 stdout 占用限制）
    console.log(`[mcp-client] connected to server: ${entry}`);
    return client;
  })();

  // 连接失败时清空，避免缓存坏连接，下次请求重试
  _clientPromise.catch((e) => {
    console.error('[mcp-client] connect failed:', (e as Error).message);
    _clientPromise = null;
  });

  return _clientPromise;
}

/**
 * 动态发现工具，转成 OpenAI Chat Completions 要的 tools 数组。
 *
 * MCP 的 tool 形状：  { name, description?, inputSchema(JSON Schema) }
 * OpenAI 的 tool 形状：{ type:'function', function:{ name, description, parameters } }
 * 两者差别只是字段名：inputSchema → parameters，外面包一层 function。
 */
export async function getMcpToolSpecs(): Promise<ToolSpec[]> {
  const client = await getClient();
  const { tools } = await client.listTools();
  return tools.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description ?? '',
      parameters: (t.inputSchema as Record<string, unknown>) ?? {
        type: 'object',
        properties: {},
      },
    },
  }));
}

/**
 * 远程调用一个工具，返回纯文本（与原 runTool 的返回值语义保持一致，
 * 这样 api/agent/route.ts 的回灌逻辑几乎不用动）。
 *
 * MCP 返回结构：{ content: [{type:'text', text}], isError? }
 * 我们把所有 text 片段拼起来；isError 时加个前缀但仍返回文本（让 LLM 看到错误自行纠偏）。
 */
export async function callMcpTool(
  name: string,
  args: Record<string, unknown>,
): Promise<string> {
  const client = await getClient();
  try {
    const res = await client.callTool({ name, arguments: args });
    const content = (res.content ?? []) as Array<{ type: string; text?: string }>;
    const text = content
      .filter((c) => c.type === 'text')
      .map((c) => c.text ?? '')
      .join('\n');
    if (res.isError) return `（工具返回错误）${text}`;
    return text || '（工具无文本输出）';
  } catch (e) {
    return `错误：MCP 工具调用失败 ${(e as Error).message}`;
  }
}

// ============================================================
// 阶段 8.5 · Resources / Prompts 客户端封装
// ============================================================
// 注意：和 Tools 用的是同一条连接（同一个 getClient 单例）。
//   - Resources：list_resources / read_resource —— 给用户/UI 浏览、挂载文档
//   - Prompts：  list_prompts / get_prompt       —— 给用户触发预置模板
// 这三类原语共用一个 client，listXxx/readXxx/getXxx 用法风格完全一致。
// ============================================================

export interface McpResourceInfo {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface McpPromptArg {
  name: string;
  description?: string;
  required?: boolean;
}

export interface McpPromptInfo {
  name: string;
  description?: string;
  arguments?: McpPromptArg[];
}

/** 列出 server 暴露的所有资源（本项目即知识库各 .md 文件） */
export async function listMcpResources(): Promise<McpResourceInfo[]> {
  const client = await getClient();
  const { resources } = await client.listResources();
  return resources.map((r) => ({
    uri: r.uri,
    name: (r.name as string) ?? r.uri,
    description: r.description as string | undefined,
    mimeType: r.mimeType as string | undefined,
  }));
}

/** 读取指定资源的全文（把 contents 里的 text 片段拼起来） */
export async function readMcpResource(uri: string): Promise<string> {
  const client = await getClient();
  const res = await client.readResource({ uri });
  const contents = (res.contents ?? []) as Array<{ text?: string }>;
  return contents.map((c) => c.text ?? '').join('\n');
}

/** 列出 server 暴露的所有 prompt 模板（含参数说明） */
export async function listMcpPrompts(): Promise<McpPromptInfo[]> {
  const client = await getClient();
  const { prompts } = await client.listPrompts();
  return prompts.map((p) => ({
    name: p.name,
    description: p.description as string | undefined,
    arguments: (p.arguments as McpPromptArg[] | undefined) ?? [],
  }));
}

/** 取一个 prompt 模板，用入参拼好后返回纯文本（把 messages 的 text 拼接） */
export async function getMcpPrompt(
  name: string,
  args: Record<string, string>,
): Promise<string> {
  const client = await getClient();
  const res = await client.getPrompt({ name, arguments: args });
  const messages = (res.messages ?? []) as Array<{
    content?: { type?: string; text?: string };
  }>;
  return messages
    .map((m) => (m.content?.type === 'text' ? m.content.text ?? '' : ''))
    .filter(Boolean)
    .join('\n\n');
}
