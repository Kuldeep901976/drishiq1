import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { LanguageProvider } from '../lib/drishiq-i18n';
import { LandingCardsProvider } from '../lib/landing-cards-context';
import './globals.css';
import { AuthProvider } from '../lib/auth-context';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.drishiq.com'),
  title: 'DrishiQ - See Through the Challenge',
  description: 'Intelligence of Perception - Transform challenges into clarity with AI-powered insights',
  keywords: 'AI, insights, perception, challenges, intelligence, DrishiQ',
  authors: [{ name: 'DrishiQ Team' }],
  openGraph: {
    title: 'DrishiQ - See Through the Challenge',
    description: 'Intelligence of Perception - Transform challenges into clarity with AI-powered insights',
    url: 'https://www.drishiq.com',
    siteName: 'DrishiQ',
    images: [
      {
        url: '/assets/logo/Logo.png',
        width: 800,
        height: 600,
        alt: 'DrishiQ - Intelligence of Perception',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DrishiQ - See Through the Challenge',
    description: 'Intelligence of Perception - Transform challenges into clarity with AI-powered insights',
    images: ['/assets/logo/Logo.png'],
    creator: '@DrishiQ',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'add-your-verification-code',
  },
  alternates: {
    canonical: 'https://www.drishiq.com',
    languages: {
      'en-US': 'https://www.drishiq.com',
      'es': 'https://www.drishiq.com/es',
      'fr': 'https://www.drishiq.com/fr',
      'hi': 'https://www.drishiq.com/hi',
      // Add more languages as needed
    },
  },
  icons: {
    icon: '/assets/logo/facicon.png',
    shortcut: '/assets/logo/facicon.png',
    apple: '/assets/logo/facicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" type="image/png" href="/assets/logo/facicon.png" />
        <link rel="canonical" href="https://www.drishiq.com" />
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" 
        />
      </head>
      <body className="font-sans flex flex-col min-h-full bg-gradient-to-b from-white via-[#F5F7F6] to-[#F0F2F1]">
        {/* Main Content Section - Header/Footer added individually per page */}
        <main className="flex-grow flex flex-col">
          <AuthProvider>
            <LanguageProvider>
              <LandingCardsProvider>
                {children}
              </LandingCardsProvider>
            </LanguageProvider>
          </AuthProvider>
        </main>

        {/* Temporarily disabled to prevent API errors
        <AnalyticsTrackerComponent 
          enableAutoTracking={true}
          enableABTesting={true}
          debugMode={process.env.NODE_ENV === 'development'}
        />
        */}
      </body>
    </html>
  );
}
