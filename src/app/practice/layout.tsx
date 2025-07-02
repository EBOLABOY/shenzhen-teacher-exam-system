import { Metadata } from 'next'
import { generateSEO, pageSEO } from '@/lib/seo'

export const metadata: Metadata = generateSEO(pageSEO.practice)

export default function PracticeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
