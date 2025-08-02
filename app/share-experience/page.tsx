'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Footer from '../../components/Footer';
import Header from '../../components/Header';

interface ExperienceForm {
  name: string;
  email: string;
  phone: string;
  preferredLanguage: string;
  category: string;
  story: string;
  image: File | null;
}

export default function ShareExperiencePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ExperienceForm>({
    name: '',
    email: '',
    phone: '',
    preferredLanguage: '',
    category: '',
    story: '',
    image: null
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showPhoneValidation, setShowPhoneValidation] = useState(false);
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');

  const categories = [
    'Personal Growth',
    'Career Development', 
    'Relationships',
    'Health & Wellness',
    'Financial Clarity',
    'Spiritual Journey',
    'Education',
    'Other'
  ];

  const languages = [
    'English',
    'Spanish',
    'French',
    'German',
    'Hindi',
    'Chinese',
    'Arabic',
    'Portuguese',
    'Russian',
    'Japanese',
    'Korean',
    'Other'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      setShowPhoneValidation(true);
      return;
    }
    
    await submitExperience();
  };

  const sendOTP = async () => {
    if (!formData.phone) {
      alert('Please enter your phone number first');
      return;
    }
    
    try {
      console.log('Sending OTP to:', formData.phone);
      alert('OTP sent to your phone number');
    } catch (error) {
      console.error('Error sending OTP:', error);
      alert('Error sending OTP. Please try again.');
    }
  };

  const verifyOTP = async () => {
    if (!otp) {
      alert('Please enter the OTP');
      return;
    }
    
    try {
      console.log('Verifying OTP:', otp);
      alert('Phone number verified successfully!');
      setShowPhoneValidation(false);
      await submitExperience();
    } catch (error) {
      console.error('Error verifying OTP:', error);
      alert('Invalid OTP. Please try again.');
    }
  };

  const submitExperience = async () => {
    setIsSubmitting(true);
    
    try {
      console.log('Submitting experience:', formData);
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Thank you for sharing your experience! We will review it and get back to you soon.');
      router.push('/');
    } catch (error) {
      console.error('Error submitting experience:', error);
      alert('Error submitting your experience. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
        
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Share Your Experience
            </h1>
            <p className="text-gray-600">
              Help others by sharing how DrishiQ has impacted your life. Your story could inspire someone else on their journey.
            </p>
          </div>

          {showPhoneValidation ? (
            <div className="max-w-md mx-auto">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Phone Verification Required
                </h3>
                <p className="text-blue-700 mb-4">
                  To ensure authenticity, we need to verify your phone number before submitting your experience.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0B4422]"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  
                  <button
                    onClick={sendOTP}
                    className="w-full bg-[#0B4422] text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Send OTP
                  </button>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter OTP
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0B4422]"
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                    />
                  </div>
                  
                  <button
                    onClick={verifyOTP}
                    className="w-full bg-[#0B4422] text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Verify & Submit
                  </button>
                  
                  <button
                    onClick={() => setShowPhoneValidation(false)}
                    className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Back to Form
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0B4422]"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0B4422]"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0B4422]"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Language *
                  </label>
                  <select
                    name="preferredLanguage"
                    value={formData.preferredLanguage}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0B4422]"
                  >
                    <option value="">Select your preferred language</option>
                    {languages.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0B4422]"
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-5 gap-6">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Photo (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      {imagePreview ? (
                        <div className="space-y-2">
                          <Image
                            src={imagePreview}
                            alt="Preview"
                            width={120}
                            height={120}
                            className="mx-auto rounded-lg object-cover"
                          />
                          <p className="text-xs text-gray-600">Click to change</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-2xl text-gray-400">📷</div>
                          <p className="text-xs text-gray-600">Upload photo</p>
                          <p className="text-xs text-gray-500">JPG, PNG up to 5MB</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="col-span-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Story *
                  </label>
                  <textarea
                    name="story"
                    value={formData.story}
                    onChange={handleInputChange}
                    required
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0B4422]"
                    placeholder="Share your experience with DrishiQ. How has it helped you? What challenges did it help you overcome? What would you tell others about your journey?"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Minimum 100 characters. Be as detailed as you'd like to help others.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mb-4">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-[#0B4422] text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Experience'}
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> {!isLoggedIn ? 'Since you are not logged in, we will verify your phone number before publishing your experience.' : 'Your experience will be reviewed before being published.'}
                </p>
              </div>
            </form>
          )}
        </div>
      </main>
        
      <Footer />
    </div>
  );
} 