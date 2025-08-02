"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function InvitationSuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="flex flex-col items-center mb-8">
          <a href="/" className="flex flex-col items-center mb-2">
            <Image
              src="/assets/logo/Logo.png"
              alt="DrishiQ Logo"
              width={120}
              height={60}
              className="h-12 w-auto mb-1"
              priority
            />
            <span className="text-sm text-[#0B4422]/70 -mt-2">Intelligence of Perception</span>
          </a>
          {/* Success Icon */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#0B4422] mb-4">Invitation Submitted!</h1>
          <p className="text-lg text-gray-700 mb-6">
            Thank you for your interest in DrishiQ. We've received your invitation request and verified your phone number.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-[#0B4422] mb-2">What happens next?</h3>
            <ul className="text-sm text-gray-600 space-y-2 text-left">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                We'll review your application within 24-48 hours
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                You'll receive an email with your unique access link
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Join our invite-only community of forward-thinking individuals
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-[#0B4422] mb-2">While you wait...</h3>
            <p className="text-sm text-gray-600">
              Explore our blog to learn more about the DrishiQ philosophy and how we help people see through their challenges.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.push("/blog")}
            className="w-full px-6 py-3 bg-[#0B4422] text-white rounded-lg hover:bg-[#083318] transition-colors font-bold"
          >
            Read Our Blog
          </button>

          {/* Introductory Video */}
          <div className="w-full flex justify-center">
            <iframe
              width="100%"
              height="220"
              src="https://www.youtube.com/embed/JjMr3F-4Swg"
              title="DrishiQ Introductory Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full rounded-lg shadow"
              style={{ maxWidth: '100%', minWidth: 0 }}
            ></iframe>
          </div>

          <button
            onClick={() => router.push("/")}
            className="w-full px-6 py-3 border border-[#0B4422] text-[#0B4422] rounded-lg hover:bg-[#0B4422] hover:text-white transition-colors"
          >
            Return to Home
          </button>
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>
            <span className="font-semibold text-[#0B4422]">See Through the Challenge.</span> <br />
            Intelligence of Perception
          </p>
        </div>
      </div>
    </div>
  );
} 