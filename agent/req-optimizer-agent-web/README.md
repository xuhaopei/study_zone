# Req-Optimizer Agent Web · 阶段 6 → 7

一个**多 Agent 协作 + 自我迭代**的需求优化网页应用：
底部输入"烂需求" → **作者 Agent** 检索知识库 + 思考 + 产出 6 段式 PRD → **评审 Agent** 打分给反馈 →
作者根据反馈定向改写 → 循环直到达标。

> 这个项目同时是 AI Agent 学习路线 **阶段 6/7** 的实操样例，覆盖
> *function calling / streaming / function-calling agent loop / multi-agent / self-refine* 等核心模式。

## 演进路线

| 阶段 | 关键能力 |
|---|---|
| 6 · 单 Agent 网页化 | 把 CLI Agent 搬上网页，聊天式 UI 实时显示 think / tool_call / tool_result |
| 7 · 多 Agent 协作 | 加入**评审 Agent**，独立 LLM 模型给文档打分 + 反馈 |
| 7.1 · 模型多对多 | 作者 / 评审独立选模型，支持 5 个梯度模型混搭实验 |
| 7.2 · Actor-Critic 自我迭代 | 评审 → 反馈 → 改写循环，分数 ≥ 9 提前结束，最多 3 轮 |

## 项目特色

- 🧑‍💻 **聊天式 UI**：底部输入框 + 中间气泡流（类 ChatGPT）
- 🔁 **Actor-Critic 自我迭代**：一键自动跑 "作者 → 评审 → 改写" 循环
- 🎚️ **多模型多对多**：作者和评审各自独立选 LLM，支持 5 个梯度模型自由混搭
- 🧠 **思考链可视化**：每条 assistant 气泡按 turn 聚合，工具调用可逐个展开
- 📊 **结构化评审卡片**：5 维评分 + 章节点评 + 修改建议，迭代历史每轮可回看
- 📦 **完整 trace 下载**：模型每一步全过程导出为 JSON，方便回放与教学
- ♻️ **复用前期成果**：知识库与索引直接读 `../req-optimizer-web/knowledge.index.json`，不重复 ingest

## 目录结构

```
req-optimizer-agent-web/
├── package.json
├── .env.local                       # ⚠️ 不提交。配置多个模型的 API_KEY/BASE_URL/MODEL
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # 聊天主页面（含多模型下拉、迭代进度卡、评审卡）
│   │   ├── globals.css
│   │   └── api/
│   │       ├── agent/route.ts       # 作者 Agent：流式 think + tool_calls
│   │       ├── review/route.ts      # 评审 Agent：流式 JSON 评分（含 6 档 JSON 兜底）
│   │       ├── refine/route.ts      # 编排器：Actor-Critic 自我迭代循环
│   │       └── models/route.ts      # GET 公开模型元信息（隐藏 API key）
│   └── lib/
│       ├── rag.ts                   # 复用 req-optimizer-web 的索引
│       ├── tools.ts                 # Agent 工具（list / search / read / time / fetch）
│       ├── prompt.ts                # 作者 Agent system prompt
│       ├── reviewer-prompt.ts       # 评审 Agent system prompt
│       ├── refine-prompt.ts         # 改写轮次的 messages 构造 + 评审 → markdown 反馈
│       └── models.ts                # 模型注册表 + resolveModel()
```

## 快速启动

```bash
# 1. 确保 ../req-optimizer-web/ 已经 ingest 过：
cd ../req-optimizer-web
npm run ingest                       # 生成 knowledge.index.json

# 2. 配置 .env.local（见下一节）

# 3. 启动本项目（端口 3002）：
cd ../req-optimizer-agent-web
npm install
npm run dev
```

打开 <http://localhost:3002>。

## 环境变量（.env.local）

每个模型用 `CHAT_<ID>_API_KEY / _BASE_URL / _MODEL` 三个变量描述。默认模型由
`CHAT_DEFAULT_ID` 指定。

```ini
# 默认模型
CHAT_DEFAULT_ID=claude-sonnet-46

# qproxy 网关上的模型（4 个共用同一个 API_KEY 和 BASE_URL）
CHAT_CLAUDE_SONNET_46_API_KEY=xxxxxxxxxx
CHAT_CLAUDE_SONNET_46_BASE_URL=xxxx
CHAT_CLAUDE_SONNET_46_MODEL=claude-sonnet-4-6

CHAT_KIMI_K2_5_API_KEY=xxxxxxxxxx
CHAT_KIMI_K2_5_BASE_URL=xxxx
CHAT_KIMI_K2_5_MODEL=kimi-k2.5

CHAT_HY3_PREVIEW_API_KEY=xxxxxxxxxx
CHAT_HY3_PREVIEW_BASE_URL=xxxx
CHAT_HY3_PREVIEW_MODEL=hy3-preview

CHAT_CLAUDE_HAIKU_API_KEY=xxxxxxxxxx
CHAT_CLAUDE_HAIKU_BASE_URL=xxxx
CHAT_CLAUDE_HAIKU_MODEL=claude-haiku-4-5

# DeepSeek 直连
CHAT_DEEPSEEK_CHAT_API_KEY=sk-xxxxxxxxxx
CHAT_DEEPSEEK_CHAT_BASE_URL=https://api.deepseek.com
CHAT_DEEPSEEK_CHAT_MODEL=deepseek-chat

# Embedding（RAG 用，与 Chat 模型独立）
EMBEDDING_API_KEY=xxxxxxxxxx
EMBEDDING_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
EMBEDDING_MODEL=text-embedding-v2

# 复用 req-optimizer-web 的知识库
KNOWLEDGE_DIR=../req-optimizer-web/knowledge
KNOWLEDGE_INDEX=../req-optimizer-web/knowledge.index.json
```

新增供应商：在 `src/lib/models.ts` 加一行 + `.env.local` 补三个变量即可。

## 五个梯度模型（用于对照实验）

| id | 模型 | 渠道 | 评估 | 用途 |
|---|---|---|---|---|
| `claude-sonnet-46` | Claude Sonnet 4.6 | qproxy | ⭐⭐⭐⭐⭐ | 基线最强 |
| `kimi-k2-5` | Kimi K2.5 | qproxy | ⭐⭐⭐⭐ | 中文长文档强 |
| `deepseek-chat` | DeepSeek Chat | 直连 | ⭐⭐⭐⭐ | 流式丝滑 |
| `hy3-preview` | Hunyuan 3 Preview | qproxy | ⭐⭐⭐ | 国产对照组 |
| `claude-haiku` | Claude Haiku | qproxy | ⭐⭐⭐ | 小杯 Claude，便宜快但弱 |

故意保留偏弱模型用于观察 Agent 框架在弱 LLM 上的鲁棒性（容错、JSON 兜底、迭代收敛）。

## 使用方式

### 1. 单次跑作者 Agent

底部输入需求 → 点 **发送** → 看气泡流。

### 2. 手动评审

作者跑完后，**FinalDocCard** 上有 `📝 提交评审` 按钮，调用评审 Agent 给出 5 维评分。

### 3. 自动迭代（Actor-Critic）

输入需求后点 **🤖 自动迭代**：

```
[第 1 轮]
  作者 Agent (writerModelId)     →  6 段式 markdown
  评审 Agent (reviewerModelId)   →  打分
  if score >= 9: 提前结束
[第 2 轮 / 第 3 轮]
  作者拿到 "上版文档 + 评审反馈" → 定向改写
  评审重新打分
  ...
最多 3 轮，强制停止
```

### 4. 模型多对多混搭

顶栏两个独立下拉：**✍️ 作者** 和 **🧑‍⚖️ 评审**，可任意组合。

推荐实验：

| 实验 | 作者 | 评审 | 看什么 |
|---|---|---|---|
| 同源强 | Sonnet | Sonnet | 自评偏高基线 |
| 同源弱 | Haiku | Haiku | 弱模型自洽 |
| 弱写强评 | Haiku | Sonnet | Critic 监督下能否推到 8+ |
| 强写弱评 | Sonnet | Haiku | 弱评审能否发现强模型瑕疵 |
| 跨厂商交叉 | DeepSeek | Kimi | 是否有"互相挑刺"的更严表现 |
| 国产组 | Hunyuan | DeepSeek | 国产模型 JSON 输出稳定性 |

UI 顶栏会自动显示 `同模型自评（容易打高分）` / `交叉评审` 提示。

## 三个 API 协议

所有路由都用 **NDJSON 流**：每行一个 JSON 事件，用 `\n` 分割。前端用
`getReader()` + `TextDecoder` 增量切行。

### `/api/agent` — 作者 Agent

| 事件 | 何时发出 | 用途 |
|---|---|---|
| `start` | 请求一开始 | 告诉前端 `model / modelId / modelLabel / tools / ts` |
| `turn_start` | 每个新 turn | 让前端建立 assistant 气泡 |
| `think_delta` | 模型流式吐 content | 显示在 assistant 气泡正文（含最终 markdown） |
| `think_end` | 这一轮 think 阶段结束 | 让前端把"思考中"光标隐藏 |
| `tool_call` | 模型决定调工具 | 前端显示"调用中"占位 |
| `tool_result` | 工具执行完成 | 把返回内容填回对应工具行 |
| `final` | finish_reason=stop 时 | 整篇 markdown 文档（前端用作下载/评审/迭代源） |
| `trace` | 任务收尾 | 完整 messages 数组（前端下载） |
| `done` | 最后一条 | 统计：轮数 / 工具调用次数 / 总耗时 |
| `error` | 任意时刻可能 | 错误信息 |

Body 入参支持两种形态：

- `{ userInput, modelId }`：常规模式
- `{ messages, modelId }`：编排器注入的预构造上下文（refine 用）

### `/api/review` — 评审 Agent

| 事件 | 何时发出 |
|---|---|
| `start` | 携带 model / modelId / modelLabel |
| `delta` | 流式 JSON 文本片段 |
| `parsed` | 完整结构化评审结果（5 维评分 / 章节点评 / 建议） |
| `error` | JSON 解析失败 / 上游错误 |
| `done` | elapsedMs + totalChars |

**JSON 鲁棒解析（6 档兜底）**：弱模型经常输出脏 JSON，`tryParseJsonLoose()` 按宽松→严格依次尝试：

1. 直接 `JSON.parse`
2. 剥 ```` ```json...``` ```` 代码块
3. 截首个 `{` 到末个 `}`
4. 修字符串内裸控制字符（`\n \r \t \b \f` 等）
5. 统一全角/半角引号
6. 修字符串内"嵌入双引号"（启发式状态机）

### `/api/refine` — Actor-Critic 编排器

```jsonc
// Body
{
  "userInput": "做一个用户登录功能...",
  "writerModelId": "claude-sonnet-46",
  "reviewerModelId": "deepseek-chat",
  "maxRounds": 3,
  "approveThreshold": 9
}
```

事件协议（套 envelope 透传子流）：

| 事件 | 用途 |
|---|---|
| `iter_start` | 携带 maxRounds + 双方 modelId |
| `iter_round_start` | 进入第 N 轮 |
| `iter_phase` | `'writing'` / `'reviewing'` 阶段切换 |
| `inner_agent` | 包了一层 envelope 的 /api/agent 事件 |
| `inner_review` | 包了一层 envelope 的 /api/review 事件 |
| `iter_round_end` | 本轮 score / verdict / approved |
| `iter_done` | rounds / finalApproved / elapsedMs |
| `iter_error` | 错误中止 |

**改写时的 messages 构造**（`buildRefineMessages`）：

```
[
  system:    原 SYSTEM_PROMPT
  user:      用户原始需求
  assistant: "（上一版输出的文档）\n\n# 一、需求背景\n..."
  user:      "评审意见（markdown 化）+ 改写要求"
]
```

把"上版文档"放进 assistant 角色，让模型自然形成"基于自己刚写的内容改写"心理模型。

## 与阶段 5 CLI 的差异

| 维度 | 阶段 5 CLI (`req-optimizer/src/agent.ts`) | 阶段 6/7 Web（本项目） |
|---|---|---|
| 入口 | `npm run agent` | 浏览器 |
| 输出 | 终端彩色日志 | UI 气泡 + 工具调用折叠卡 |
| 工具结果 | `console.log` | 流式 NDJSON 事件 |
| 文档保存 | 服务端直接写盘 | 流给前端，浏览器下载 |
| 评审 | 无 | 独立的评审 Agent + 6 档 JSON 兜底 |
| 自我迭代 | 无 | Actor-Critic 循环最多 3 轮 |
| 多模型 | 单模型 | 5 个模型可独立选 + 多对多混搭 |
| 思考链 | 一次性 dump 到 `agent-trace.json` | **边运行边滚动** + 任务结束下载 |

## 端口规划

| 项目 | 端口 |
|---|---|
| `req-optimizer-web`（阶段 3-4 RAG 演示） | 3001 |
| `req-optimizer-agent-web`（阶段 6/7 多 Agent 演示） | 3002 |

两个项目可以同时跑，互不冲突。

## 学习重点速查

| 想学的概念 | 看哪里 |
|---|---|
| Function Calling 多轮循环 | `api/agent/route.ts` 的 for-turn 主体 |
| OpenAI 流式 `tool_calls` 增量拼接 | `api/agent/route.ts` 的 `toolCallsAcc` 处理 |
| NDJSON 流式协议 | `api/agent/route.ts` + 前端 `pumpNdjsonStream()` |
| Multi-Agent 编排 | `api/refine/route.ts` 整文件 |
| Self-Refine（Actor-Critic）模式 | `lib/refine-prompt.ts` `buildRefineMessages()` |
| LLM JSON 输出鲁棒解析 | `api/review/route.ts` `tryParseJsonLoose()` |
| 模型注册表设计 | `lib/models.ts` |
| 流式 React UI（按 (round, turn) 复合定位气泡） | `page.tsx` `createAgentEventHandler()` |
