import { Metadata } from 'next'
import { generateSEO, pageSEO } from '@/lib/seo'

export const metadata: Metadata = generateSEO(pageSEO.login)

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
