'use client';

import Header from '@/components/Header';
import { useAuth } from '@/lib/auth-context';
import { useSupabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  credits: number;
  user_type: 'free' | 'premium' | 'enterprise';
  is_needy_support?: boolean;
}

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const { user, session } = useAuth();
  const { supabase } = useSupabase();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check authentication and load user profile
  useEffect(() => {
    const checkAuthAndLoadProfile = async () => {
      try {
        if (!user || !session) {
          // Redirect to signin if not authenticated
          router.push('/signin');
          return;
        }

        // Load user profile with credits
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error loading profile:', profileError);
          setError('Failed to load user profile');
          return;
        }

        setUserProfile(profile);

        // Check if user has any invitations (needy support)
        const { data: invitations } = await supabase
          .from('Invitations')
          .select('category, status')
          .eq('email', user.email)
          .eq('category', 'needy_support')
          .eq('status', 'approved');

        const isNeedySupport = invitations && invitations.length > 0;

        // Add welcome message based on user type
        let welcomeMessage: Message;
        if (isNeedySupport) {
          welcomeMessage = {
            id: Date.now().toString(),
            type: 'assistant',
            content: `Welcome ${profile.full_name || 'User'}! 👋 I'm your AI assistant. You have 1 free credit from our support program to complete one question or challenge. Use it wisely!`,
            timestamp: new Date()
          };
        } else {
          welcomeMessage = {
            id: Date.now().toString(),
            type: 'assistant',
            content: `Welcome ${profile.full_name || 'User'}! 👋 I'm your AI assistant.`,
            timestamp: new Date()
          };
        }
        setMessages([welcomeMessage]);

      } catch (error) {
        console.error('Error in checkAuthAndLoadProfile:', error);
        setError('Failed to initialize');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndLoadProfile();
  }, [user, session, router, supabase]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !userProfile) return;

    // Check if user has credits (for needy support users)
    if (userProfile.credits <= 0 && userProfile.is_needy_support) {
      setError('You have used your free credit. Please contact support for assistance.');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsSending(true);
    setError(null);

    try {
      // Simulate AI response (replace with actual AI API call)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `This is a simulated AI response to: "${inputMessage}". In the real implementation, this would be an actual AI response.`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);

      // Deduct credit for needy support users
      if (userProfile.is_needy_support && userProfile.credits > 0) {
        const newCredits = userProfile.credits - 1;
        setCreditsUsed(prev => prev + 1);
        
        // Update user credits in database
        const { error: updateError } = await supabase
          .from('users')
          .update({ credits: newCredits })
          .eq('id', userProfile.id);

        if (updateError) {
          console.error('Error updating credits:', updateError);
        } else {
          setUserProfile(prev => prev ? { ...prev, credits: newCredits } : null);
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleUpgradeClick = () => {
    router.push('/pricing');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B4422] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md mx-auto">
            <p className="font-bold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full pt-16">
        {/* Credit Status for Needy Support Users */}
        {userProfile?.is_needy_support && (
          <div className="bg-blue-50 border-b border-blue-200 p-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-blue-800">
                <span className="font-medium">Support Program Credit:</span>
                <span className="ml-2">
                  {userProfile.credits} credit{userProfile.credits !== 1 ? 's' : ''} remaining
                </span>
              </div>
              {userProfile.credits === 0 && (
                <div className="text-sm text-red-600 font-medium">
                  Credit used. Contact support for assistance.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`mb-4 ${message.type === 'user' ? 'flex justify-end' : 'flex justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === 'user' 
                  ? 'bg-[#0B4422] text-white' 
                  : 'bg-white text-gray-800 border border-gray-200'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {isSending && (
            <div className="flex justify-start mb-4">
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
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
          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          {/* Credit Warning for Needy Support Users */}
          {userProfile?.is_needy_support && userProfile.credits === 0 && (
            <div className="mb-3 bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 rounded text-sm">
              You have used your free credit. Please contact support for assistance.
            </div>
          )}

          <div className="flex space-x-4">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                userProfile?.is_needy_support && userProfile.credits === 0
                  ? "You have used your free credit"
                  : "Type your message..."
              }
              disabled={
                isSending || 
                (userProfile?.is_needy_support && userProfile.credits === 0)
              }
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B4422] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSendMessage}
              disabled={
                !inputMessage.trim() || 
                isSending || 
                (userProfile?.is_needy_support && userProfile.credits === 0)
              }
              className="px-6 py-2 bg-[#0B4422] text-white rounded-lg hover:bg-[#0B4422]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>

          {/* Upgrade Prompt for Regular Users */}
          {!userProfile?.is_needy_support && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 mb-2">
                Want unlimited access to AI insights?
              </p>
              <button
                onClick={handleUpgradeClick}
                className="text-sm text-[#0B4422] hover:underline font-medium"
              >
                Upgrade to Premium
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 