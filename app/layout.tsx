import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { ReactToastContainer } from '@/components/ui/react-toastify'
import { HelpButton } from '@/components/help-button'
import { ReferralCapture } from '@/components/referral-capture'
import { SiteBackdrop } from '@/components/site-backdrop'
import { SITE_URL } from '@/lib/site'
import './globals.css'
import 'react-toastify/dist/ReactToastify.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const SITE_TITLE = 'London Airport Transfers at Fixed Prices | ONE Airport Taxi'
const SITE_DESCRIPTION =
  'Fixed-price airport taxis to and from Heathrow, Gatwick, Stansted, Luton, City and Southend. Live flight tracking, 60 minutes free waiting and 24/7 support.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: '%s | ONE Airport Taxi',
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: '/',
    languages: { 'en-GB': '/' },
  },
  verification: {
    google: 'OAxbn6_wt0HbjrDzQdQ-3qtspGnBY8L_wP9Up80lbjQ',
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
    images: [{ url: '/hero-airport-transfer-og.jpg', alt: 'ONE Airport Taxi' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/hero-airport-transfer-og.jpg'],
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
      lang="en-GB"
      className={`${geistSans.variable} ${geistMono.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        <SiteBackdrop />
        {children}
        <HelpButton />
        <ReferralCapture />
        <Toaster position="top-center" />
        <ReactToastContainer />
        {/* Vercel Analytics only works on Vercel hosting; on Netlify its script just 404s. */}
        {process.env.NODE_ENV === 'production' && process.env.VERCEL && <Analytics />}
      </body>
    </html>
  )
}
