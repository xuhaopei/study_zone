/**
 * 模型注册表：维护可切换的 Chat LLM 列表。
 *
 * 设计要点：
 * - 注册表里只声明 id / label / envPrefix / description（轻量元信息）
 * - 真正的 apiKey / baseURL / model 从 envPrefix 派生的环境变量读取（不进 client bundle）
 * - 前端通过 GET /api/models 拿到公开元信息（id/label/description/configured）
 * - 后端 POST /api/agent | /api/review 时接收 modelId，用本模块解析配置
 */

export interface ModelDef {
  /** 唯一 id，前端发请求时用 */
  id: string;
  /** 下拉里显示的人类可读名 */
  label: string;
  /** 说明（如供应商 / 用途） */
  description: string;
  /** env 变量前缀：CHAT_<PREFIX>_API_KEY / _BASE_URL / _MODEL */
  envPrefix: string;
}

/** 注册可用模型。新增供应商时只需要在这里加一行 + .env.local 补三个变量 */
export const MODELS: ModelDef[] = [
  {
    id: 'claude-sonnet-46',
    label: 'Claude Sonnet 4.6',
    description: '公司内 qproxy 网关 · 中文 PRD 质量最好',
    envPrefix: 'CLAUDE_SONNET_46',
  },
  {
    id: 'deepseek-chat',
    label: 'DeepSeek Chat',
    description: 'DeepSeek 官方直连 · 流式最丝滑',
    envPrefix: 'DEEPSEEK_CHAT',
  },
];

export interface ResolvedModel {
  id: string;
  label: string;
  apiKey: string;
  baseURL: string;
  model: string;
}

/** 公开给前端的元信息（不含 apiKey） */
export interface PublicModelInfo {
  id: string;
  label: string;
  description: string;
  /** env 是否配齐 */
  configured: boolean;
}

/** 默认模型 id（取 CHAT_DEFAULT_ID，找不到就 fallback 到第一个 configured） */
export function getDefaultModelId(): string {
  const fromEnv = process.env.CHAT_DEFAULT_ID;
  if (fromEnv && MODELS.some((m) => m.id === fromEnv)) return fromEnv;
  const firstOk = MODELS.find((m) => isModelConfigured(m));
  return firstOk?.id || MODELS[0].id;
}

export function listPublicModels(): PublicModelInfo[] {
  return MODELS.map((m) => ({
    id: m.id,
    label: m.label,
    description: m.description,
    configured: isModelConfigured(m),
  }));
}

function envOf(prefix: string, suffix: string): string | undefined {
  return process.env[`CHAT_${prefix}_${suffix}`];
}

export function isModelConfigured(m: ModelDef): boolean {
  return !!(envOf(m.envPrefix, 'API_KEY') && envOf(m.envPrefix, 'MODEL'));
}

/**
 * 把 modelId 解析为可用的连接配置。
 * @throws 当 modelId 未注册 / env 未配齐时抛错
 */
export function resolveModel(modelId: string | undefined | null): ResolvedModel {
  const id = modelId || getDefaultModelId();
  const def = MODELS.find((m) => m.id === id);
  if (!def) throw new Error(`未知 modelId：${id}`);
  const apiKey = envOf(def.envPrefix, 'API_KEY');
  const baseURL = envOf(def.envPrefix, 'BASE_URL') || 'https://api.openai.com/v1';
  const model = envOf(def.envPrefix, 'MODEL');
  if (!apiKey) throw new Error(`模型 ${id} 未配置 CHAT_${def.envPrefix}_API_KEY`);
  if (!model) throw new Error(`模型 ${id} 未配置 CHAT_${def.envPrefix}_MODEL`);
  return { id: def.id, label: def.label, apiKey, baseURL, model };
}
