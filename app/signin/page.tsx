"use client";

import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

export default function SigninPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSignupArrow, setShowSignupArrow] = useState(false);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setShowSignupArrow(false); // Reset arrow visibility on new attempt

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      // Optionally, check if profile is complete and route accordingly
      router.push('/dashboard');
    } catch (err: any) {
      // Detect unregistered email error (customize this check as needed)
      let msg = err.message || 'Invalid email or password';
      let showSignupArrow = false;
      if (msg.toLowerCase().includes('user not found') || msg.toLowerCase().includes('no user') || msg.toLowerCase().includes('invalid login credentials')) {
        msg = 'No account found for this email. Please sign up first.';
        showSignupArrow = true;
      }
      setError(msg);
      setShowSignupArrow(showSignupArrow);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'facebook' | 'linkedin') => {
    setIsLoading(true);
    setError('');
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (oauthError) throw oauthError;
      // User will be redirected to provider
    } catch (err: any) {
      setError(err.message || `Failed to sign in with ${provider}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="flex flex-col items-center">
          <Link href="/" className="flex flex-col items-center mb-2">
            <Image
              src="/assets/logo/Logo.png"
              alt="DrishiQ Logo"
              width={180}
              height={80}
              className="h-12 w-auto"
              priority
            />
            <span className="text-sm text-[#0B4422]/70 -mt-2">Intelligence of Perception</span>
          </Link>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-[#0B4422]">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-[#0B4422]/70">
            Welcome back! Please sign in to continue
            <br />
            to your DrishiQ dashboard.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 text-center">
            {error}
            {showSignupArrow && (
              <div className="flex flex-col items-center mt-2">
                <span className="animate-bounce text-2xl text-[#0B4422]">⬇️</span>
                <span className="text-sm text-[#0B4422] font-semibold">
                  Click <Link href="/signup" className="underline">Sign up</Link> below
                </span>
              </div>
            )}
          </div>
        )}

        {/* Social Sign In */}
        <div className="flex items-center justify-center gap-6 my-4">
          <button
            type="button"
            onClick={() => handleSocialSignIn('google')}
            disabled={isLoading}
            className="p-2 rounded-full border border-gray-300 bg-white hover:bg-gray-100 transition-colors disabled:opacity-50"
            aria-label="Sign in with Google"
          >
            <Image
              src="/assets/social-icons/google.jpg"
              alt="Google"
              width={32}
              height={32}
            />
          </button>
          <button
            type="button"
            onClick={() => handleSocialSignIn('facebook')}
            disabled={isLoading}
            className="p-2 rounded-full border border-gray-300 bg-white hover:bg-gray-100 transition-colors disabled:opacity-50"
            aria-label="Sign in with Facebook"
          >
            <Image
              src="/assets/social-icons/facebook.png"
              alt="Facebook"
              width={32}
              height={32}
            />
          </button>
          <button
            type="button"
            onClick={() => handleSocialSignIn('linkedin')}
            disabled={isLoading}
            className="p-2 rounded-full border border-gray-300 bg-white hover:bg-gray-100 transition-colors disabled:opacity-50"
            aria-label="Sign in with LinkedIn"
          >
            <Image
              src="/assets/social-icons/linkedin.png"
              alt="LinkedIn"
              width={32}
              height={32}
            />
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500">Or continue with email</span>
          </div>
        </div>

        {/* Email Sign In Form */}
        <form className="mt-8 space-y-6" onSubmit={handleEmailSignIn}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-[#0B4422] focus:border-[#0B4422] focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-[#0B4422] focus:border-[#0B4422] focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-[#0B4422] focus:ring-[#0B4422] border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link
                href="/forgot-password"
                className="font-medium text-[#0B4422] hover:text-[#0B4422]/80"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#0B4422] hover:bg-[#083318] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0B4422] disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        {/* Don't have an account? Sign up */}
        <p className="text-center text-gray-600">
          Don't have an account?{' '}
          <Link href="/signup" className="text-[#0B4422] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
} 