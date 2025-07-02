import { Metadata } from 'next'
import { generateSEO, pageSEO } from '@/lib/seo'

export const metadata: Metadata = generateSEO(pageSEO.register)

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
