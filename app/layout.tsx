import './globals.css'
import type { Metadata } from 'next'
// 1. 引入 Inter 字体
import { Inter } from 'next/font/google'

// 2. 配置字体
const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '亚马逊全自动分析 Pro',
  description: 'Connected to n8n & Feishu',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      {/* 3. 将字体应用到 body 上 */}
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>{children}</body>
    </html>
  )
}
