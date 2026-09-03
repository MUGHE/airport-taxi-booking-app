import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { HelpButton } from '@/components/help-button'
import { SiteBackdrop } from '@/components/site-backdrop'
import { SITE_URL } from '@/lib/site'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const SITE_TITLE = 'ONE Airport Taxi | Premium Airport Taxi & Transfers in London'
const SITE_DESCRIPTION =
  'Book reliable, fixed-price airport taxi transfers with professional chauffeurs. Instant fare estimates, flight tracking, and 24/7 meet & greet service.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: '%s | ONE Airport Taxi',
  },
  description: SITE_DESCRIPTION,
  generator: 'v0.app',
  alternates: {
    canonical: '/',
    languages: { 'en-GB': '/' },
  },
  icons: {
    // Google's favicon crawler requires a square icon whose size is a multiple of 48px.
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/icon-96x96.png', type: 'image/png', sizes: '96x96' },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: '/',
    siteName: 'ONE Airport Taxi',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: '/hero-airport-transfer.png', alt: 'ONE Airport Taxi' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/hero-airport-transfer.png'],
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: 'white',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        <SiteBackdrop />
        {children}
        <HelpButton />
        <Toaster position="top-center" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
