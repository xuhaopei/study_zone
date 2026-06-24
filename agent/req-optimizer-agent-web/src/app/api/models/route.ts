/**
 * GET /api/models
 * 返回前端可选择的模型列表（不含 apiKey 等敏感信息）
 *
 * 响应：
 *   {
 *     models: [{ id, label, description, configured }],
 *     defaultId: 'claude-sonnet-46'
 *   }
 */
import { NextResponse } from 'next/server';
import { listPublicModels, getDefaultModelId } from '@/lib/models';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    models: listPublicModels(),
    defaultId: getDefaultModelId(),
  });
}
