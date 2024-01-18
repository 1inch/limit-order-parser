import './globals.css'
import type { Metadata } from 'next'
import Link from "next/link";
import React from "react";

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
      <body>
        <header>
            <nav>
               <ul>
                   <li><Link href="/builder">Builder</Link></li>
                   <li><Link href="/">Parser</Link></li>
               </ul>
            </nav>
        </header>

      <main>
          {children}
      </main>
      </body>
    </html>
  )
}
