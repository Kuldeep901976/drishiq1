import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '404 - Page Not Found | DrishiQ',
  description: 'The page you are looking for could not be found.',
};

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Top Banner Ad */}
      <div className="bg-gradient-to-r from-[#0B4422] to-green-600 text-white p-3 sm:p-4 relative">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Join the DrishiQ Revolution</h3>
              <p className="text-xs sm:text-sm opacity-90 leading-tight">Transform challenges into clarity with AI-powered insights</p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <Link
              href="/invitation"
              className="px-4 sm:px-6 py-2 bg-white text-[#0B4422] rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm sm:text-base flex-grow sm:flex-grow-0 text-center"
            >
              Get Early Access
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          <div className="mb-6 sm:mb-8">
            <Link href="/" className="flex flex-col items-center mb-2">
              <Image
                src="/assets/logo/Logo.png"
                alt="DrishiQ Logo"
                width={180}
                height={80}
                className="h-12 w-auto mb-1"
                priority
              />
              <span className="text-sm text-[#0B4422]/70 -mt-2">Intelligence of Perception</span>
            </Link>
          </div>

          {/* 404 Error */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-[#0B4422] mb-3 sm:mb-4 leading-none">404</h1>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-3 sm:mb-4 px-2">
              Page Not Found
            </h2>
            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto leading-relaxed">
              The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>
          </div>

          {/* Error Solutions */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-semibold text-[#0B4422] mb-4 sm:mb-6">
              Get Back on Track
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center p-4 sm:p-6 border rounded-lg hover:shadow-md transition-shadow">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#0B4422] rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <h4 className="font-semibold mb-2 text-sm sm:text-base">Go Home</h4>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">Return to our homepage</p>
                <Link
                  href="/"
                  className="inline-block px-4 sm:px-6 py-2 bg-[#0B4422] text-white rounded-lg hover:bg-[#083318] transition-colors text-sm sm:text-base"
                >
                  Home
                </Link>
              </div>

              <div className="text-center p-4 sm:p-6 border rounded-lg hover:shadow-md transition-shadow">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#0B4422] rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="font-semibold mb-2 text-sm sm:text-base">Try Again</h4>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">Go back to the previous page</p>
                <Link
                  href="javascript:history.back()"
                  className="inline-block px-4 sm:px-6 py-2 bg-[#0B4422] text-white rounded-lg hover:bg-[#083318] transition-colors text-sm sm:text-base"
                >
                  Go Back
                </Link>
              </div>

              <div className="text-center p-4 sm:p-6 border rounded-lg hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#0B4422] rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="font-semibold mb-2 text-sm sm:text-base">Get Help</h4>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">Contact our support team</p>
                <Link
                  href="/contact"
                  className="inline-block px-4 sm:px-6 py-2 bg-[#0B4422] text-white rounded-lg hover:bg-[#083318] transition-colors text-sm sm:text-base"
                >
                  Contact
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Banner Ad */}
          <div className="bg-gradient-to-r from-[#0B4422] to-green-600 text-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-8">
              <div className="text-center lg:text-left flex-1">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2">
                  Ready to Transform Your Challenges?
                </h3>
                <p className="text-sm sm:text-base lg:text-lg opacity-90 leading-relaxed">
                  Join thousands who have found clarity through AI-powered insights
                </p>
              </div>
              <div className="flex-shrink-0 w-full lg:w-auto">
                <Link
                  href="/invitation"
                  className="inline-block w-full lg:w-auto px-6 sm:px-8 py-3 bg-white text-[#0B4422] rounded-lg font-bold hover:bg-gray-100 transition-colors text-base sm:text-lg text-center"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>

          {/* Network Status Indicator */}
          <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-gray-100 rounded-lg">
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-sm text-gray-600">
                All systems operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 