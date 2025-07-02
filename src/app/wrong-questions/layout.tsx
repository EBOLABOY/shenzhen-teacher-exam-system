import { Metadata } from 'next'
import { generateSEO, pageSEO } from '@/lib/seo'

export const metadata: Metadata = generateSEO(pageSEO.wrongQuestions)

export default function WrongQuestionsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
