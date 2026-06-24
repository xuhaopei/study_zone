# Req-Optimizer Agent Web · 阶段 6

把阶段 5 的 CLI Agent（`req-optimizer/src/agent.ts`）搬上网页，做成**聊天式 UI**：
底部输入需求 → Agent 自己规划 → 实时看到 **think / tool_call / tool_result** 滚动 → 最后下载 6 段式 PRD 文档。

## 项目特色

- **聊天式 UI**：底部输入框 + 中间气泡流（类 ChatGPT）
- **思考链可视化**：每条 assistant 气泡按 turn 聚合，工具调用可逐个展开看参数+返回
- **完整 trace 下载**：模型每一步全过程导出为 JSON，方便回放与教学
- **复用前期成果**：知识库与索引直接读 `../req-optimizer-web/knowledge.index.json`，不重复 ingest

## 目录结构

```
req-optimizer-agent-web/
├── package.json
├── .env.local                 # ⚠️ 不提交。从 ../req-optimizer-web 复制 + 加 Chat key
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx           # 聊天主页面
│   │   ├── globals.css
│   │   └── api/agent/route.ts # /api/agent NDJSON 流式接口
│   └── lib/
│       ├── rag.ts             # 复用 web 项目的索引
│       ├── tools.ts           # 6 个 Agent 工具
│       └── prompt.ts          # SYSTEM_PROMPT
```

## 快速启动

```bash
# 1. 确保 ../req-optimizer-web/ 已经 ingest 过：
cd ../req-optimizer-web
npm run ingest   # 会生成 knowledge.index.json

# 2. 启动本项目（端口 3002）：
cd ../req-optimizer-agent-web
npm install
npm run dev
```

打开 <http://localhost:3002>，点 **"使用样例需求"** 或自己粘贴一份"烂需求"，按发送即可。

## NDJSON 事件协议（学习重点）

`/api/agent` 是这条 Agent 工程链路的核心。它流式吐出以下事件：

| 事件 | 何时发出 | 用途 |
|---|---|---|
| `start` | 请求一开始 | 告诉前端 model 名、工具清单 |
| `turn_start` | 每个新 turn | 让前端建立 assistant 气泡 |
| `think` | 模型有文字思考 | 显示在 assistant 气泡正文 |
| `tool_call` | 模型决定调工具 | 前端显示"调用中"占位 |
| `tool_result` | 工具执行完成 | 把返回内容填回对应工具行 |
| `saved_doc` | 模型调用 `save_optimized_doc` | 单独抛出文档便于下载 |
| `final` | finish_reason=stop 时 | 模型给出最终自然语言回复 |
| `trace` | 任务收尾 | 完整 messages 数组（前端下载） |
| `done` | 最后一条 | 统计：轮数 / 工具调用次数 / 总耗时 |
| `error` | 任意时刻可能 | 错误信息 |

每行一个 JSON，用 `\n` 分割（NDJSON）。前端用 `getReader()` + `TextDecoder` 增量切行。

## 与阶段 5 CLI 的差异

| 维度 | 阶段 5 CLI (`req-optimizer/src/agent.ts`) | 阶段 6 Web (本项目) |
|---|---|---|
| 入口 | `npm run agent` | 浏览器 |
| 输出 | 终端彩色日志 | UI 气泡 + 工具调用折叠卡 |
| 工具结果 | `console.log` | 流式 NDJSON 事件 |
| 文档保存 | 服务端直接写盘 | 流给前端，浏览器下载 |
| 思考链 | 一次性 dump 到 `agent-trace.json` | **边运行边滚动** + 任务结束一并下载 |

## 端口规划

| 项目 | 端口 |
|---|---|
| `req-optimizer-web` (阶段 3-4 RAG 演示) | 3001 |
| `req-optimizer-agent-web` (阶段 6 Agent 演示) | 3002 |

两个项目可以同时跑，互不冲突。
