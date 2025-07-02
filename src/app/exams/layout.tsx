import { Metadata } from 'next'
import { generateSEO, pageSEO } from '@/lib/seo'

export const metadata: Metadata = generateSEO(pageSEO.exams)

export default function ExamsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
