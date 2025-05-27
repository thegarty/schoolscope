import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'SchoolScope - Australian School Events & Information',
  description: 'A crowdsourced calendar and wiki-style app for Australian schools. View school profiles, events, and stay connected with your school community.',
  openGraph: {
    title: 'SchoolScope - Australian School Events & Information',
    description: 'A crowdsourced calendar and wiki-style app for Australian schools. View school profiles, events, and stay connected with your school community.',
    type: 'website',
    locale: 'en_AU',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SchoolScope - Australian School Events & Information',
    description: 'A crowdsourced calendar and wiki-style app for Australian schools. View school profiles, events, and stay connected with your school community.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          {children}
        </div>
      </body>
    </html>
  )
} 