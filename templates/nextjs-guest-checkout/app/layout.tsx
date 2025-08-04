import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { CDPProvider } from '@/components/cdp-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CDP Onramp Guest Checkout',
  description: 'CDP Onramp guest checkout with embedded wallets',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="bg-[#222222]">
      <body className={`${inter.className} bg-[#222222] min-h-screen`}>
        <CDPProvider>
          {children}
        </CDPProvider>
      </body>
    </html>
  )
}