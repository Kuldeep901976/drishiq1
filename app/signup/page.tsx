'use client';

import { flowController } from '@/lib/flow-controller';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/create-password`,
        },
      });

      if (error) throw error;

      await flowController.startEmailSignup(email);
      router.push('/create-password');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="text-center mb-12">
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
          <h1 className="text-3xl font-bold text-[#0B4422] mb-4 mt-6">
            Create your account
          </h1>
          <p className="text-gray-600">
            Join DrishiQ and start your journey of self-discovery and growth
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Email Sign-up Form Only */}
        <form onSubmit={handleEmailSignup}>
          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0B4422] focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 bg-[#0B4422] text-white rounded-lg hover:bg-[#083318] transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Email link to this email Id'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <Link
            href="/signin"
            className="text-[#0B4422] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
