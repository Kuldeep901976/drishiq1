'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  category: string;
  story: string;
  date: string;
  verified: boolean;
  featured: boolean;
}

export default function TestimonialsPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const testimonials: Testimonial[] = [
    {
      id: '1',
      name: 'Sarah Chen',
      role: 'Marketing Professional',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      rating: 5,
      category: 'Personal Growth',
      story: 'DrishiQ helped me see through my daily challenges with such clarity. The multilingual support made it accessible for my entire family. I finally found the perspective I needed to navigate complex work relationships and personal decisions.',
      date: '2 weeks ago',
      verified: true,
      featured: true
    },
    {
      id: '2',
      name: 'Michael Rodriguez',
      role: 'Software Engineer',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      rating: 5,
      category: 'Career Development',
      story: 'Instead of giving me advice, DrishiQ helped me explore my own thoughts. It\'s like having a wise friend who asks the right questions. Game-changer for decision-making in my career transitions.',
      date: '1 week ago',
      verified: true,
      featured: true
    },
    {
      id: '3',
      name: 'Priya Patel',
      role: 'Healthcare Worker',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      rating: 5,
      category: 'Community',
      story: 'The cause-based matching is incredible. I feel like I\'m part of something bigger when I support others through DrishiQ. It\'s not just about me anymore - it\'s about creating positive change.',
      date: '3 days ago',
      verified: true,
      featured: true
    }
  ];

  const categories = ['all', 'Personal Growth', 'Career Development', 'Relationships', 'Financial Clarity', 'Community', 'Education', 'Health & Wellness'];

  const filteredTestimonials = testimonials.filter(testimonial => {
    const matchesCategory = selectedCategory === 'all' || testimonial.category === selectedCategory;
    const matchesSearch = testimonial.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         testimonial.story.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         testimonial.role.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-[#0B4422]">DrishiQ</h1>
              <span className="text-sm text-gray-600">Intelligence of Perception</span>
            </div>
            <button 
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-[#0B4422] text-white rounded-lg hover:bg-[#0a3a1e] transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Real Stories. Real Shifts.
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Discover how DrishiQ has transformed lives across the globe. Every story represents a journey of clarity, growth, and positive change.
          </p>
          
          {/* Search and Filter */}
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search testimonials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B4422] focus:border-transparent"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-[#0B4422] text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {category === 'all' ? 'All Stories' : category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Featured Testimonials */}
        {filteredTestimonials.filter(t => t.featured).length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Featured Stories
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {filteredTestimonials.filter(t => t.featured).map(testimonial => (
                <div key={testimonial.id} className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-[#0B4422] transform hover:scale-105 transition-all duration-300">
                  <div className="flex items-start mb-6">
                    <div className="relative">
                      <Image 
                        src={testimonial.avatar} 
                        alt={testimonial.name} 
                        width={70} 
                        height={70}
                        className="rounded-full object-cover"
                      />
                      {testimonial.verified && (
                        <div className="absolute -bottom-1 -right-1 bg-[#0B4422] text-white rounded-full w-7 h-7 flex items-center justify-center text-xs">
                          ✓
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">{testimonial.name}</h3>
                          <p className="text-gray-500">{testimonial.role}</p>
                        </div>
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                          Featured
                        </span>
                      </div>
                      <div className="flex items-center mt-2">
                        <div className="flex text-yellow-400 mr-2">
                          {renderStars(testimonial.rating)}
                        </div>
                        <span className="text-sm text-gray-500">{testimonial.rating}.0</span>
                      </div>
                    </div>
                  </div>
                  <blockquote className="text-gray-700 italic leading-relaxed text-lg mb-4">
                    "{testimonial.story}"
                  </blockquote>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="bg-green-100 text-[#0B4422] px-3 py-1 rounded-full font-medium">
                      {testimonial.category}
                    </span>
                    <span>{testimonial.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Testimonials */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            All Stories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTestimonials.map(testimonial => (
              <div key={testimonial.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <div className="relative">
                    <Image 
                      src={testimonial.avatar} 
                      alt={testimonial.name} 
                      width={50} 
                      height={50}
                      className="rounded-full object-cover"
                    />
                    {testimonial.verified && (
                      <div className="absolute -bottom-1 -right-1 bg-[#0B4422] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                        ✓
                      </div>
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="font-semibold text-gray-900">{testimonial.name}</h3>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex text-yellow-400 mb-3">
                  {renderStars(testimonial.rating)}
                </div>
                <blockquote className="text-gray-700 italic text-sm leading-relaxed mb-4">
                  "{testimonial.story.length > 150 ? testimonial.story.substring(0, 150) + '...' : testimonial.story}"
                </blockquote>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                    {testimonial.category}
                  </span>
                  <span>{testimonial.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-20 mb-12 bg-gradient-to-r from-[#0B4422] to-green-700 rounded-2xl shadow-xl p-12 text-white">
          <h3 className="text-3xl font-bold mb-4">
            Share Your Transformation
          </h3>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Your story could inspire someone else on their journey. Share how DrishiQ has helped you find clarity and make positive changes in your life.
          </p>
          <button 
            onClick={() => router.push('/share-experience')} 
            className="bg-white text-[#0B4422] px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
          >
            ✨ Share Your Experience
          </button>
        </div>
      </main>
      
      {/* Simple Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 DrishiQ. Intelligence of Perception.</p>
        </div>
      </footer>
    </div>
  );
} 