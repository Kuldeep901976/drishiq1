export const dynamic = 'force-dynamic';

'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SupportSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [allocationDetails, setAllocationDetails] = useState<any>(null);
  
  const credits = searchParams.get('credits');
  const supportLevel = searchParams.get('support_level');
  const supporterName = searchParams.get('supporter_name');
  const isTestMode = searchParams.get('test') === 'true';

  const supportLevelInfo = {
    seed: { 
      title: 'Seed Supporter', 
      badge: '/assets/other-Icons/seedbadge.png',
      description: 'You\'ve planted the seed of hope! Your support helps nurture dreams and create opportunities for those in need.',
      message: 'Thank you for being a Seed Supporter! Your contribution of ₹299 has been allocated to help needy individuals access DrishiQ services. You\'ve planted the foundation for growth and transformation.',
      impact: 'Your seed support will help 1 individual access DrishiQ services and begin their journey of personal growth.'
    },
    growth: { 
      title: 'Growth Supporter', 
      badge: '/assets/other-Icons/growthicon.png',
      description: 'You\'re helping dreams grow! Your generous support enables multiple individuals to access transformative experiences.',
      message: 'Thank you for being a Growth Supporter! Your contribution of ₹2599 has been allocated to help 10 needy individuals access DrishiQ services. You\'re creating a ripple effect of positive change.',
      impact: 'Your growth support will help 10 individuals access DrishiQ services and accelerate their personal development journey.'
    },
    wisdom: { 
      title: 'Wisdom Supporter', 
      badge: '/assets/other-Icons/wisdombadge.png',
      description: 'You\'re sharing the gift of wisdom! Your significant support empowers many to gain insights and overcome challenges.',
      message: 'Thank you for being a Wisdom Supporter! Your contribution of ₹4999 has been allocated to help 20 needy individuals access DrishiQ services. You\'re spreading wisdom and creating lasting impact.',
      impact: 'Your wisdom support will help 20 individuals access DrishiQ services and gain valuable insights for their life challenges.'
    },
    heart: { 
      title: 'Heart Supporter', 
      badge: '/assets/other-Icons/donationicon.png',
      description: 'You\'ve shown incredible compassion! Your donation from the heart makes a real difference in people\'s lives.',
      message: 'Thank you for your Heart Support! Your generous donation has been allocated to help needy individuals access DrishiQ services. Your compassion is truly inspiring.',
      impact: 'Your heart support will help multiple individuals access DrishiQ services and find hope in their challenges.'
    }
  };

  const levelInfo = supportLevelInfo[supportLevel as keyof typeof supportLevelInfo] || 
    { 
      title: 'Supporter', 
      badge: '/assets/other-Icons/donationicon.png',
      description: 'Thank you for your support!',
      message: 'Thank you for your generous support!',
      impact: 'Your support will help individuals access DrishiQ services.'
    };

  const handleDownloadBadge = () => {
    // Create a temporary link to download the badge image
    const link = document.createElement('a');
    link.href = levelInfo.badge;
    link.download = `${levelInfo.title.replace(' ', '_')}_Badge.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareSupport = () => {
    const shareText = `I just became a ${levelInfo.title} for DrishiQ! 🌱 Supporting their mission to help people see through challenges. Join me in making a difference! #DrishiQ #Support #SeeThroughTheChallenge`;
    
    if (navigator.share) {
      navigator.share({
        title: `I'm a ${levelInfo.title}!`,
        text: shareText,
        url: window.location.origin
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Share text copied to clipboard!');
      });
    }
  };

  useEffect(() => {
    // Simulate fetching allocation details
    // In a real implementation, you'd fetch this from the API
    setTimeout(() => {
      setAllocationDetails({
        needy_name: 'Anonymous Individual',
        purpose: 'General support',
        allocated_at: new Date().toLocaleDateString()
      });
    }, 1000);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 flex items-center justify-center py-8">
      <div className="max-w-2xl w-full mx-auto p-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Test Mode Indicator */}
          {isTestMode && (
            <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl">🧪</span>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-800">Test Mode</h3>
                  <p className="text-sm text-yellow-700">This is a test run - no actual payment was processed</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Animation */}
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <img 
              src={levelInfo.badge} 
              alt={levelInfo.title}
              className="w-16 h-16 object-contain"
            />
          </div>

          <h1 className="text-3xl font-bold text-[#0B4422] mb-4">
            Thank You, {supporterName || 'Supporter'}!
          </h1>
          
          <p className="text-lg text-gray-600 mb-6">
            {levelInfo.description}
          </p>

          {/* Personal Message */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-900 mb-3">
              Your Support Message
            </h2>
            <p className="text-blue-800 leading-relaxed">
              {levelInfo.message}
            </p>
          </div>

          {/* Credit Allocation Summary */}
          <div className="bg-green-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-[#0B4422] mb-4">
              Your Contribution Summary
            </h2>
            
            <div className="space-y-3 text-left">
              <div className="flex justify-between">
                <span className="text-gray-600">Support Level:</span>
                <span className="font-semibold text-[#0B4422]">{levelInfo.title}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Credits Allocated:</span>
                <span className="font-semibold text-green-600">{credits} credits</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Allocation Date:</span>
                <span className="font-semibold text-gray-800">
                  {allocationDetails?.allocated_at || new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Impact Message */}
          <div className="bg-purple-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-purple-900 mb-3">
              Your Impact
            </h3>
            <p className="text-purple-800 text-sm leading-relaxed">
              {levelInfo.impact}
            </p>
          </div>

          {/* Badge Download Section */}
          <div className="bg-yellow-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-yellow-900 mb-4">
              Your Supporter Badge
            </h3>
            <div className="flex flex-col items-center space-y-4">
              <img 
                src={levelInfo.badge} 
                alt={`${levelInfo.title} Badge`}
                className="w-32 h-32 object-contain border-4 border-yellow-200 rounded-lg"
              />
              <div className="space-y-3">
                <button
                  onClick={handleDownloadBadge}
                  className="w-full bg-yellow-600 text-white py-3 px-6 rounded-lg hover:bg-yellow-700 transition-colors font-semibold"
                >
                  📥 Download Badge
                </button>
                <button
                  onClick={handleShareSupport}
                  className="w-full border-2 border-yellow-600 text-yellow-600 py-3 px-6 rounded-lg hover:bg-yellow-600 hover:text-white transition-colors font-semibold"
                >
                  📤 Share Your Support
                </button>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="space-y-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-[#0B4422] text-white py-3 rounded-lg hover:bg-[#083318] transition-colors font-semibold"
            >
              Go to Dashboard
            </button>
            
            <button
              onClick={() => router.push('/priceplan-enhanced')}
              className="w-full border-2 border-[#0B4422] text-[#0B4422] py-3 rounded-lg hover:bg-[#0B4422] hover:text-white transition-colors font-semibold"
            >
              Support Again
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="w-full text-[#0B4422] py-2 hover:underline"
            >
              Return to Home
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">
              You'll receive a confirmation email with your support details and badge.
            </p>
            <p className="text-xs text-gray-500">
              Questions? Contact us at support@drishiq.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 