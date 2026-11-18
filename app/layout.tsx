import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'lnk.it — corte o link, não a ideia',
  description:
    'Transforme URLs longas em links curtos e acompanhe cada acesso com o lnk.it.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
