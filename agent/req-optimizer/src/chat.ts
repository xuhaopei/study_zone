/**
 * 阶段 2：多轮对话式需求优化
 *
 * 目标：在终端里和大模型连续对话，体验"上下文记忆"。
 *      用户可以先让模型基于 sample-requirement.txt 生成初版需求，
 *      然后追问"再加一条第三方登录""把 FR-3 拆细"等，模型会基于历史对话继续修订。
 *
 * 内置命令（在输入框直接敲）：
 *   /reset   清空对话历史，重新开始
 *   /history 打印当前历史轮次
 *   /save    把最近一次模型回复保存到 optimized-requirement.md
 *   /exit    退出
 *
 * 运行：npm run chat
 */
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const apiKey = process.env.DEEPSEEK_API_KEY;
const baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

if (!apiKey || apiKey === 'your_deepseek_api_key_here') {
  console.error('[错误] 请先在 .env 文件里设置 DEEPSEEK_API_KEY');
  process.exit(1);
}

const client = new OpenAI({ apiKey, baseURL });

/** 系统提示词：与 optimize.ts 保持一致的"需求优化师"角色 */
const SYSTEM_PROMPT = `你是一名资深的产品经理 + 需求分析师，擅长把"含糊不清"的业务需求转化为"结构化、可执行、可评审"的需求文档。

请始终按照下面的 Markdown 结构输出最新版本的完整需求文档（用户每次追问，你都要返回更新后的"完整文档"，而不是只回复一段差异）：

# 一、需求背景
# 二、目标用户与使用场景
# 三、功能需求（FR）   —— 按 FR-编号 + 标题，每条含：描述 / 输入 / 输出 / 约束
# 四、非功能需求（NFR）
# 五、验收标准（Acceptance Criteria）   —— 使用 Given / When / Then
# 六、风险与开放问题

如果用户提出修改意见，请在原文基础上做最小必要修改，并保留编号一致性（新增条目使用下一个可用编号）。
`;

/** 完整对话历史，包含 system / user / assistant 三类消息 */
const history: ChatCompletionMessageParam[] = [
  { role: 'system', content: SYSTEM_PROMPT },
];

/** 读取样例需求文件作为首轮 user 消息的素材 */
function loadSampleRequirement(): string {
  const samplePath = path.resolve(__dirname, '../sample-requirement.txt');
  if (!fs.existsSync(samplePath)) return '';
  return fs.readFileSync(samplePath, 'utf-8');
}

/** 保存最近一次 assistant 回复到文件 */
function saveLatestAssistantReply(): void {
  const last = [...history].reverse().find((m) => m.role === 'assistant');
  if (!last || typeof last.content !== 'string') {
    console.log('[提示] 还没有可保存的模型回复。');
    return;
  }
  const outPath = path.resolve(__dirname, '../optimized-requirement.md');
  fs.writeFileSync(outPath, last.content, 'utf-8');
  console.log(`[已保存] ${outPath}`);
}

/** 调用大模型，把回复追加到 history，并返回回复文本 */
async function chatOnce(userInput: string): Promise<string> {
  history.push({ role: 'user', content: userInput });

  const response = await client.chat.completions.create({
    model,
    messages: history,
    temperature: 0.3,
  });

  const reply = response.choices[0]?.message?.content ?? '(模型无回复)';
  history.push({ role: 'assistant', content: reply });

  const usage = response.usage;
  if (usage) {
    console.log(
      `\n[用量] prompt=${usage.prompt_tokens}  completion=${usage.completion_tokens}  total=${usage.total_tokens}`,
    );
  }
  return reply;
}

/** 处理内置 / 开头的命令；返回 true 表示已被命令吃掉，无需走模型 */
function handleCommand(input: string): boolean {
  switch (input.trim()) {
    case '/exit':
      console.log('再见，已退出。');
      process.exit(0);
    // eslint-disable-next-line no-fallthrough
    case '/reset':
      history.length = 1; // 仅保留 system
      console.log('[已重置] 对话历史已清空，仅保留 system 提示词。');
      return true;
    case '/history': {
      const turns = history.filter((m) => m.role !== 'system').length;
      console.log(`[历史] 当前共 ${turns} 条 user/assistant 消息。`);
      return true;
    }
    case '/save':
      saveLatestAssistantReply();
      return true;
    default:
      return false;
  }
}

async function main() {
  console.log('=== 阶段 2：多轮对话式需求优化 ===');
  console.log('命令：/reset 清空历史   /history 查看轮次   /save 保存最新文档   /exit 退出\n');

  // 首轮自动喂入 sample-requirement.txt，省得用户手动粘贴
  const sample = loadSampleRequirement();
  if (sample) {
    console.log('>>> 已自动载入 sample-requirement.txt 作为首轮需求原文，正在生成初版...\n');
    const reply = await chatOnce(
      `下面是一份"烂需求"原文，请按系统提示词中的结构输出初版完整需求文档：\n\n"""\n${sample}\n"""`,
    );
    console.log('\n=== 模型初版输出 ===\n');
    console.log(reply);
    console.log('\n（你可以继续追问，例如："新增一个用第三方账号登录的需求"，或者输入 /save 保存）\n');
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = () => {
    rl.question('你> ', async (line) => {
      const input = line.trim();
      if (!input) return ask();

      if (handleCommand(input)) return ask();

      try {
        const reply = await chatOnce(input);
        console.log('\n=== 模型回复 ===\n');
        console.log(reply);
        console.log('');
      } catch (err) {
        console.error('[调用失败]', err);
      }
      ask();
    });
  };
  ask();
}

main().catch((err) => {
  console.error('[启动失败]', err);
  process.exit(1);
});
