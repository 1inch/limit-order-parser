import './globals.css'
import type { Metadata } from 'next'
import Link from "next/link";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: 'Limit order parser',
  description: 'The app to parse/create limit orders',
}
export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body className='bg-1inch-bg-1'>
        <header className='bg-1inch-bg-1 text-1inch-text-1 pt-5'>
            <nav className='ml-5 mr-5 p-5 bg-1inch-bg-2 rounded-tl-2xl rounded-tr-2xl'>
               <ul className='flex flex-row'>
                   {/*<li><Link href="/builder">Builder</Link></li>*/}
                   <li className='ml-5'><Link href="/">Parser</Link></li>
                   <li className='ml-5'><Link href="/parser-v3">Parser v3 (demo)</Link></li>
               </ul>
            </nav>
        </header>
        <main className='bg-1inch-bg-1 text-1inch-text-1 pl-5 pr-5'>
          <div className='bg-1inch-bg-2 pl-5 pr-5'>
            {children}
          </div>
        </main>
      </body>
    </html>
  )
}
