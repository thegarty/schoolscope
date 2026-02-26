import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { Suspense } from 'react'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

const GA_TRACKING_ID = 'G-CKNHZ41L7J'

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL?.startsWith('http') 
      ? process.env.NEXT_PUBLIC_APP_URL 
      : `https://${process.env.NEXT_PUBLIC_APP_URL || 'localhost:3000'}`
  ),
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
        {/* Google Analytics */}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_TRACKING_ID}', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
        {/* Google AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5603475049488422"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <div className="min-h-screen bg-background">
          {children}
        </div>
      </body>
    </html>
  )
} 