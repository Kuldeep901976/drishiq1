'use client';

import { useState } from 'react';

export default function PricePlanEnhanced() {
  const t = (key: string) => key;
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedSupport, setSelectedSupport] = useState<string | null>(null);
  
  const handlePlanClick = (planId: string, price: string, href: string) => {
    setSelectedPlan(planId);
    setSelectedSupport(null);
    // Extract amount from price string
    const amount = price.replace(/[^\d]/g, '');
    if (amount) {
      redirectToPayment(amount, `${planId} plan`);
    } else {
      // For free plan or custom pricing, redirect to the original href
      window.location.href = href;
    }
  };
  
  const handleSupportClick = (supportId: string, amount: string, description: string) => {
    setSelectedSupport(supportId);
    setSelectedPlan(null);
    const cleanAmount = amount.replace(/[^\d]/g, '');
    redirectToPayment(cleanAmount, description);
  };
  
  const redirectToPayment = (amount: string, description: string) => {
    // Simulate payment gateway redirect with prefilled amount
    const paymentUrl = `/payment?amount=${amount}&description=${encodeURIComponent(description)}`;
    window.location.href = paymentUrl;
  };
  
  const handlePlaceholderClick = () => {
    // Scroll to support section
    const supportSection = document.querySelector('.support-section');
    if (supportSection) {
      supportSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSupporterDoubleClick = () => {
    // Redirect to payment page when double-clicking on supporter images
    redirectToPayment('500', 'Become a Supporter');
  };
  
  const getBadgeImage = (supportLevel: string) => {
    switch (supportLevel) {
      case 'seed':
        return '/images/badge-seed-support.png';
      case 'growth':
        return '/images/badge-growth-support.png';
      case 'wisdom':
        return '/images/badge-wisdom-support.png';
      case 'heart':
        return '/images/badge-heart-support.png';
      default:
        return '/images/badge-heart-support.png';
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Free Plan',
      price: '₹0',
      originalPrice: null,
      duration: '1 week',
      features: [
        'Access to basic features',
        '(1) session',
        'Community support'
      ],
      highlight: false,
      cta: 'Get Started',
      href: '/checkout/seed'
    },
    {
      id: 'seed',
      name: 'Seed Plan',
      price: '₹559',
      originalPrice: '₹699',
      duration: '2 weeks',
      features: [
        'All in free',
        '1 session',
        'Priority email support',
        'PDF download',
      ],
      highlight: false,
      cta: 'Choose Seed',
      href: '/checkout/seed'
    },
    {
      id: 'growth',
      name: 'Growth Plan',
      price: '₹4999',
      originalPrice: '₹6299',
      duration: '2 Months',
      features: [
        'All Seed features',
        '1-on-1 expert guidance',
        'Early access to new features'
      ],
      highlight: true,
      cta: 'Choose Growth',
      href: '/checkout/growth'
    },
    {
      id: 'enterprise',
      name: 'Enterprise Plan',
      price: '₹9999',
      originalPrice: '₹12999',
      duration: '1 month',
      features: [
        'All in seed',
        'Dedicated account manager',
        'Credit management',
        'Team analytics & reporting'
      ],
      highlight: false,
      cta: 'Select Enterprise',
      href: '/enterprise'
    }
  ];

  const supportLevels = [
    {
      id: 'seed',
      title: 'Seed Support',
      amount: '₹299',
      features: ['Seed Features',
      ],
      description: 'Support our mission and get a Seed Supporter badge!',
      image: '/assets/other-Icons/seedbadge.png'
    },
    {
      id: 'growth',
      title: 'Growth Support',
      amount: '₹2599',
      sessions: '10 sessions',
      description: 'Help us grow and unlock Growth Supporter perks.',
      image: '/assets/other-Icons/growthicon.png'
    },
    {
      id: 'wisdom',
      title: 'Wisdom Support',
      amount: '₹4999',
      sessions: '20 sessions',
      description: 'Become a Wisdom Supporter and inspire others.',
      image: '/assets/other-Icons/wisdombadge.png'
    },
    {
      id: 'heart',
      title: 'Heart Support',
      description: 'Support Us! You can donate any amount—every rupee counts and helps us move forward.',
      image: '/assets/other-Icons/donationicon.png'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Pricing
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the plan that fits your needs and start your journey with DrishiQ.
            </p>
          </div>
        </div>
      </div>
      {/* Plans Section */}
      <div className="relative w-full py-20" style={{ background: '#0B4422' }}>
        {/* Shiny revolving light overlay */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-1/2 top-1/2 w-[120%] h-[120%] -translate-x-1/2 -translate-y-1/2 animate-spin-slow" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 60%, transparent 100%)', borderRadius: '50%' }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Choose Your Plan
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-lg shadow-lg p-8 flex flex-col h-full z-10 ${
                  plan.highlight ? 'ring-2 ring-[#0B4422] transform scale-105' : ''
                } ${selectedPlan === plan.id ? 'ring-2 ring-blue-500' : ''}`}
                onDoubleClick={() => window.location.href = '/signin'}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-[#0B4422] text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-[#0B4422]">{plan.price}</span>
                    {plan.originalPrice && (
                      <span className="text-lg text-gray-500 line-through ml-2">
                        {plan.originalPrice}
                      </span>
                    )}
                    <p className="text-sm text-gray-500 mt-1">{plan.duration}</p>
                  </div>

                  <ul className="text-left space-y-3 mb-8">
                    {plan.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-auto">
                  <button
                    onClick={() => handlePlanClick(plan.id, plan.price, plan.href)}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                      plan.highlight
                        ? 'bg-[#0B4422] text-white hover:bg-green-700'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <style jsx>{`
          .animate-spin-slow {
            animation: spin 6s linear infinite;
          }
          @keyframes spin {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
          }
        `}</style>
      </div>

      {/* Support Section */}
      <div className="support-section bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Support DrishiQ
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Your support helps us keep DrishiQ accessible and growing for everyone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {supportLevels.map((level) => (
              <div
                key={level.id}
                className={`text-center p-6 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                  selectedSupport === level.id
                    ? 'border-[#0B4422] bg-green-50'
                    : 'border-gray-200 hover:border-[#0B4422] hover:bg-green-50'
                }`}
              >
                <div className="w-16 h-16 mx-auto mb-4">
                  <img
                    src={level.image}
                    alt={level.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{level.title}</h3>
                <p className="text-2xl font-bold text-[#0B4422] mb-2">{level.amount}</p>
                <p className="text-sm text-gray-600 mb-4">{level.description}</p>
                <button
                  onClick={() => handleSupportClick(level.id, level.amount || '', level.description)}
                  className="w-full py-2 px-4 rounded-lg font-semibold bg-[#0B4422] text-white hover:bg-green-700 transition-colors"
                >
                  Select
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 