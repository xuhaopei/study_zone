/**
 * 阶段 1：需求文档优化核心逻辑
 *
 * 目标：读取一份"烂需求"文本，让大模型按照固定结构进行重写，输出
 *      一份结构化、可执行、可评审的需求文档。
 * 运行：npm run optimize
 */
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';

const apiKey = process.env.DEEPSEEK_API_KEY;
const baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

if (!apiKey || apiKey === 'your_deepseek_api_key_here') {
  console.error('[错误] 请先在 .env 文件里设置 DEEPSEEK_API_KEY');
  process.exit(1);
}

const client = new OpenAI({ apiKey, baseURL });

// ===== 核心：系统指令（这是 Agent 的灵魂，决定优化质量）=====
const SYSTEM_PROMPT = `你是一位资深的产品需求分析专家，拥有10年以上的需求评审经验。
请从以下维度严格审查并优化用户提供的需求文档：

1. 【完整性】是否缺少关键信息？（如：用户角色、使用场景、前置条件、验收标准、异常处理）
2. 【清晰性】是否存在歧义或模糊表述？（如"快速""友好""大概""尽量"等无法量化的词）
3. 【可测试性】每条需求是否可被明确验证？是否有可衡量的标准？
4. 【一致性】需求前后是否存在矛盾或重复？
5. 【优先级】是否标注了优先级（P0/P1/P2）？

请按以下格式输出（使用 Markdown）：

## 一、问题诊断
（逐条列出原文存在的问题，标注问题所属维度，并说明为什么是问题）

## 二、优化后的需求文档
（输出一份重写后的、专业规范的完整需求文档，包含清晰的结构）

## 三、补充建议
（指出原文未覆盖但建议补充的内容，如边界情况、非功能性需求等）`;

/** 用户提示词模板 */
function buildUserPrompt(rawRequirement: string): string {
  return `下面是一份"烂需求"原文，请按系统提示词中的结构对其进行优化重写：\n\n"""\n${rawRequirement}\n"""`;
}

async function optimizeRequirement(rawRequirement: string): Promise<string> {
  console.log(`>>> 正在用模型 ${model} 优化需求，原文长度：${rawRequirement.length} 字符`);

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(rawRequirement) },
    ],
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content ?? '(模型无回复)';
}

async function main() {
  // 读取样例需求文件
  const samplePath = path.resolve(__dirname, '../sample-requirement.txt');
  if (!fs.existsSync(samplePath)) {
    console.error(`[错误] 找不到样例需求文件：${samplePath}`);
    process.exit(1);
  }
  const raw = fs.readFileSync(samplePath, 'utf-8');

  const optimized = await optimizeRequirement(raw);

  console.log('\n========== 优化后的需求文档 ==========\n');
  console.log(optimized);

  // 同时把结果写入到文件，便于查看与对比
  const outPath = path.resolve(__dirname, '../optimized-requirement.md');
  fs.writeFileSync(outPath, optimized, 'utf-8');
  console.log(`\n>>> 结果已写入：${outPath}`);
}

main().catch((err) => {
  console.error('[执行失败]', err);
  process.exit(1);
});
