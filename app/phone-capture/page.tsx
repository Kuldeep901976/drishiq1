'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const COUNTRY_CODES = [
  { code: '+1', label: 'United States (+1)' },
  { code: '+44', label: 'United Kingdom (+44)' },
  { code: '+91', label: 'India (+91)' },
  { code: '+61', label: 'Australia (+61)' },
  { code: '+81', label: 'Japan (+81)' },
  { code: '+49', label: 'Germany (+49)' },
  { code: '+33', label: 'France (+33)' },
  { code: '+39', label: 'Italy (+39)' },
  { code: '+86', label: 'China (+86)' },
  { code: '+7', label: 'Russia (+7)' },
  { code: '+55', label: 'Brazil (+55)' },
  { code: '+34', label: 'Spain (+34)' },
  { code: '+27', label: 'South Africa (+27)' },
  { code: '+82', label: 'South Korea (+82)' },
  { code: '+62', label: 'Indonesia (+62)' },
  { code: '+234', label: 'Nigeria (+234)' },
  { code: '+92', label: 'Pakistan (+92)' },
  { code: '+880', label: 'Bangladesh (+880)' },
  { code: '+20', label: 'Egypt (+20)' },
  { code: '+966', label: 'Saudi Arabia (+966)' },
  { code: '+971', label: 'United Arab Emirates (+971)' },
  { code: '+63', label: 'Philippines (+63)' },
  { code: '+60', label: 'Malaysia (+60)' },
  { code: '+65', label: 'Singapore (+65)' },
  { code: '+64', label: 'New Zealand (+64)' },
  { code: '+351', label: 'Portugal (+351)' },
  { code: '+90', label: 'Turkey (+90)' },
  { code: '+98', label: 'Iran (+98)' },
  { code: '+212', label: 'Morocco (+212)' },
  { code: '+254', label: 'Kenya (+254)' },
  { code: '+94', label: 'Sri Lanka (+94)' },
  { code: '+977', label: 'Nepal (+977)' },
  { code: '+855', label: 'Cambodia (+855)' },
  { code: '+66', label: 'Thailand (+66)' },
  { code: '+84', label: 'Vietnam (+84)' },
  { code: '+380', label: 'Ukraine (+380)' },
  { code: '+994', label: 'Azerbaijan (+994)' },
  { code: '+374', label: 'Armenia (+374)' },
  { code: '+995', label: 'Georgia (+995)' },
  { code: '+961', label: 'Lebanon (+961)' },
  { code: '+962', label: 'Jordan (+962)' },
  { code: '+964', label: 'Iraq (+964)' },
  { code: '+965', label: 'Kuwait (+965)' },
  { code: '+968', label: 'Oman (+968)' },
  { code: '+973', label: 'Bahrain (+973)' },
  { code: '+974', label: 'Qatar (+974)' },
  { code: '+975', label: 'Bhutan (+975)' },
  { code: '+976', label: 'Mongolia (+976)' },
  { code: '+960', label: 'Maldives (+960)' },
  { code: '+93', label: 'Afghanistan (+93)' },
  { code: '+967', label: 'Yemen (+967)' },
  { code: '+972', label: 'Israel (+972)' },
  { code: '+992', label: 'Tajikistan (+992)' },
  { code: '+993', label: 'Turkmenistan (+993)' },
  { code: '+996', label: 'Kyrgyzstan (+996)' },
  { code: '+998', label: 'Uzbekistan (+998)' },
];

export default function PhoneCapturePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [invitationData, setInvitationData] = useState<any>(null);
  
  const plan = searchParams.get('plan');
  const amount = searchParams.get('amount');
  const description = searchParams.get('description');

  // Check for invitation data from session storage
  useEffect(() => {
    const storedData = sessionStorage.getItem('invitationData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setInvitationData(parsedData);
        // Pre-fill phone number if available
        if (parsedData.phone) {
          // Extract country code and phone number
          const phoneMatch = parsedData.phone.match(/^(\+\d{1,4})(.+)$/);
          if (phoneMatch) {
            setCountryCode(phoneMatch[1]);
            setPhoneNumber(phoneMatch[2]);
          } else {
            setPhoneNumber(parsedData.phone);
          }
        }
      } catch (error) {
        console.error('Error parsing invitation data:', error);
      }
    }
  }, []);

  const validatePhone = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!phoneNumber || phoneNumber.length < 7) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (!/^\d+$/.test(phoneNumber)) {
      newErrors.phone = 'Phone number should contain only digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePhone()) return;
    
    // Redirect to phone verification with all parameters
    const params = new URLSearchParams({
      phone: phoneNumber,
      countryCode: countryCode,
      plan: plan || '',
      amount: amount || '',
      description: description || ''
    });

    // Add invitation data if available
    if (invitationData) {
      params.append('invitationId', invitationData.invitationId || '');
      params.append('invitationType', invitationData.invitationType || '');
      params.append('fromInvitation', 'true');
    }
    
    router.push(`/verify-phone?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#F5F7F6] to-[#F0F2F1] flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <Link href="/" className="flex flex-col items-center mb-4">
              <Image
                src="/assets/logo/Logo.png"
                alt="DrishiQ Logo"
                width={120}
                height={60}
                className="h-8 w-auto"
                priority
              />
              <span className="text-sm text-[#0B4422]/70 mt-1">Intelligence of Perception</span>
            </Link>
            <h1 className="text-3xl font-bold text-[#0B4422] mb-2">
              {invitationData ? 'Complete Your Invitation' : 'Phone Verification'}
            </h1>
            <p className="text-gray-600">
              {invitationData 
                ? 'Verify your phone number to complete your invitation request'
                : 'Enter your mobile number to continue'
              }
            </p>
            {invitationData && (
              <p className="text-sm text-gray-500 mt-2">
                Invitation Type: {invitationData.invitationCategory || 'General'}
              </p>
            )}
            {plan && !invitationData && (
              <p className="text-sm text-gray-500 mt-2">
                Plan: {plan.charAt(0).toUpperCase() + plan.slice(1)}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="countryCode" className="block text-sm font-medium text-gray-700 mb-2">
                Country Code
              </label>
              <select
                id="countryCode"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4422] focus:border-transparent"
              >
                {COUNTRY_CODES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter your mobile number"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0B4422] focus:border-transparent ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-[#0B4422] text-white py-3 rounded-lg hover:bg-[#083318] transition-colors font-semibold"
            >
              Continue to Verification
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link
              href={invitationData ? "/invitation" : "/payment-confirmation"}
              className="text-[#0B4422] hover:underline"
            >
              ← Back to {invitationData ? 'Invitation' : 'Payment'}
            </Link>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              We'll send a verification code to your mobile number to ensure your account security.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 