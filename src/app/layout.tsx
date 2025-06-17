import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AppLayout from '@/components/layout/AppLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '深圳教师考编刷题系统',
  description: '深圳教师考试题库练习系统',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  )
}
