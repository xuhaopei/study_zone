# Req-Optimizer MCP Server · 阶段 8

把 `req-optimizer-agent-web` 项目里的工具改造成 **MCP (Model Context Protocol) Server**，
让 Cursor / Codebuddy / Claude Desktop 等 MCP Host 可以直接调用这些工具。

## 学习路径

| 阶段 | 目标 | 状态 |
|---|---|---|
| 8.0 | 跑通一个最小 hello server，让 IDE 能调用 | ✅ 完成 |
| **8.1**（当前） | 5 个真实工具（search/list/read/time/fetch）+ 知识库加载 | ✅ 完成 |
| 8.2 | 在 IDE 里实际用它做需求优化对话 | 等你测 |
| 8.3 | 让 `req-optimizer-agent-web` 也通过 MCP client 调本 server | 后续 |
| 8.4 | 进阶：暴露 Resources（知识库文件）+ Prompts（"优化需求"模板） | 后续 |

## 当前暴露的 5 个工具

| 工具 | 入参 | 用途 |
|---|---|---|
| `search_knowledge` | `query` + `topK?` | RAG 语义检索知识库 |
| `list_knowledge` | (无) | 列出知识库目录文件 + 二级标题 |
| `read_knowledge_file` | `filename` | 读取整篇 .md 文档 |
| `get_current_time` | (无) | 返回 ISO 时间字符串 |
| `fetch_url` | `url` | 抓取网页，纯文本前 4000 字 |

## MCP 简介

MCP 是 Anthropic 2024 年 11 月推的开放协议，用一句话概括：

> **LSP 之于 IDE → MCP 之于 AI Agent**

让"工具"这层标准化，从此一个 MCP server 写好，Claude Desktop / Cursor / Codebuddy
所有 MCP Host 都能用。

三个角色：

```
┌─────────────┐  MCP   ┌─────────────┐
│  MCP Host   │◄──────►│ MCP Server  │
│ (Cursor /   │ stdio  │ (本项目)     │
│  Codebuddy) │  or    │              │
└─────────────┘  http  └─────────────┘
       ▲
       │ 调用 LLM
       ▼
   ┌─────────┐
   │   LLM   │
   └─────────┘
```

## 快速开始

### 1. 安装 + 构建

```bash
cd agent/req-optimizer-mcp
npm install
npm run build      # 编译 TS → dist/index.js
```

### 2. 配置 .env.local（**8.1 必填**）

```bash
cp .env.example .env.local
# 然后编辑 .env.local，填入 EMBEDDING_API_KEY
```

> 注意：MCP server 启动时拿不到 IDE 的环境变量，必须在本目录单独配 .env.local。
> 也可以直接复用 `req-optimizer-agent-web/.env.local` 里的 EMBEDDING_* 三个变量。

### 3. 在 IDE 里配置

#### Codebuddy IDE

`Settings → MCP 标签 → Add MCP`，填入：

```json
{
  "mcpServers": {
    "req-optimizer": {
      "type": "stdio",
      "command": "node",
      "args": [
        "d:/project/study_zone/agent/req-optimizer-mcp/dist/index.js"
      ],
      "description": "需求优化工具集（hello demo）"
    }
  }
}
```

#### Cursor

`Settings → MCP → + New MCP Server`（或编辑 `~/.cursor/mcp.json`）：

```json
{
  "mcpServers": {
    "req-optimizer": {
      "command": "node",
      "args": [
        "d:/project/study_zone/agent/req-optimizer-mcp/dist/index.js"
      ]
    }
  }
}
```

#### Claude Desktop

编辑 `%APPDATA%\Claude\claude_desktop_config.json`（Windows）：

```json
{
  "mcpServers": {
    "req-optimizer": {
      "command": "node",
      "args": [
        "d:/project/study_zone/agent/req-optimizer-mcp/dist/index.js"
      ]
    }
  }
}
```

> 路径替换成你本地真实的绝对路径。Windows 反斜杠也行，但 JSON 里得写成 `\\`。

### 4. 验证（8.1 测试场景）

修改配置后**重启 IDE**，看到 `req-optimizer` server 状态为绿色（已连接）。
然后在 AI 对话里逐个测：

#### A. 列出知识库（最快验证）

> 用 list_knowledge 工具列出我知识库里都有什么

预期：返回类似
```
📄 登录-最佳实践.md
   · 一、密码安全
   · 二、防暴力破解
   ...
📄 合规-PIPL基础.md
   ...
```

#### B. 语义检索

> 用 search_knowledge 搜一下 "bcrypt cost 推荐值是多少"

预期：返回 3 段相关知识片段 + 相似度分数。

#### C. 读全文 + 时间

> 调用 read_knowledge_file 读 "登录-最佳实践.md"
> 再用 get_current_time 告诉我现在的服务器时间

#### D. 抓网页

> 用 fetch_url 抓取 https://example.com 看看返回什么

## 调试

### 看 stderr 日志

stdio 协议下，server **绝对不能 console.log 到 stdout**（会污染协议）。
所有调试信息走 `console.error`，IDE 通常在"MCP server logs"面板里展示。

### 用官方 inspector 离线测试

不依赖 IDE，先在本地命令行验证 server 是否工作：

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

会启动一个 web UI（默认 http://localhost:5173），点 "List Tools" 看到 hello，
点 "Call Tool" 填 `name: "test"` 就能看到返回。

### 常见报错

| 报错 | 原因 | 解决 |
|---|---|---|
| `server xxx not found` | 第一次拉起较慢 | 等 1~2 分钟 |
| `command not found: node` | IDE 的 PATH 不包含 node | 给 node 写绝对路径，如 `C:\Program Files\nodejs\node.exe` |
| 协议解析错误 | server 里 `console.log` 了 | 全部改成 `console.error` |
| 工具列表为空 | `setRequestHandler(ListToolsRequestSchema, ...)` 没写 | 检查 src/index.ts |

## 协议速查（学习用）

MCP 走 **JSON-RPC 2.0**，关键 method：

| Method | 谁发 | 用途 |
|---|---|---|
| `initialize` | Host → Server | 握手，互相告诉对方支持哪些 capabilities |
| `tools/list` | Host → Server | 问 server "你有哪些工具？" |
| `tools/call` | Host → Server | "请调用这个工具，参数是 ..." |
| `resources/list` `resources/read` | Host → Server | 资源相关（阶段 8.4） |
| `prompts/list` `prompts/get` | Host → Server | Prompt 模板相关（阶段 8.4） |

SDK 已经把 method 名封装成了 `*RequestSchema`，我们只要写 handler 就好。

## 目录结构

```
req-optimizer-mcp/
├── package.json
├── tsconfig.json
├── .env.example          # 配置模板
├── .env.local            # 本地配置（不提交）
├── src/
│   ├── index.ts          # stdio server 入口 + 5 个工具的 list/call 路由
│   └── rag.ts            # RAG 检索逻辑（复用 req-optimizer-web 索引）
└── dist/                 # 编译产物（npm run build 生成）
    ├── index.js
    └── rag.js
```

## 后续阶段

跑通 8.1 后：

- **8.2**：让 IDE 用这些工具帮你写一份"用户登录"PRD，体验"IDE 里直接产出文档"
- **8.3**：改造 `req-optimizer-agent-web`，让它通过 MCP client 调本 server（工具源从硬编码 → 动态发现）
- **8.4**：暴露 Resources / Prompts，让 IDE 把整个知识库当资源浏览，让 "优化需求" 变成一个 slash command
