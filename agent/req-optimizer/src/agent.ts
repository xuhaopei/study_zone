/**
 * 阶段 5：Function Calling 版 Agent
 *
 * 目标：把"只会一次性回答"的模型，升级成"自己规划→调用工具→观察结果→继续推理"的 Agent。
 *
 * Agent Loop 标准写法（OpenAI 协议）：
 *
 *   messages = [system, user]
 *   while (true):
 *     resp = client.chat.completions.create(messages, tools=TOOL_SPECS)
 *     msg  = resp.choices[0].message
 *     messages.push(msg)                              // 关键：把 assistant 消息（含 tool_calls）原样塞回去
 *
 *     if msg.tool_calls:
 *       for call in msg.tool_calls:
 *         result = runTool(call.function.name, call.function.arguments)
 *         messages.push({ role:'tool', tool_call_id:call.id, content:result })
 *       continue                                      // 再让模型基于工具结果继续思考
 *
 *     if resp.choices[0].finish_reason === 'stop':
 *       break                                         // 模型给出了最终回答，结束
 *
 * 运行：npm run agent
 */
import 'dotenv/config';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import type {
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
} from 'openai/resources/chat/completions';
import { TOOL_SPECS, runTool } from './tools';

// ====== 终端彩色输出（无依赖手写 ANSI 转义） ======
const C = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};
const c = (color: keyof typeof C, s: string) => `${C[color]}${s}${C.reset}`;

// ====== 客户端 & 配置 ======
const apiKey = process.env.DEEPSEEK_API_KEY;
const baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
if (!apiKey) {
  console.error(c('red', '[错误] 未配置 DEEPSEEK_API_KEY'));
  process.exit(1);
}
const client = new OpenAI({ apiKey, baseURL });

// ====== System Prompt：告诉 Agent 它是谁、能做什么、怎么干活 ======
const SYSTEM_PROMPT = `你是一名"需求优化 Agent"。你拥有以下工具来帮助你工作：

- search_knowledge(query, topK)  在内部知识库做语义检索
- list_knowledge()               列出知识库总览
- read_knowledge_file(filename)  读取整篇文档
- save_optimized_doc(markdown)   把最终文档保存到磁盘（任务完成的标志）
- get_current_time()             获取当前时间
- fetch_url(url)                 抓取外部网页内容

# 工作流程
1. 必须先调 list_knowledge() 获取知识库总览。在此之前不要调用任何其他工具。
2. 针对用户给出的"烂需求"中的每一个关键主题（例如"密码""锁定""会话""合规""性能"等），
   分别调用 search_knowledge(...) 检索相关规范。允许调用多次，每次换不同关键词。
3. 如果某个片段不够全面，再调用 read_knowledge_file(...) 读完整文档。
4. 当你已经覆盖了「密码/锁定/会话/合规/性能」5 个主题各至少 1 条规范后，开始撰写文档。如果某个主题在知识库找不到，必须在第六章列为开放问题。按"# 一、需求背景 / # 二、目标用户与使用场景 / # 三、功能需求(FR) /
   # 四、非功能需求(NFR) / # 五、验收标准 / # 六、风险与开放问题"六段式产出最终 Markdown 文档。
5. 调用 save_optimized_doc(markdown) 保存文档，任务完成。

# 严格要求
- 每个 FR 必须含"描述/输入/输出/约束/异常分支"
- 验收标准用 Given/When/Then
- NFR 中的具体数字（如锁定时长、bcrypt cost、LCP 阈值）必须来自检索到的知识片段，不要凭空编造
- 不要在保存的文档里写"参考来源"
- 调用工具的次数控制在 8 次以内
`;

// ====== 工具调用过程的可视化 ======
function logUserMessage(text: string) {
  console.log('\n' + c('bold', c('cyan', '👤 用户需求：')));
  console.log(c('cyan', text.split('\n').map((l) => '   ' + l).join('\n')));
}

function logAssistantThinking(turn: number, content: string) {
  if (!content?.trim()) return;
  console.log('\n' + c('bold', c('magenta', `🤖 助手思考 [turn ${turn}]：`)));
  console.log(c('magenta', content.split('\n').map((l) => '   ' + l).join('\n')));
}

function logToolCall(name: string, argsJson: string) {
  let pretty = argsJson;
  try {
    pretty = JSON.stringify(JSON.parse(argsJson || '{}'), null, 2);
  } catch {
    /* keep raw */
  }
  console.log('\n' + c('bold', c('yellow', `🔧 调用工具：${name}`)));
  console.log(c('gray', '   参数：' + pretty.split('\n').join('\n   ')));
}

function logToolResult(name: string, result: string) {
  const preview =
    result.length > 600 ? result.slice(0, 600) + `\n   ...（共 ${result.length} 字符，已截断）` : result;
  console.log(c('green', `✅ ${name} 返回：`));
  console.log(c('gray', preview.split('\n').map((l) => '   ' + l).join('\n')));
}

function logFinal(text: string) {
  console.log('\n' + c('bold', c('blue', '📄 最终回复：')));
  console.log(c('blue', text.split('\n').map((l) => '   ' + l).join('\n')));
}

// ====== Agent Loop ======
async function runAgent(userInput: string, maxTurns = 12) {
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userInput },
  ];

  logUserMessage(userInput);

  for (let turn = 1; turn <= maxTurns; turn++) {
    const resp = await client.chat.completions.create({
      model,
      messages,
      tools: TOOL_SPECS,
      tool_choice: 'auto',
      temperature: 0.3,
    });
    const choice = resp.choices[0];
    const msg = choice.message;

    // 把 assistant 消息原样塞回去（必须！否则模型不知道自己刚才说了什么）
    messages.push(msg);

    // 1) 模型可能有"思考文字"
    if (typeof msg.content === 'string' && msg.content.trim()) {
      logAssistantThinking(turn, msg.content);
    }

    // 2) 如果模型决定调工具
    const toolCalls = (msg.tool_calls || []) as ChatCompletionMessageToolCall[];
    if (toolCalls.length > 0) {
      for (const call of toolCalls) {
        const name = call.function.name;
        const argsJson = call.function.arguments || '{}';
        logToolCall(name, argsJson);

        const result = await runTool(name, argsJson);
        logToolResult(name, result);

        // 把工具结果作为 role:'tool' 回灌
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: result,
        });
      }
      // 继续下一轮，让模型基于工具结果继续思考
      continue;
    }

    // 3) 没有工具调用 + finish_reason=stop → 任务结束
    if (choice.finish_reason === 'stop') {
      const final = (msg.content as string) || '(空回复)';
      logFinal(final);
      break;
    }

    // 4) 其他异常 finish_reason
    console.log(c('red', `[警告] 未预期的 finish_reason=${choice.finish_reason}，提前结束`));
    break;
  }

  // 把整段 messages dump 一份（学习用），trace 文件名可通过 TRACE_TAG 环境变量区分
  const tag = process.env.TRACE_TAG ? `.${process.env.TRACE_TAG}` : '';
  const dumpPath = path.resolve(process.cwd(), `agent-trace${tag}.json`);
  fs.writeFileSync(dumpPath, JSON.stringify(messages, null, 2), 'utf-8');
  console.log(
    '\n' + c('gray', `📝 完整对话轨迹已写入：${dumpPath}（共 ${messages.length} 条消息）`),
  );
}

// ====== 入口：从 sample-requirement.txt 读 user 输入 ======
async function main() {
  const samplePath = path.resolve(process.cwd(), 'sample-requirement.txt');
  if (!fs.existsSync(samplePath)) {
    console.error(c('red', `[错误] 找不到 ${samplePath}`));
    process.exit(1);
  }
  const userInput = fs.readFileSync(samplePath, 'utf-8').trim();

  console.log(c('bold', c('green', '=== 阶段 5：Function Calling Agent ===')));
  console.log(c('gray', `model: ${model}`));
  console.log(c('gray', `tools: ${TOOL_SPECS.map((t) => t.function.name).join(', ')}`));

  await runAgent(userInput);
}

main().catch((err) => {
  console.error(c('red', '[Agent 失败]'), err);
  process.exit(1);
});
