import { inputRules, textblockTypeInputRule } from "prosemirror-inputrules"
import { Schema } from "prosemirror-model"

export function buildInputRules(schema: Schema) {
  const rules = []
  const heading = schema.nodes.heading
  if (heading) {
    // ^(#{1,6})\s$  → 把当前 textblock 转成对应 level 的 heading
    rules.push(
      textblockTypeInputRule(
        new RegExp("^(#{1,6})\\s$"),
        heading,
        match => ({ level: match[1].length })
      )
    )
  }
  return inputRules({ rules })
}
