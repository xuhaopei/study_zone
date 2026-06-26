#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
// 工具 A：无参工具
const helloTool = {
    name: 'hello xxxx',
    description: '返回一句问候语',
    schema: z.object({}), // 没有参数
    async handler(_args) {
        return 'Hello from my MCP server!';
    },
};
const TOOLS = [helloTool];
/* ===== ② 建 Server ===== */
const server = new Server({ name: 'my-mcp', version: '0.1.0' }, { capabilities: { tools: {} } });
/* ===== ③ 注册"列出工具"处理器 ===== */
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: zodToJsonSchema(t.schema), // zod → JSON Schema
    })),
}));
/* ===== ④ 注册"调用工具"处理器 ===== */
server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: rawArgs } = req.params;
    const tool = TOOLS.find((t) => t.name === name);
    if (!tool) {
        return { content: [{ type: 'text', text: `未知工具: ${name}` }], isError: true };
    }
    // 用 zod 校验入参（也会自动填默认值）
    const parsed = tool.schema.safeParse(rawArgs ?? {});
    if (!parsed.success) {
        return {
            content: [{ type: 'text', text: '参数校验失败: ' + parsed.error.message }],
            isError: true,
        };
    }
    try {
        const text = await tool.handler(parsed.data);
        return { content: [{ type: 'text', text }] };
    }
    catch (e) {
        return {
            content: [{ type: 'text', text: '执行失败: ' + e.message }],
            isError: true,
        };
    }
});
/* ===== ⑤ 启动（stdio 传输） ===== */
async function main() {
    await server.connect(new StdioServerTransport());
    // 注意：必须用 console.error，不要用 console.log
    // 因为 stdout 是 MCP 协议通道，打印任何东西都会把协议搞坏
    console.error('[my-mcp] started');
}
main().catch((e) => {
    console.error('[my-mcp] fatal', e);
    process.exit(1);
});
