/**
 * Actor-Critic 自我迭代时构造给作者 Agent 的"改写指令"。
 *
 * 第 1 轮：直接用用户原始需求 → 调 /api/agent 正常跑
 * 第 2..N 轮：把上一版文档 + 评审反馈整理给作者，让它定向修改
 *
 * 关键点：
 * - 必须再次告诉作者"产出 6 段式文档 → 调用 save_optimized_doc 工具保存"
 * - 评审反馈要可读但避免 JSON 包裹（防止作者把它当代码再粘回来）
 * - 不传过多冗余历史，只传"原始需求 + 上一版文档 + 关键改进点"
 */
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { SYSTEM_PROMPT } from './prompt';

/** /api/review 返回的评审结构（与 page.tsx 中 ReviewResult 一致） */
export interface ReviewForRefine {
  overall: { score: number; verdict: string; summary: string };
  dimensions: { key: string; label: string; score: number; comment: string }[];
  section_reviews: {
    section: string;
    good?: string;
    issues?: string[];
  }[];
  suggestions: string[];
}

/**
 * 把评审结果格式化成可读的 markdown，作为对作者的反馈。
 *
 * 故意不输出 JSON —— 作者看到 JSON 容易把它当成"要保留的格式"。
 * 输出成自然语言列表，作者读起来像在收 code review。
 */
export function formatReviewAsFeedback(review: ReviewForRefine): string {
  const lines: string[] = [];

  lines.push(`## 评审结论`);
  lines.push(
    `- 总分：**${review.overall.score}/10**  · 判定：**${review.overall.verdict}**`,
  );
  lines.push(`- 简评：${review.overall.summary}`);
  lines.push('');

  // 维度评分（重点列低分项）
  const sortedDims = [...review.dimensions].sort((a, b) => a.score - b.score);
  lines.push(`## 各维度得分（升序）`);
  for (const d of sortedDims) {
    lines.push(`- **${d.label}（${d.score}/10）**：${d.comment}`);
  }
  lines.push('');

  // 章节问题
  const sectionsWithIssues = review.section_reviews.filter(
    (s) => s.issues && s.issues.length > 0,
  );
  if (sectionsWithIssues.length > 0) {
    lines.push(`## 各章节需要改进的点`);
    for (const s of sectionsWithIssues) {
      lines.push(`### ${s.section}`);
      for (const issue of s.issues!) {
        lines.push(`- ${issue}`);
      }
    }
    lines.push('');
  }

  // 具体建议（带优先级）
  if (review.suggestions.length > 0) {
    lines.push(`## 具体改进建议`);
    for (const s of review.suggestions) {
      lines.push(`- ${s}`);
    }
  }

  return lines.join('\n');
}

/**
 * 构造"带反馈的改写"完整 messages，直接喂给 /api/agent。
 *
 * 顺序：
 *   system     —— 原 system prompt（保留作者人设和工具说明）
 *   user       —— 用户的原始需求
 *   assistant  —— 上一版产出的文档（直接 content 形式，不绕工具协议，简单可靠）
 *   user       —— 评审反馈 + 改写指令
 */
export function buildRefineMessages(args: {
  originalRequirement: string;
  lastMarkdown: string;
  review: ReviewForRefine;
  round: number; // 当前是第几轮（>=2）
}): ChatCompletionMessageParam[] {
  const { originalRequirement, lastMarkdown, review, round } = args;

  const feedback = formatReviewAsFeedback(review);

  const refineInstruction = `下面是评审 Agent 对你上一版文档的评审意见（这是第 ${round} 轮迭代）：

${feedback}

---

# 改写要求

1. 请**针对上述评审意见逐条改进**，重点解决"各维度得分（升序）"里分数最低的几项。
2. 保留所有评审说"好"的部分，**不要推倒重来**。
3. 修改后**直接以 6 段式（背景 / 用户场景 / FR / NFR / 验收标准 / 风险）Markdown 作为最终回复**，
   以 \`# 一、需求背景\` 开头，整篇是纯 Markdown 文档，**不要前置任何说明文字**，
   **不要调用任何工具**。
4. 字符串内引用术语请使用「」或全角""引号，**避免英文双引号嵌套**导致评审 JSON 解析失败。
5. 不需要再调用知识库检索（除非评审明确指出"合规依据缺失"等需要查的点），
   优先用上一版的内容做定向修补。`;

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: originalRequirement },
    {
      role: 'assistant',
      content: `（上一版输出的文档）\n\n${lastMarkdown}`,
    },
    { role: 'user', content: refineInstruction },
  ];
}
