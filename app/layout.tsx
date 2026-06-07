import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bolão Copa do Mundo 2026',
  description: 'Plataforma de bolão para a Copa do Mundo FIFA 2026',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">{children}</body>
    </html>
  )
}