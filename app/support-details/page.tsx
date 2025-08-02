'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Footer from '../../components/Footer';
import Header from '../../components/Header';

interface SupportForm {
  name: string;
  email: string;
  phone: string;
  amount: number;
  cause: string;
  message: string;
  anonymous: boolean;
}

export default function SupportDetailsPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<SupportForm>({
    name: '',
    email: '',
    phone: '',
    amount: 50,
    cause: '',
    message: '',
    anonymous: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const causes = [
    'Mental Health Support',
    'Career Guidance',
    'Family & Relationships',
    'Education & Learning',
    'Financial Clarity',
    'Personal Growth',
    'Community Development',
    'Youth Empowerment',
    'Women Empowerment',
    'Rural Development',
    'Mental Health for Migrant Workers',
    'Support for Small Business Owners',
    'Other (Please specify)'
  ];

  const presetAmounts = [25, 50, 100, 200, 500];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleAmountChange = (amount: number) => {
    setFormData(prev => ({ ...prev, amount }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Mock API call to submit support details
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('Thank you for your support! We will process your contribution and reach out to you soon.');
      router.push('/');
    } catch (error) {
      alert('Error submitting your support details. Please try again.');
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
              Fuel a Session, Fuel a Life
            </h1>
            <p className="text-gray-600 text-lg">
              Choose how you want to make a difference and help someone find clarity.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Information</h2>
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
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0B4422]"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="anonymous"
                    checked={formData.anonymous}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <label className="text-sm text-gray-700">
                    Keep my contribution anonymous
                  </label>
                </div>
              </div>
            </div>

            {/* Cause Selection */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose Your Cause</h2>
              <p className="text-gray-600 mb-4">
                Select the cause that resonates with you. We'll direct your support to someone who needs it most in that area.
              </p>
              
              <select
                name="cause"
                value={formData.cause}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0B4422]"
              >
                <option value="">Select a cause that matters to you</option>
                {causes.map(cause => (
                  <option key={cause} value={cause}>{cause}</option>
                ))}
              </select>
            </div>

            {/* Personal Message */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Message (Optional)</h2>
              <p className="text-gray-600 mb-4">
                Share a message of encouragement that will be passed along to the person who receives your support.
              </p>
              
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0B4422]"
                placeholder="Share words of encouragement, hope, or your own story of finding clarity..."
              />
            </div>

            {/* Impact Summary */}
            <div className="bg-gradient-to-r from-[#0B4422] to-green-700 rounded-lg p-6 text-white">
              <h2 className="text-xl font-semibold mb-4">Your Impact Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">${formData.amount}</div>
                  <div className="text-sm opacity-90">Your Contribution</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{Math.floor(formData.amount / 25)}</div>
                  <div className="text-sm opacity-90">Sessions Provided</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">1</div>
                  <div className="text-sm opacity-90">Life Changed</div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-[#0B4422] text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {isSubmitting ? 'Processing...' : 'Complete Support'}
              </button>
            </div>
          </form>
        </div>
      </main>
        
      <Footer />
    </div>
  );
} 