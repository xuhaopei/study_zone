import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '需求优化 Agent · Demo',
  description: '基于 DeepSeek 的需求文档优化器，把"烂需求"重写成结构化文档',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
