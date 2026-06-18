/**
 * 阶段 0：跑通大模型调用
 *
 * 目标：验证能成功调用 DeepSeek 大模型，拿到一个 "hello world" 级别的回复。
 * 运行：npm run hello
 */
import 'dotenv/config';
import OpenAI from 'openai';

const apiKey = process.env.DEEPSEEK_API_KEY;
const baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

if (!apiKey || apiKey === 'your_deepseek_api_key_here') {
  console.error('[错误] 请先在 .env 文件里设置 DEEPSEEK_API_KEY');
  process.exit(1);
}

// DeepSeek 兼容 OpenAI 协议，直接复用 openai SDK
const client = new OpenAI({
  apiKey,
  baseURL,
});

async function main() {
  console.log(`>>> 正在调用模型：${model}`);

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: '你是一个友好的中文助手。' },
      { role: 'user', content: '请用一句话向我打个招呼，并告诉我今天可以学点什么 AI Agent 知识。' },
    ],
    temperature: 0.7,
  });

  const reply = response.choices[0]?.message?.content ?? '(无回复)';
  console.log('\n=== 模型回复 ===');
  console.log(reply);
  console.log('\n=== Token 使用情况 ===');
  console.log(response.usage);
}

main().catch((err) => {
  console.error('[调用失败]', err);
  process.exit(1);
});
