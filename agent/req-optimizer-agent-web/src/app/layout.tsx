import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Req-Optimizer Agent · 阶段 6',
  description: '聊天式 Agent UI：实时看到模型的思考链与工具调用',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
