'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import ChallengeSelector from '../../components/ChallengeSelector';
import CountryCodeSelector from '../../components/CountryCodeSelector';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import { useLanguage } from '../../lib/drishiq-i18n';

interface InvitationFormData {
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  language: string;
  location: string;
  category: 'trial_access' | 'need_support' | '';
  shareChallenge: string;
  challenge: {
    domain: string;
    subCategory: string;
    specificChallenge: string;
    otherText: string;
    combinedValue: string;
  };
}

const SUPPORTED_LANGUAGES = [
  { code: 'ar', name: 'العربية (Arabic)' },
  { code: 'bn', name: 'বাংলা (Bengali)' },
  { code: 'zh', name: '中文 (Chinese)' },
  { code: 'da', name: 'Dansk (Danish)' },
  { code: 'nl', name: 'Nederlands (Dutch)' },
  { code: 'en', name: 'English' },
  { code: 'fi', name: 'Suomi (Finnish)' },
  { code: 'fr', name: 'Français (French)' },
  { code: 'de', name: 'Deutsch (German)' },
  { code: 'hi', name: 'हिन्दी (Hindi)' },
  { code: 'it', name: 'Italiano (Italian)' },
  { code: 'ja', name: '日本語 (Japanese)' },
  { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ko', name: '한국어 (Korean)' },
  { code: 'mr', name: 'मराठी (Marathi)' },
  { code: 'no', name: 'Norsk (Norwegian)' },
  { code: 'pl', name: 'Polski (Polish)' },
  { code: 'pt', name: 'Português (Portuguese)' },
  { code: 'ru', name: 'Русский (Russian)' },
  { code: 'es', name: 'Español (Spanish)' },
  { code: 'sv', name: 'Svenska (Swedish)' },
  { code: 'ta', name: 'தமிழ் (Tamil)' },
  { code: 'te', name: 'తెలుగు (Telugu)' },
  { code: 'tr', name: 'Türkçe (Turkish)' },
  { code: 'ur', name: 'اردو (Urdu)' },
];

export default function InvitationPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<InvitationFormData>({
    name: '',
    email: '',
    phone: '',
    countryCode: '+91',
    language: 'en',
    location: '',
    category: '',
    shareChallenge: '',
    challenge: {
      domain: '',
      subCategory: '',
      specificChallenge: '',
      otherText: '',
      combinedValue: ''
    }
  });

  const handleInputChange = (field: keyof InvitationFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleChallengeChange = (challengeData: any) => {
    setFormData(prev => ({
      ...prev,
      challenge: challengeData
    }));
  };

  // Validation functions
  const isTrialAccessValid = () => {
    return formData.name.trim() !== '' && 
           formData.email.trim() !== '' && 
           formData.phone.trim() !== '' && 
           formData.language !== '';
  };

  const isNeedSupportValid = () => {
    return isTrialAccessValid() && 
           formData.shareChallenge.trim() !== '' &&
           formData.challenge.domain !== '' && 
           formData.challenge.subCategory !== '' && 
           formData.challenge.specificChallenge !== '' &&
           formData.location.trim() !== '';
  };

  const isFormValid = () => {
    // Use same validation for both categories
    const isValid = isTrialAccessValid();
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      alert('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);

    try {
      // Prepare invitation data - same structure for both categories
      const invitationData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        country_code: formData.countryCode,
        language: formData.language,
        location: formData.location.trim(),
        category: formData.category,
        share_challenge: formData.shareChallenge.trim(),
        challenge_description: formData.category === 'need_support' ? formData.challenge.domain : null,
        challenge_sub_category: formData.category === 'need_support' ? formData.challenge.subCategory : null,
        challenge_specific: formData.category === 'need_support' ? formData.challenge.specificChallenge : null,
      };

      // Send invitation data to API

      // Call API to create invitation
      const response = await fetch('/api/invitation/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invitationData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        window.location.href = `/invitation-success?token=${result.token}`;
      } else {
        const errorMessage = result.error || 'Unknown error occurred';
        alert(`Error: ${errorMessage}`);
      }
    } catch (error) {
      alert('An error occurred while creating the invitation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="flex-grow pt-20">
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-[#0B4422] mb-4">
                Create Invitation
              </h1>
              <p className="text-gray-600">
                Invite someone to experience DrishiQ and discover clarity in their challenges.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4422] focus:border-transparent"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="trial_access">Trial Access</option>
                  <option value="need_support">Need Support</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Choose whether this is for trial access or someone who needs support.
                </p>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4422] focus:border-transparent"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4422] focus:border-transparent"
                    placeholder="Enter email address"
                    required
                  />
                </div>
              </div>

              {/* Phone and Language - Separate rows to prevent overlap */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone <span className="text-red-500">*</span>
                </label>
                <CountryCodeSelector
                  value={formData.countryCode}
                  onChange={(value) => handleInputChange('countryCode', value)}
                  phoneValue={formData.phone}
                  onPhoneChange={(value) => handleInputChange('phone', value)}
                  placeholder="Enter phone number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Language <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4422] focus:border-transparent"
                  required
                >
                  <option value="">Select your preferred language</option>
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4422] focus:border-transparent"
                  placeholder="Enter city, state, or country"
                />
              </div>

              {/* Challenge Selection - Only for Need Support */}
              {formData.category === 'need_support' && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-[#0B4422] mb-4">
                    Challenge Details
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Please help us understand the specific challenge so we can provide better support.
                  </p>
                  <ChallengeSelector
                    onSelectionChange={handleChallengeChange}
                    variant="invitation"
                    required={true}
                  />
                </div>
              )}

              {/* Share Your Challenge - For both categories */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-[#0B4422] mb-4">
                  Share Your Challenge
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Please share your specific challenge or what you're looking to achieve. This helps us provide better support.
                </p>
                <textarea
                  value={formData.shareChallenge}
                  onChange={(e) => handleInputChange('shareChallenge', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4422] focus:border-transparent"
                  placeholder="Describe your challenge, goals, or what you're seeking help with..."
                  rows={4}
                  required={formData.category === 'need_support'}
                />
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={!isFormValid() || isLoading}
                  className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors ${
                    isFormValid() && !isLoading
                      ? 'bg-[#0B4422] text-white hover:bg-[#1a6b3a]'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? 'Creating Invitation...' : 'Create Invitation'}
                </button>
              </div>

              {/* Validation Summary */}
              {formData.category && !isFormValid() && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">Please complete the following:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {!formData.name.trim() && <li>• Name is required</li>}
                    {!formData.email.trim() && <li>• Email is required</li>}
                    {!formData.phone.trim() && <li>• Phone is required</li>}
                    {!formData.language && <li>• Preferred language is required</li>}
                    {formData.category === 'trial_access' && !formData.shareChallenge.trim() && <li>• Share your challenge is required</li>}
                    {formData.category === 'need_support' && (
                      <>
                        {!formData.shareChallenge.trim() && <li>• Share your challenge is required</li>}
                        {!formData.challenge.domain && <li>• Domain of life is required</li>}
                        {!formData.challenge.subCategory && <li>• Sub-category is required</li>}
                        {!formData.challenge.specificChallenge && <li>• Specific challenge is required</li>}
                      </>
                    )}
                  </ul>
                </div>
              )}
            </form>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
} 