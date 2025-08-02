'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  readTime: string;
  category: string;
  tags: string[];
  featuredImage: string;
  showOnLanding: boolean;
}

const CATEGORIES = [
  'Personal Growth',
  'Productivity', 
  'Motivation',
  'Relationships',
  'Mental Health',
  'Self-Reflection',
  'Clarity',
  'Decision Making'
];

const THEMES = {
  'Personal Growth': {
    color: '#0B4422',
    bgColor: '#EFF7F1',
    icon: '🌱'
  },
  'Productivity': {
    color: '#1E40AF',
    bgColor: '#EFF6FF',
    icon: '⚡'
  },
  'Motivation': {
    color: '#DC2626',
    bgColor: '#FEF2F2',
    icon: '🔥'
  },
  'Relationships': {
    color: '#7C3AED',
    bgColor: '#F3F4F6',
    icon: '💝'
  },
  'Mental Health': {
    color: '#059669',
    bgColor: '#ECFDF5',
    icon: '🧠'
  },
  'Self-Reflection': {
    color: '#D97706',
    bgColor: '#FFFBEB',
    icon: '🔍'
  },
  'Clarity': {
    color: '#0B4422',
    bgColor: '#EFF7F1',
    icon: '✨'
  },
  'Decision Making': {
    color: '#1F2937',
    bgColor: '#F9FAFB',
    icon: '🎯'
  }
};

export default function CreateBlogPage(): JSX.Element {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  const [formData, setFormData] = useState<Partial<BlogPost>>({
    title: '',
    excerpt: '',
    content: '',
    author: 'Team DrishiQ',
    category: 'Personal Growth',
    tags: [],
    featuredImage: '',
    showOnLanding: false
  });

  const [newTag, setNewTag] = useState('');

  const handleInputChange = (field: keyof BlogPost, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Generate slug from title
      const slug = generateSlug(formData.title || '');
      const readTime = calculateReadTime(formData.content || '');
      const publishedAt = new Date().toISOString();

      const blogPost: BlogPost = {
        ...formData as BlogPost,
        slug,
        readTime,
        publishedAt
      };

      // Here you would typically make an API call to save the blog post
      console.log('Saving blog post:', blogPost);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to the new blog post
      router.push(`/blog/${slug}`);
    } catch (error) {
      console.error('Error saving blog post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedTheme = THEMES[formData.category as keyof typeof THEMES] || THEMES['Personal Growth'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/assets/logo/Logo.png"
                alt="DrishiQ"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
              <span className="text-sm text-gray-500">Blog Creator</span>
            </Link>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {previewMode ? 'Edit Mode' : 'Preview Mode'}
              </button>
              <Link 
                href="/blog"
                className="bg-[#0B4422] text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                View Blog
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className={`${previewMode ? 'hidden lg:block' : ''}`}>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Blog Post</h1>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4422] focus:border-transparent"
                    placeholder="Enter the blog post title..."
                    required
                  />
                </div>

                {/* Excerpt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Excerpt *
                  </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => handleInputChange('excerpt', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4422] focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Brief description of the article..."
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4422] focus:border-transparent"
                    required
                  >
                    {CATEGORIES.map(category => (
                      <option key={category} value={category}>
                        {THEMES[category as keyof typeof THEMES]?.icon} {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Featured Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Featured Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.featuredImage}
                    onChange={(e) => handleInputChange('featuredImage', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4422] focus:border-transparent"
                    placeholder="https://images.unsplash.com/..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Recommended: 800x600 aspect ratio from Unsplash or similar
                  </p>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4422] focus:border-transparent"
                      placeholder="Add a tag..."
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-[#0B4422] text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags?.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 bg-green-100 text-[#0B4422] px-3 py-1 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-[#0B4422] hover:text-red-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4422] focus:border-transparent resize-none"
                    rows={15}
                    placeholder="Write your blog post content here. You can use HTML tags like <h2>, <p>, <ul>, <li>, <strong>, <em>, <blockquote>..."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supports HTML tags: &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;blockquote&gt;
                  </p>
                </div>

                {/* Show on Landing Page */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Show on Landing Page
                  </label>
                  <button
                    type="button"
                    onClick={() => handleInputChange('showOnLanding', !formData.showOnLanding)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.showOnLanding ? 'bg-[#0B4422]' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.showOnLanding ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-[#0B4422] text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Publishing...' : 'Publish Article'}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/blog')}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Preview Section */}
          <div className={`${previewMode ? 'lg:col-span-2' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Preview</h2>
                <p className="text-sm text-gray-600">How your article will appear to readers</p>
              </div>

              {formData.title ? (
                <div className="p-6">
                  {/* Preview Header */}
                  <div className="mb-6">
                    <div 
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium text-white mb-3"
                      style={{ backgroundColor: selectedTheme.color }}
                    >
                      <span>{selectedTheme.icon}</span>
                      {formData.category}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {formData.title}
                    </h1>
                    <p className="text-gray-600 mb-4">
                      {formData.excerpt}
                    </p>
                    <div className="flex items-center text-sm text-gray-500">
                      <span>By {formData.author}</span>
                      <span className="mx-2">•</span>
                      <span>{calculateReadTime(formData.content || '')}</span>
                      {formData.showOnLanding && (
                        <>
                          <span className="mx-2">•</span>
                          <span className="text-green-600">Featured on Landing Page</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Preview Content */}
                  {formData.content && (
                    <div 
                      className="prose prose-lg max-w-none prose-headings:text-[#0B4422] prose-a:text-[#0B4422] prose-blockquote:border-l-[#0B4422] prose-blockquote:bg-green-50"
                      dangerouslySetInnerHTML={{ __html: formData.content }}
                    />
                  )}

                  {/* Preview Tags */}
                  {formData.tags && formData.tags.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map(tag => (
                          <span
                            key={tag}
                            className="bg-green-100 text-[#0B4422] px-3 py-1 rounded-full text-sm font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <p>Start typing to see a preview of your article</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 