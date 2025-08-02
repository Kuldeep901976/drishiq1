"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function VerifyPhonePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get prefilled data from URL params
  const name = searchParams?.get('name') ?? '';
  const email = searchParams?.get('email') ?? '';
  const phone = searchParams?.get('phone') ?? '';
  const countryCode = searchParams?.get('countryCode') ?? '';
  const language = searchParams?.get('language') ?? '';
  const location = searchParams?.get('location') ?? '';
  const challenge = searchParams?.get('challenge') ?? '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [errors, setErrors] = useState<any>({});
  const [verifying, setVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Auto-send OTP on page load
  useEffect(() => {
    if (phone && !otpSent) {
      sendOTP();
    }
  }, [phone]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const sendOTP = async () => {
    try {
      setVerifying(true);
      
      // Send OTP via API
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone,
          country_code: countryCode,
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setOtpSent(true);
        setCountdown(30); // 30 second countdown
        setErrors({});
      } else {
        throw new Error(result.error || 'Failed to send OTP');
      }
    } catch (error: any) {
      setErrors({ otp: error.message || 'Failed to send OTP' });
    } finally {
      setVerifying(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.querySelector(`input[name="otp-${index + 1}"]`) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.querySelector(`input[name="otp-${index - 1}"]`) as HTMLInputElement;
      if (prevInput) prevInput.focus();
    }
  };

  const validateOTP = () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      return 'Please enter the complete 6-digit OTP';
    }
    if (!/^\d{6}$/.test(otpString)) {
      return 'OTP should contain only numbers';
    }
    return null;
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpError = validateOTP();
    if (otpError) {
      setErrors({ otp: otpError });
      return;
    }

    setVerifying(true);
    setErrors({});

    try {
      const otpString = otp.join('');
      
      // Verify OTP via API
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone,
          country_code: countryCode,
          otp: otpString,
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // After successful OTP verification, store data and send magic link
        await processSuccessfulVerification();
      } else {
        throw new Error(result.error || 'Invalid OTP');
      }
    } catch (error: any) {
      let message = error.message || 'Invalid OTP. Please try again.';
      if (message.includes('duplicate key value') && message.includes('Invitations_email_key')) {
        message = 'This phone is already registered with us.';
      }
      setErrors({ otp: message });
    } finally {
      setVerifying(false);
    }
  };

  const processSuccessfulVerification = async () => {
    try {
      // Step 1: Store invitation data in Invitations table
      const invitationResult = await storeInvitationData();
      
      if (!invitationResult.success) {
        throw new Error(invitationResult.error);
      }

      // Step 2: Store email data in magic link table and send magic link
      const magicLinkResult = await storeMagicLinkDataAndSendEmail(invitationResult.token);
      
      if (!magicLinkResult.success) {
        console.warn('Failed to send magic link, but invitation was created:', magicLinkResult.error);
      }

      // Step 3: Redirect to success page
      router.push('/invitation-success');
      
    } catch (error: any) {
      throw new Error('Failed to process verification: ' + error.message);
    }
  };

  const storeInvitationData = async () => {
    try {
      const invitationData = {
        name,
        email,
        phone: `${countryCode}${phone}`,
        language,
        location,
        invitationType: 'regular' as const,
        challenge // already safe
      };

      const response = await fetch('/api/invitation/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invitationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create invitation');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create invitation');
      }

      return { success: true, token: result.token };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const storeMagicLinkDataAndSendEmail = async (invitationToken: string) => {
    try {
      const response = await fetch('/api/magic-link/create-and-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name,
          invitationToken,
          invitationLink: `${window.location.origin}/invite/${invitationToken}`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create magic link');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create magic link');
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex flex-col items-center mb-2">
            <Image
              src="/assets/logo/Logo.png"
              alt="DrishiQ Logo"
              width={120}
              height={60}
              className="h-12 w-auto mb-1"
              priority
            />
            <span className="text-sm text-[#0B4422]/70 -mt-2">Intelligence of Perception</span>
          </Link>
          <h2 className="text-2xl font-bold text-[#0B4422] mb-2 mt-6">Verify Your Phone</h2>
          <p className="text-gray-600 text-center">
            We've sent a 6-digit code to <br />
            <span className="font-semibold">{countryCode} {phone}</span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Enter the 6-digit code
            </label>
            <div className="flex gap-2 justify-center">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  name={`otp-${index}`}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4422] focus:border-transparent"
                  maxLength={1}
                  disabled={verifying}
                />
              ))}
            </div>
            {errors.otp && (
              <div className="text-red-500 text-sm mt-2 text-center">{errors.otp}</div>
            )}
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3 bg-[#0B4422] text-white rounded-lg hover:bg-[#083318] transition-colors font-bold text-lg"
            disabled={verifying || otp.join('').length !== 6}
          >
            {verifying ? "Verifying..." : "Verify & Submit"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-3">
            Didn't receive the code?
          </p>
          <button
            onClick={sendOTP}
            disabled={countdown > 0 || verifying}
            className="text-[#0B4422] font-medium hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/invitation')}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ← Back to invitation form
          </button>
        </div>
      </div>
    </div>
  );
}
