/**
 * POST /api/upload
 * multipart/form-data，字段名：file
 *
 * 支持类型：.txt / .md / .markdown / .docx
 * 返回：{ ok: true, filename, ext, chars, text } 或 { ok: false, error }
 *
 * 设计要点：
 * - .docx 必须在服务端解析（mammoth 依赖 Node 的 zip / Buffer），不能放浏览器
 * - .txt / .md 也走服务端，统一编码、统一大小校验，逻辑集中好维护
 */
import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 最大允许 2MB，需求文档不该太大 */
const MAX_BYTES = 2 * 1024 * 1024;

/** 把任意编码（含可能的 BOM）的纯文本 Buffer 转成字符串 */
function decodeText(buf: Buffer): string {
  // 处理 UTF-8 BOM
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    return buf.subarray(3).toString('utf-8');
  }
  return buf.toString('utf-8');
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: '未收到文件' }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ ok: false, error: '空文件' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { ok: false, error: `文件过大（${(file.size / 1024).toFixed(1)} KB），最大 ${MAX_BYTES / 1024} KB` },
        { status: 413 },
      );
    }

    const filename = file.name || 'unnamed';
    const ext = filename.toLowerCase().split('.').pop() || '';
    const buf = Buffer.from(await file.arrayBuffer());

    let text = '';
    if (ext === 'txt' || ext === 'md' || ext === 'markdown') {
      text = decodeText(buf);
    } else if (ext === 'docx') {
      const result = await mammoth.extractRawText({ buffer: buf });
      text = result.value || '';
    } else {
      return NextResponse.json(
        { ok: false, error: `不支持的文件类型：.${ext}（仅支持 .txt / .md / .docx）` },
        { status: 415 },
      );
    }

    text = text.replace(/\r\n/g, '\n').trim();

    if (!text) {
      return NextResponse.json({ ok: false, error: '文件中没有解析到文字内容' }, { status: 422 });
    }

    return NextResponse.json({
      ok: true,
      filename,
      ext,
      chars: text.length,
      text,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message || '解析失败' },
      { status: 500 },
    );
  }
}
