'use client';

import Header from '@/components/Header';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { flowController } from '../../lib/flow-controller';
import { supabase } from '../../lib/supabase';

type AdType = 'banner' | 'inline' | 'popup';
type UserType = 'free' | 'premium' | 'enterprise';

interface Advertisement {
  type: AdType;
  content: string;
  cta: string;
  link: string;
}

interface AdConfig {
  frequency: number;
  types: AdType[];
  maxAdsPerSession: number;
}

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'ad';
  content: string;
  timestamp: Date;
  adType?: AdType;
  userType?: UserType;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  type: UserType;
  messagesCount: number;
  joinDate: Date;
}

export default function Dashboard() {
  const router = useRouter();
  const t = (key: string) => key;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: '',
    name: '',
    email: '',
    type: 'free',
    messagesCount: 0,
    joinDate: new Date()
  });
  const [showAdPopup, setShowAdPopup] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Advertisement configuration based on user type
  const adConfig: Record<UserType, AdConfig> = {
    free: {
      frequency: 3, // Show ad every 3 messages
      types: ['banner', 'inline', 'popup'] as AdType[],
      maxAdsPerSession: 10
    },
    premium: {
      frequency: 10, // Show ad every 10 messages
      types: ['banner'] as AdType[],
      maxAdsPerSession: 3
    },
    enterprise: {
      frequency: 0, // No ads
      types: [] as AdType[],
      maxAdsPerSession: 0
    }
  };

  // Sample advertisements
  const advertisements: Advertisement[] = [
    {
      type: 'banner' as AdType,
      content: t('ads.premium.subtitle'),
      cta: t('ads.premium.cta'),
      link: '/upgrade'
    },
    {
      type: 'inline' as AdType,
      content: t('ads.pro_tip.subtitle'),
      cta: t('ads.pro_tip.cta'),
      link: '/premium-features'
    },
    {
      type: 'popup' as AdType,
      content: t('ads.enterprise.subtitle'),
      cta: t('ads.enterprise.cta'),
      link: '/enterprise'
    }
  ];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (showWelcome) {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `Hello ${userProfile.name}! 👋 I'm your AI assistant. I'm here to help you solve problems, answer questions, and provide insights. What would you like to know today?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      setShowWelcome(false);
    }
  }, [showWelcome, userProfile.name]);

  // Determine if an ad should be shown
  const shouldShowAd = (messageCount: number): boolean => {
    const config = adConfig[userProfile.type];
    return config.frequency > 0 && messageCount % config.frequency === 0;
  };

  // Get random advertisement
  const getRandomAd = (): Message => {
    const config = adConfig[userProfile.type];
    const availableAds = advertisements.filter(ad => config.types.includes(ad.type));
    const randomAd = availableAds[Math.floor(Math.random() * availableAds.length)];
    
    return {
      id: `ad-${Date.now()}`,
      type: 'ad',
      content: randomAd.content,
      timestamp: new Date(),
      adType: randomAd.type as 'banner' | 'inline' | 'popup',
      userType: userProfile.type
    };
  };

  // Simulate AI response
  const generateAIResponse = async (userMessage: string): Promise<string> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Simple response logic (in real app, this would be OpenAI API)
    const responses = [
      "That's a great question! Let me help you with that.",
      "I understand your concern. Here's what I think about it:",
      "Based on my knowledge, I can suggest the following approach:",
      "That's an interesting problem. Let me break it down for you:",
      "I'd be happy to help you solve this. Here's my recommendation:"
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    return `${randomResponse}\n\nRegarding "${userMessage}", here's a detailed response that would typically come from OpenAI's API. This is a placeholder for the actual AI integration.`;
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Update user profile
    const newMessageCount = userProfile.messagesCount + 1;
    setUserProfile(prev => ({ ...prev, messagesCount: newMessageCount }));

    try {
      // Generate AI response
      const aiResponse = await generateAIResponse(inputMessage);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Check if we should show an ad
      if (shouldShowAd(newMessageCount)) {
        const adMessage = getRandomAd();
        
        if (adMessage.adType === 'popup') {
          setShowAdPopup(true);
        } else {
          setTimeout(() => {
            setMessages(prev => [...prev, adMessage]);
          }, 500);
        }
      }

    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Render message
  const renderMessage = (message: Message) => {
    if (message.type === 'ad') {
      return (
        <div key={message.id} className="mb-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="text-yellow-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-800">{message.content}</p>
                <button className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium">
                  Learn More →
                </button>
              </div>
              <button className="text-gray-400 hover:text-gray-600 text-xs">
                ×
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={message.id} className={`mb-4 ${message.type === 'user' ? 'flex justify-end' : 'flex justify-start'}`}>
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          message.type === 'user' 
            ? 'bg-[#0B4422] text-white' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          <p className="text-xs mt-1 opacity-70">
            {message.timestamp.toLocaleTimeString()}
          </p>
        </div>
      </div>
    );
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      flowController.reset();
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0B4422] mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full pt-16">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(renderMessage)}
          
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  <span className="text-sm text-gray-600">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('dashboard.chat_placeholder')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B4422] focus:border-transparent resize-none"
                rows={1}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="bg-[#0B4422] text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-[#0B4422] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          
          {/* Usage Stats for Free Users */}
          {userProfile.type === 'free' && (
            <div className="mt-2 text-xs text-gray-500 flex justify-between">
              <span>{t('dashboard.messages_count').replace('{{count}}', userProfile.messagesCount.toString())}</span>
              <span>
                <Link href="/upgrade" className="text-[#0B4422] hover:underline">
                  {t('dashboard.upgrade_message')}
                </Link>
              </span>
            </div>
          )}
        </div>

        {/* Welcome Message */}
        {showWelcome && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  {t('dashboard.welcome_message')}
                </p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => setShowWelcome(false)}
                    className="inline-flex bg-blue-50 rounded-md p-1.5 text-blue-500 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <span className="sr-only">{t('common.close')}</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ad Popup */}
      {showAdPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">Special Offer!</h3>
              <button
                onClick={() => setShowAdPopup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              🎯 Boost your productivity with our Enterprise plan - unlimited everything!
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowAdPopup(false);
                  router.push('/enterprise');
                }}
                className="bg-[#0B4422] text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Contact Sales
              </button>
              <button
                onClick={() => setShowAdPopup(false)}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
