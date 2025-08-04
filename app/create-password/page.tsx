'use client';

export const dynamic = 'force-dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Image from 'next/image';
import { FlowController } from '@/lib/flow-controller';
import { supabase } from '@/lib/supabase';

function CreatePasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = (key: string) => key;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flowController = FlowController.getInstance();

  useEffect(() => {
    const checkFlow = async () => {
      if (!flowController.canAccess('create-password')) {
        router.push('/');
        return;
      }
    };
    checkFlow();
  }, [router, flowController]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords
    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('passwordTooShort'));
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Get access token from URL
      const accessToken = searchParams?.get('access_token');
      if (!accessToken) {
        throw new Error('No access token found');
      }

      // Update user with new password
      const { data: { user }, error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      // Complete password creation step
      await flowController.completePasswordCreation();
      router.push('/signin');
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
          <Image
            src="/assets/logo/Logo.png"
            alt="Logo"
            width={180}
            height={80}
            className="mx-auto mb-8"
          />
          <h1 className="text-3xl font-bold text-[#0B4422] mb-4">
            {t('createPasswordTitle')}
          </h1>
          <p className="text-gray-600">
            {t('createPasswordMessage')}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              {t('passwordLabel')}
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4422] focus:border-transparent"
              placeholder={t('passwordPlaceholder')}
              required
            />
          </div>

          <div className="mb-8">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              {t('confirmPasswordLabel')}
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4422] focus:border-transparent"
              placeholder={t('confirmPasswordPlaceholder')}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#0B4422] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#0A3A1D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? t('creatingPassword') : t('createPasswordButton')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CreatePasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B4422] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <CreatePasswordContent />
    </Suspense>
  );
}
