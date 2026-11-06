import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import Script from 'next/script'
import { Suspense } from 'react'
import { AuthProvider } from '@/components/AuthProvider'
import '@allauth/react/styles.css'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'
import './globals.css'

const nunito = Nunito({ subsets: ['latin'], display: 'swap', variable: '--font-discovery' })

const GA_TRACKING_ID = 'G-CKNHZ41L7J'

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL?.startsWith('http') 
      ? process.env.NEXT_PUBLIC_APP_URL 
      : `https://${process.env.NEXT_PUBLIC_APP_URL || 'localhost:3000'}`
  ),
  title: 'SchoolScope · Big questions. Little lightbulbs.',
  description: 'A little discovery for every school day. Explore Australian schools, keep important dates together, and meet Ripple in our adult maths tutor preview.',
  icons: { icon: '/brand/favicon.png', apple: '/brand/apple-touch-icon.png' },
  openGraph: {
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'SchoolScope — Big questions. Little lightbulbs.' }],
    title: 'SchoolScope · Big questions. Little lightbulbs.',
    description: 'A little discovery for every school day. Explore Australian schools, keep important dates together, and meet Ripple in our adult maths tutor preview.',
    type: 'website',
    locale: 'en_AU',
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/opengraph-image'],
    title: 'SchoolScope · Big questions. Little lightbulbs.',
    description: 'A little discovery for every school day. Explore Australian schools, keep important dates together, and meet Ripple in our adult maths tutor preview.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const content = (
    <>
      {process.env.TUTOR_PUBLIC_ENABLED !== 'true' && <>
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
      </>}
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </>
  )

  return (
    <html lang="en">
      <body className={`${nunito.className} ${nunito.variable}`}>
        <AuthProvider>{content}</AuthProvider>
      </body>
    </html>
  )
} 