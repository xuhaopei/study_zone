/**
 * 阶段 8.5 · MCP Resources / Prompts 网关
 *
 * 把 server 暴露的 Resources / Prompts 透传给前端，让 web UI 也能用上
 * MCP 的另外两个原语（之前只用了 Tools）。
 *
 * GET  /api/mcp
 *   → { resources: McpResourceInfo[], prompts: McpPromptInfo[] }
 *     一次性返回资源列表 + 模板列表（首屏加载用）
 *
 * POST /api/mcp
 *   body 二选一：
 *     { action: 'readResource', uri }            → { text }   读取某个资源全文
 *     { action: 'getPrompt', name, arguments? }  → { text }   展开某个 prompt 模板
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  listMcpResources,
  listMcpPrompts,
  readMcpResource,
  getMcpPrompt,
} from '@/lib/mcp-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 并行拉资源列表 + 模板列表
    const [resources, prompts] = await Promise.all([
      listMcpResources(),
      listMcpPrompts(),
    ]);
    return NextResponse.json({ resources, prompts });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || 'MCP 列表获取失败' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  let body: {
    action?: string;
    uri?: string;
    name?: string;
    arguments?: Record<string, string>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '请求体不是合法 JSON' }, { status: 400 });
  }

  try {
    if (body.action === 'readResource') {
      if (!body.uri) {
        return NextResponse.json({ error: '缺少 uri' }, { status: 400 });
      }
      const text = await readMcpResource(body.uri);
      return NextResponse.json({ text });
    }

    if (body.action === 'getPrompt') {
      if (!body.name) {
        return NextResponse.json({ error: '缺少 prompt name' }, { status: 400 });
      }
      const text = await getMcpPrompt(body.name, body.arguments ?? {});
      return NextResponse.json({ text });
    }

    return NextResponse.json(
      { error: `未知 action：${body.action}` },
      { status: 400 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || 'MCP 调用失败' },
      { status: 500 },
    );
  }
}
