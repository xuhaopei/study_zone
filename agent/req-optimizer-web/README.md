# req-optimizer-web

需求优化 Agent 的 Next.js 演示界面，复用 `../req-optimizer/` 的核心 system prompt。

## 快速开始

```bash
cd agent/req-optimizer-web
npm install
npm run dev
```

打开 http://localhost:3001 即可。

## 目录结构

```
req-optimizer-web/
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
├── .env.local                # DeepSeek API Key（不会被提交）
└── src/
    ├── lib/
    │   └── prompt.ts         # 与 CLI 版共享的 system prompt
    └── app/
        ├── layout.tsx
        ├── page.tsx          # 演示页：左侧输入 / 右侧流式 Markdown
        ├── globals.css
        └── api/optimize/route.ts  # 流式调用 DeepSeek 的 API 路由
```

## 演示要点

- **流式输出**：API 路由把 OpenAI SDK 的 `stream: true` 异步迭代转成 `ReadableStream`，前端用 `getReader()` 增量拼接，呈现"打字机"效果。
- **可中断**：前端用 `AbortController` 接到"停止"按钮。
- **Markdown 渲染**：`react-markdown + remark-gfm` 直接把模型输出渲染成网页文档。
- **下载/复制**：把流式拼好的字符串保存为 `.md` 文件。
- **文件上传**：支持 `.txt / .md / .docx`，点击或拖拽均可。`.docx` 在服务端用 `mammoth` 解析，单文件最大 2MB。
- **RAG 知识库**：把 `knowledge/*.md` 切片向量化，每次生成前先做 Top-3 检索，把命中片段塞进 system prompt。页面上会显示这次用了哪些片段。

## RAG 工作原理（本项目实现）

```
knowledge/*.md ─┐
                ├─[npm run ingest]─► knowledge.index.json   （离线一次）
                │
[用户输入] ──► /api/optimize
                │
                ├─① embeddings(input=用户需求)
                ├─② 与索引里每条 vector 算余弦相似度
                ├─③ 取 Top-3 拼进 system prompt
                └─④ chat.completions(stream=true) → 流式回前端

前端：解析 NDJSON，先收到 meta（命中片段），再持续收 delta（模型增量）。
```

> embedding 接口走的是阿里云 DashScope 的 OpenAI 兼容端点（`text-embedding-v2`），
> 因为 DeepSeek 目前不提供 embedding。可在 `.env.local` 通过
> `EMBEDDING_API_KEY / EMBEDDING_BASE_URL / EMBEDDING_MODEL` 切换其他服务商。

## RAG 启动步骤

```bash
# 1. 在 .env.local 配 EMBEDDING_API_KEY（DashScope 控制台申请）
# 2. 一次性建索引：
npm run ingest
# 3. 启动 dev：
npm run dev
```

无 `EMBEDDING_API_KEY` 时，把页面"使用知识库 (RAG)"开关关掉即可，演示主流程不受影响。

## 学习路线

- ✅ 阶段 0：跑通调用（`req-optimizer/hello.ts`）
- ✅ 阶段 1：一次性需求优化（`req-optimizer/optimize.ts`）
- ✅ 阶段 2：CLI 多轮对话（`req-optimizer/chat.ts`）
- ✅ 阶段 3：Next.js 网页演示（**当前项目**）
- 阶段 4（后续）：Function Calling，让模型自己读写文件
- 阶段 5（后续）：RAG，接入历史需求库做检索增强
