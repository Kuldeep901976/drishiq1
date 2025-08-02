'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function SupportPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [supporterName, setSupporterName] = useState('');
  const [supporterEmail, setSupporterEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  const amount = searchParams.get('amount');
  const description = searchParams.get('description');
  const supportLevel = searchParams.get('support_level');
  const [customAmount, setCustomAmount] = useState(amount || '');

  // Define credit allocation based on support level
  const creditAllocation: Record<string, { credits: number; title: string; fixedAmount: string | null }> = {
    seed: { credits: 1, title: 'Seed Support', fixedAmount: '299' },
    growth: { credits: 10, title: 'Growth Support', fixedAmount: '2599' },
    wisdom: { credits: 20, title: 'Wisdom Support', fixedAmount: '4999' },
    heart: { credits: 5, title: 'Heart Support', fixedAmount: null }
  };

  const allocation = creditAllocation[supportLevel as keyof typeof creditAllocation] || { credits: 1, title: 'Support', fixedAmount: null };

  // For heart support, calculate credits based on amount
  const getHeartCredits = (amount: string) => {
    const numAmount = parseInt(amount) || 0;
    if (numAmount >= 1000) return 10;
    if (numAmount >= 500) return 5;
    if (numAmount >= 100) return 2;
    return 1;
  };

  const finalAmount = supportLevel === 'heart' ? customAmount : amount;
  const finalCredits = supportLevel === 'heart' ? getHeartCredits(customAmount) : allocation.credits;

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!supporterName.trim()) {
      newErrors.supporterName = 'Please enter your name';
    }
    
    if (!supporterEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supporterEmail)) {
      newErrors.supporterEmail = 'Please enter a valid email address';
    }
    
    if (!cardNumber || cardNumber.length < 16) {
      newErrors.cardNumber = 'Please enter a valid card number';
    }
    
    if (!expiryDate || !/^\d{2}\/\d{2}$/.test(expiryDate)) {
      newErrors.expiryDate = 'Please enter expiry date (MM/YY)';
    }
    
    if (!cvv || cvv.length < 3) {
      newErrors.cvv = 'Please enter a valid CVV';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirmPayment = async () => {
    if (!validateForm()) return;
    
    setIsProcessing(true);
    
    try {
      // Call the support credit allocation API
      const response = await fetch('/api/support/allocate-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          support_level: supportLevel,
          amount: finalAmount,
          supporter_email: supporterEmail,
          supporter_name: supporterName,
          purpose: 'general'
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Payment successful - redirect to support success page with badge download
        router.push(`/support-success?credits=${finalCredits}&support_level=${supportLevel}&supporter_name=${encodeURIComponent(supporterName)}`);
      } else {
        // Payment failed
        setErrors({ payment: result.error || 'Payment failed. Please try again.' });
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setErrors({ payment: 'Payment processing failed. Please try again.' });
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#F5F7F6] to-[#F0F2F1] flex items-center justify-center py-8">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-[#0B4422] mb-2">
              Support DrishiQ
            </h1>
            <p className="text-gray-600">
              Your support helps needy individuals access DrishiQ services
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-6 mb-8">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Support Level:</span>
                <span className="font-semibold text-[#0B4422]">{allocation.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Credits to Allocate:</span>
                <span className="font-semibold text-green-600">{finalCredits} credits</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold text-[#0B4422]">₹{finalAmount || '0'}</span>
              </div>
              <div className="text-sm text-gray-600 mt-2">
                These credits will be automatically allocated to needy individuals who need support.
              </div>
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleConfirmPayment(); }} className="space-y-6">
            <div>
              <label htmlFor="supporterName" className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                id="supporterName"
                value={supporterName}
                onChange={(e) => setSupporterName(e.target.value)}
                placeholder="Enter your full name"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0B4422] focus:border-transparent ${
                  errors.supporterName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.supporterName && (
                <p className="text-red-500 text-sm mt-1">{errors.supporterName}</p>
              )}
            </div>

            <div>
              <label htmlFor="supporterEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="supporterEmail"
                value={supporterEmail}
                onChange={(e) => setSupporterEmail(e.target.value)}
                placeholder="Enter your email"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0B4422] focus:border-transparent ${
                  errors.supporterEmail ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.supporterEmail && (
                <p className="text-red-500 text-sm mt-1">{errors.supporterEmail}</p>
              )}
            </div>

            {supportLevel === 'heart' && (
              <div>
                <label htmlFor="customAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  Donation Amount (₹)
                </label>
                <input
                  type="number"
                  id="customAmount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Enter your donation amount"
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4422] focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Every rupee counts! Suggested amounts: ₹100 (2 credits), ₹500 (5 credits), ₹1000+ (10 credits)
                </p>
              </div>
            )}

            <div>
              <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Card Number
              </label>
              <input
                type="text"
                id="cardNumber"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0B4422] focus:border-transparent ${
                  errors.cardNumber ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.cardNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date
                </label>
                <input
                  type="text"
                  id="expiryDate"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                  placeholder="MM/YY"
                  maxLength={5}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0B4422] focus:border-transparent ${
                    errors.expiryDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.expiryDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>
                )}
              </div>

              <div>
                <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-2">
                  CVV
                </label>
                <input
                  type="text"
                  id="cvv"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                  placeholder="123"
                  maxLength={4}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0B4422] focus:border-transparent ${
                    errors.cvv ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.cvv && (
                  <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>
                )}
              </div>
            </div>

            {errors.payment && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{errors.payment}</p>
              </div>
            )}

            <div className="space-y-4">
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-[#0B4422] text-white py-3 rounded-lg hover:bg-[#083318] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing Support Payment...
                  </div>
                ) : (
                  `Support with ₹${finalAmount || '0'}`
                )}
              </button>
              
              <button
                type="button"
                onClick={async () => {
                  if (!validateForm()) return;
                  
                  setIsProcessing(true);
                  
                  // Simulate API call delay
                  setTimeout(() => {
                    setIsProcessing(false);
                    // Redirect to success page with test data
                    router.push(`/support-success?credits=${finalCredits}&support_level=${supportLevel}&supporter_name=${encodeURIComponent(supporterName)}&test=true`);
                  }, 2000);
                }}
                className="w-full bg-yellow-600 text-white py-3 rounded-lg hover:bg-yellow-700 transition-colors font-semibold"
              >
                🧪 Test Support Flow (Skip Payment)
              </button>
              
              <button
                type="button"
                onClick={() => {
                  // Quick test without validation
                  router.push(`/support-success?credits=${finalCredits}&support_level=${supportLevel}&supporter_name=Test%20User&test=true`);
                }}
                className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
              >
                ⚡ Quick Test (No Validation)
              </button>
              
              <button
                type="button"
                onClick={() => router.push('/priceplan-enhanced')}
                className="w-full text-[#0B4422] py-2 hover:underline"
              >
                ← Back to Support Options
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 mb-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span>Secure Payment</span>
            </div>
            <p className="text-xs text-gray-500">
              Your payment information is encrypted and secure. Credits will be automatically allocated to needy individuals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 