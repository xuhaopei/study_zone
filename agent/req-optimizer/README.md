# req-optimizer

一个用来学习 AI Agent 的小项目：调用 DeepSeek 大模型，把"烂需求"自动重写成结构化的需求文档。

## 目录结构

```
req-optimizer/
├── package.json
├── tsconfig.json
├── .env                  # 放你的 DeepSeek API Key
├── src/
│   ├── hello.ts          # 阶段 0：跑通大模型调用
│   ├── optimize.ts       # 阶段 1：需求文档优化核心逻辑（一次性）
│   └── chat.ts           # 阶段 2：多轮对话式需求优化（带上下文）
└── sample-requirement.txt # 一份"烂需求"样例，用来测试
```

## 快速开始

1. 安装依赖

```bash
cd agent/req-optimizer
npm install
```

2. 配置 API Key

编辑 `.env`，把 `DEEPSEEK_API_KEY` 改成你自己的 key（在 https://platform.deepseek.com 申请）。

3. 阶段 0：验证大模型调用

```bash
npm run hello
```

看到模型的中文打招呼回复即代表 OK。

4. 阶段 1：需求文档优化（一次性）

```bash
npm run optimize
```

会读取 `sample-requirement.txt`，输出结构化需求文档，并保存到 `optimized-requirement.md`。

5. 阶段 2：多轮对话式优化（带上下文）

```bash
npm run chat
```

启动后会自动用样例需求生成初版文档，然后你可以在终端直接追问，例如：

- `新增一个用微信、Apple ID 登录的功能`
- `把 FR-3 的字段拆得更细一些，加上头像和昵称`
- `验收标准里再补一条多端同时登录的场景`

内置命令：

- `/reset`   清空对话历史，重新开始
- `/history` 查看当前对话轮次
- `/save`   把最近一次模型回复保存到 `optimized-requirement.md`
- `/exit`   退出

## 学习路线建议

- ✅ 阶段 0：跑通调用，熟悉 OpenAI 兼容协议、温度等参数。
- ✅ 阶段 1：写好 system prompt，让模型按固定结构输出（Prompt Engineering）。
- ✅ 阶段 2：加入多轮对话，体验上下文管理。
- 阶段 3（后续）：引入工具调用（function calling），演化为真正的 Agent。
- 阶段 4（后续）：接入向量库做 RAG，让需求优化参考历史项目文档。
