import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'API Mocking Sandbox',
  description: 'Mock API endpoints with realistic fake data',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
