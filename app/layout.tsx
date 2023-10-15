import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Limit order parser',
  description: 'The app to parse/create limit orders',
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
