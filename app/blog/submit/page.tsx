'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import 'react-quill/dist/quill.snow.css';

interface BlogSubmission {
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  featuredImage: string;
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

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

// Custom image uploader for ReactQuill
const imageHandler = () => {
  const input = document.createElement('input');
  input.setAttribute('type', 'file');
  input.setAttribute('accept', 'image/*');
  input.click();

  input.onchange = () => {
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const quill = (document.querySelector('.ql-editor') as any)?.__quill;
        if (quill) {
          const range = quill.getSelection();
          quill.insertEmbed(range.index, 'image', reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };
};

export default function SubmitBlogPage(): JSX.Element {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState<BlogSubmission>({
    title: '',
    excerpt: '',
    content: '',
    author: '',
    category: 'Personal Growth',
    tags: [],
    featuredImage: ''
  });

  const [newTag, setNewTag] = useState('');

  const handleInputChange = (field: keyof BlogSubmission, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
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
      const response = await fetch('/api/blog/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          excerpt: formData.excerpt,
          content: formData.content,
          author: formData.author,
          author_email: '', // You can add email field if needed
          category: formData.category,
          tags: formData.tags,
          featured_image: formData.featuredImage
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit article');
      }

      console.log('Article submitted successfully:', result);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting article:', error);
      alert(error instanceof Error ? error.message : 'Failed to submit article');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedTheme = THEMES[formData.category as keyof typeof THEMES] || THEMES['Personal Growth'];

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Article Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for your submission. Our team will review your article and get back to you within 2-3 business days.
          </p>
          <div className="space-y-3">
            <Link
              href="/blog"
              className="block w-full bg-[#0B4422] text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Browse Articles
            </Link>
            <button
              onClick={() => {
                setSubmitted(false);
                setFormData({
                  title: '',
                  excerpt: '',
                  content: '',
                  author: '',
                  category: 'Personal Growth',
                  tags: [],
                  featuredImage: ''
                });
              }}
              className="block w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Submit Another Article
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              <span className="text-sm text-gray-500">Submit Article</span>
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
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Submit Your Article</h1>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-blue-900">Submission Guidelines</h3>
                    <ul className="text-sm text-blue-800 mt-1 space-y-1">
                      <li>• Articles will be reviewed within 2-3 business days</li>
                      <li>• We'll notify you via email once approved or if changes are needed</li>
                      <li>• Please ensure your content is original and follows our community guidelines</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Author Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => handleInputChange('author', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4422] focus:border-transparent"
                    placeholder="Enter your full name..."
                    required
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Article Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4422] focus:border-transparent"
                    placeholder="Enter the article title..."
                    required
                  />
                </div>

                {/* Excerpt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brief Description *
                  </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => handleInputChange('excerpt', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4422] focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Brief description of your article..."
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
                    {formData.tags.map(tag => (
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
                    Article Content *
                  </label>
                  <div className="bg-white border border-gray-300 rounded-lg">
                    <ReactQuill
                      value={formData.content}
                      onChange={val => handleInputChange('content', val)}
                      modules={{
                        toolbar: {
                          container: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'blockquote'],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            ['link', 'image'],
                            ['clean']
                          ],
                          handlers: {
                            image: imageHandler
                          }
                        }
                      }}
                      formats={['header', 'bold', 'italic', 'underline', 'blockquote', 'list', 'bullet', 'link', 'image']}
                      style={{ minHeight: 180 }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    You can format your article and embed images directly.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-[#0B4422] text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Submitting...' : 'Submit for Review'}
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
                      <span className="mx-2">•</span>
                      <span className="text-yellow-600">Pending Review</span>
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