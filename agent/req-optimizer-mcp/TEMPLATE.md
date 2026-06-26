# MCP Server 最小模板（看懂这份再回去看 src/index.ts）

## 1. 依赖

```bash
npm i @modelcontextprotocol/sdk zod zod-to-json-schema
npm i -D typescript @types/node
```

## 2. tsconfig.json 关键项

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["src"]
}
```

## 3. package.json 关键项

```json
{
  "type": "module",
  "bin": { "my-mcp": "dist/index.js" },
  "scripts": { "build": "tsc" }
}
```

> 注意：`"type": "module"` 必须有，MCP SDK 是 ESM。  
> import 路径要写 `.js`（哪怕源文件是 `.ts`），这是 Node16 ESM 规则。

---

## 4. 最小 server（src/index.ts）

```ts
#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

/* ===== ① 定义工具：每个工具 = name + description + schema + handler ===== */

// 工具 A：无参工具
const helloTool = {
  name: 'hello',
  description: '返回一句问候语',
  schema: z.object({}),                       // 没有参数
  async handler(_args: {}) {
    return 'Hello from my MCP server!';
  },
};

// 工具 B：带参工具
const addTool = {
  name: 'add',
  description: '把两个数相加',
  schema: z.object({
    a: z.number().describe('第一个加数'),
    b: z.number().describe('第二个加数'),
  }),
  async handler({ a, b }: { a: number; b: number }) {
    return `结果是 ${a + b}`;
  },
};

const TOOLS = [helloTool, addTool];

/* ===== ② 建 Server ===== */
const server = new Server(
  { name: 'my-mcp', version: '0.1.0' },
  { capabilities: { tools: {} } },            // 声明：我提供 tools 能力
);

/* ===== ③ 注册"列出工具"处理器 ===== */
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: zodToJsonSchema(t.schema) as any, // zod → JSON Schema
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
    const text = await tool.handler(parsed.data as any);
    return { content: [{ type: 'text', text }] };
  } catch (e) {
    return {
      content: [{ type: 'text', text: '执行失败: ' + (e as Error).message }],
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
```

---

## 5. 跑起来

```bash
npm run build
# 然后在 IDE 的 MCP 配置里加：
# {
#   "type": "stdio",
#   "command": "node",
#   "args": ["<你的项目绝对路径>/dist/index.js"]
# }
```

---

## 6. 对照你那份 index.ts 多出来的"非核心"部分

| 多出来的东西 | 作用 | 必须吗？ |
|---|---|---|
| `dotenv` 加载 `.env.local` | 读 API Key 等环境变量 | 不必须（看业务） |
| `defineTool<S>(def)` 泛型函数 | 让 TS 自动推导 handler 参数类型，不用手写类型 | 不必须，是为了类型安全更爽 |
| `TOOL_DEFS` 数组 + `interface ToolDef` | 把所有工具收拢到一处，新增工具只改一行 | 不必须，是组织代码的技巧 |
| `zodToJsonSchema(schema, { target: 'openAi' })` | 输出更干净的 JSON Schema（去掉 `$ref` 等） | 不必须，默认调用也行 |
| `.describe(...)` / `.refine(...)` / `.url()` | zod 的字段说明 & 自定义校验 | 不必须，是给 LLM 看的字段说明 + 安全防护 |

> 一句话：**核心就是上面 4 步**，剩下都是装修。

---

## 7. 常见坑

1. **不要 `console.log`**：stdout 是协议通道，会把 JSON-RPC 搞乱，日志一律用 `console.error`。
2. **import 路径必须带 `.js`**：因为是 ESM + Node16 模块解析。
3. **`type: "module"`** 不能少。
4. **`capabilities: { tools: {} }`** 必须声明，否则 Host 不会调你的 list_tools。
5. **handler 必须返回 `{ content: [{type:'text', text:'...'}] }`** 这个结构，不能直接 return 字符串。
```
