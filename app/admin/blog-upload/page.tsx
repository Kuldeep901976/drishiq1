'use client';

import { useSupabase } from '@/lib/supabase';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

interface BlogPost {
  id?: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  topics: string[];
  read_time: string;
  author: string;
  publish_date: string;
  featured_image: string;
  video_url?: string;
  status: 'draft' | 'published';
  seo_title?: string;
  seo_description?: string;
  tags: string[];
  created_at?: string;
  updated_at?: string;
}

const CATEGORIES = [
  { id: 'business', name: 'Business Challenges', icon: '💼' },
  { id: 'technical', name: 'Technical Solutions', icon: '⚙️' },
  { id: 'professional', name: 'Professional Growth', icon: '📈' },
  { id: 'howto', name: 'How-To Guides', icon: '📚' },
  { id: 'case-studies', name: 'Case Studies', icon: '📊' },
  { id: 'insights', name: 'Insights & Analysis', icon: '🔍' }
];

const TOPICS = [
  'Strategy', 'Operations', 'Management', 'Growth', 'Development', 
  'Infrastructure', 'Performance', 'Security', 'Leadership', 
  'Communication', 'Skills Development', 'Career Planning',
  'Best Practices', 'Step-by-Step', 'Quick Solutions', 'Tips & Tricks',
  'Problem Solving', 'Decision Making', 'Innovation', 'Team Building'
];

export default function BlogUploadPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeStep, setActiveStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { supabase } = useSupabase();

  const [blogPost, setBlogPost] = useState<BlogPost>({
    title: '',
    content: '',
    excerpt: '',
    category: 'business',
    topics: [],
    read_time: '5 min',
    author: '',
    publish_date: new Date().toISOString().split('T')[0],
    featured_image: '',
    video_url: '',
    status: 'draft',
    seo_title: '',
    seo_description: '',
    tags: []
  });

  const [newTopic, setNewTopic] = useState('');
  const [newTag, setNewTag] = useState('');

  const handleInputChange = (field: keyof BlogPost, value: any) => {
    setBlogPost(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        handleInputChange('featured_image', e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        handleInputChange('video_url', e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addTopic = () => {
    if (newTopic && !blogPost.topics.includes(newTopic)) {
      handleInputChange('topics', [...blogPost.topics, newTopic]);
      setNewTopic('');
    }
  };

  const removeTopic = (topic: string) => {
    handleInputChange('topics', blogPost.topics.filter(t => t !== topic));
  };

  const addTag = () => {
    if (newTag && !blogPost.tags.includes(newTag)) {
      handleInputChange('tags', [...blogPost.tags, newTag]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    handleInputChange('tags', blogPost.tags.filter(t => t !== tag));
  };

  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min`;
  };

  const handleContentChange = (content: string) => {
    handleInputChange('content', content);
    handleInputChange('read_time', calculateReadTime(content));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    // Validate required fields
    if (!blogPost.title || !blogPost.author || !blogPost.excerpt || !blogPost.content) {
      setMessage('Error: Please fill in all required fields.');
      setIsLoading(false);
      return;
    }

    // Validate excerpt length
    if (blogPost.excerpt.length > 200) {
      setMessage('Error: Excerpt must be 200 characters or less.');
      setIsLoading(false);
      return;
    }

    try {
      // Upload featured image to Supabase Storage if exists
      let featured_image_url = '';
      if (blogPost.featured_image) {
        const { data: imageData, error: imageError } = await supabase.storage
          .from('blog-images')
          .upload(`featured/${Date.now()}-${blogPost.title.toLowerCase().replace(/\s+/g, '-')}`, 
            blogPost.featured_image, 
            { contentType: 'image/jpeg' }
          );

        if (imageError) throw new Error(`Failed to upload image: ${imageError.message}`);
        if (imageData) featured_image_url = imageData.path;
      }

      // Upload video to Supabase Storage if exists
      let video_url = '';
      if (blogPost.video_url) {
        const { data: videoData, error: videoError } = await supabase.storage
          .from('blog-videos')
          .upload(`videos/${Date.now()}-${blogPost.title.toLowerCase().replace(/\s+/g, '-')}`,
            blogPost.video_url,
            { contentType: 'video/mp4' }
          );

        if (videoError) throw new Error(`Failed to upload video: ${videoError.message}`);
        if (videoData) video_url = videoData.path;
      }

      // Insert blog post into Supabase
      const { data, error } = await supabase
        .from('blog_posts')
        .insert([{
          ...blogPost,
          featured_image: featured_image_url || null,
          video_url: video_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setMessage('Blog post saved successfully!');
      setTimeout(() => {
        router.push('/admin/blog-management');
      }, 2000);
    } catch (error) {
      console.error('Save error:', error);
      setMessage(error instanceof Error ? error.message : 'Error saving blog post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { id: 1, name: 'Basic Info', icon: '📝' },
    { id: 2, name: 'Media', icon: '🖼️' },
    { id: 3, name: 'Content', icon: '✍️' },
    { id: 4, name: 'SEO', icon: '🔍' },
    { id: 5, name: 'Publish', icon: '🚀' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B4422]/5 via-[#166534]/5 to-[#15803d]/5 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#0B4422]/10 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-[#0B4422] mb-2">
                Create New Blog Post
              </h1>
              <p className="text-gray-600">Share your insights with the DrishiQ community</p>
            </div>
            <button
              onClick={() => router.push('/admin/blog-management')}
              className="px-6 py-3 bg-[#0B4422]/10 text-[#0B4422] rounded-xl hover:bg-[#0B4422]/20 transition-all duration-200 font-medium flex items-center gap-2"
            >
              <span>←</span>
              <span>Back to Management</span>
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#0B4422]/10 p-6 mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button 
                  onClick={() => setActiveStep(step.id)}
                  className={`flex items-center justify-center w-12 h-12 rounded-xl text-lg font-semibold transition-all duration-300 ${
                    activeStep >= step.id 
                      ? 'bg-[#0B4422] text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {step.icon}
                </button>
                <span className={`ml-3 font-medium ${
                  activeStep >= step.id ? 'text-[#0B4422]' : 'text-gray-400'
                }`}>
                  {step.name}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 rounded-full transition-all duration-300 ${
                    activeStep > step.id ? 'bg-[#0B4422]' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className={`bg-white rounded-2xl shadow-lg border border-[#0B4422]/10 p-8 transition-all duration-300 ${activeStep === 1 ? 'opacity-100' : 'opacity-50'}`}>
            <div className="flex items-center mb-6">
              <span className="text-2xl mr-3">📝</span>
              <h2 className="text-2xl font-bold text-[#0B4422]">Basic Information</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={blogPost.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-[#0B4422] focus:border-[#0B4422] transition-all duration-200"
                    placeholder="Enter a compelling title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Author *
                  </label>
                  <input
                    type="text"
                    required
                    value={blogPost.author}
                    onChange={(e) => handleInputChange('author', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-[#0B4422] focus:border-[#0B4422] transition-all duration-200"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    required
                    value={blogPost.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-[#0B4422] focus:border-[#0B4422] transition-all duration-200"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Publish Date
                  </label>
                  <input
                    type="date"
                    value={blogPost.publish_date}
                    onChange={(e) => handleInputChange('publish_date', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-[#0B4422] focus:border-[#0B4422] transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Excerpt *
                </label>
                <textarea
                  required
                  value={blogPost.excerpt}
                  onChange={(e) => handleInputChange('excerpt', e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-[#0B4422] focus:border-[#0B4422] transition-all duration-200 resize-none"
                  placeholder="Write a compelling excerpt..."
                />
                <p className="text-sm text-gray-500 mt-2 flex items-center justify-end">
                  <span className={blogPost.excerpt.length > 200 ? 'text-red-500' : ''}>
                    {blogPost.excerpt.length}
                  </span>
                  <span>/200 characters</span>
                </p>
              </div>
            </div>
          </div>

          {/* Media Upload */}
          <div className={`bg-white rounded-2xl shadow-lg border border-[#0B4422]/10 p-8 transition-all duration-300 ${activeStep === 2 ? 'opacity-100' : 'opacity-50'}`}>
            <div className="flex items-center mb-6">
              <span className="text-2xl mr-3">🖼️</span>
              <h2 className="text-2xl font-bold text-[#0B4422]">Media Assets</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Featured Image */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Featured Image
                </label>
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                    blogPost.featured_image ? 'border-[#0B4422]' : 'border-gray-300 hover:border-[#0B4422]'
                  }`}
                >
                  {blogPost.featured_image ? (
                    <div className="relative">
                      <Image
                        src={blogPost.featured_image}
                        alt="Featured"
                        width={300}
                        height={200}
                        className="mx-auto rounded-lg shadow-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleInputChange('featured_image', '')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors duration-200 shadow-lg"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-4xl">📷</div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[#0B4422] hover:text-[#166534] font-semibold transition-colors duration-200"
                      >
                        Click to upload image
                      </button>
                      <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Video Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Video (Optional)
                </label>
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                    blogPost.video_url ? 'border-[#0B4422]' : 'border-gray-300 hover:border-[#0B4422]'
                  }`}
                >
                  {blogPost.video_url ? (
                    <div className="relative">
                      <video
                        src={blogPost.video_url}
                        controls
                        className="mx-auto rounded-lg shadow-lg max-w-full"
                      />
                      <button
                        type="button"
                        onClick={() => handleInputChange('video_url', '')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors duration-200 shadow-lg"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-4xl">🎥</div>
                      <button
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        className="text-[#0B4422] hover:text-[#166534] font-semibold transition-colors duration-200"
                      >
                        Click to upload video
                      </button>
                      <p className="text-sm text-gray-500">MP4, WebM up to 100MB</p>
                    </div>
                  )}
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className={`bg-white rounded-2xl shadow-lg border border-[#0B4422]/10 p-8 transition-all duration-300 ${activeStep === 3 ? 'opacity-100' : 'opacity-50'}`}>
            <div className="flex items-center mb-6">
              <span className="text-2xl mr-3">✍️</span>
              <h2 className="text-2xl font-bold text-[#0B4422]">Content</h2>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Blog Content *
              </label>
              <div className="relative">
                <textarea
                  required
                  value={blogPost.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  rows={20}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-[#0B4422] focus:border-[#0B4422] transition-all duration-200 resize-none"
                  placeholder="Write your blog content here... You can use markdown formatting for rich text."
                />
                <div className="absolute bottom-4 right-4 flex items-center gap-4 text-sm text-gray-500">
                  <span>
                    {blogPost.content.split(/\s+/).length} words
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-[#0B4422]">
                    {blogPost.read_time} read
                  </span>
                </div>
              </div>
            </div>

            {/* Topics */}
            <div className="mt-8">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Topics
              </label>
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-[#0B4422] focus:border-[#0B4422] transition-all duration-200"
                  placeholder="Add a topic..."
                  list="topic-suggestions"
                />
                <datalist id="topic-suggestions">
                  {TOPICS.map(topic => (
                    <option key={topic} value={topic} />
                  ))}
                </datalist>
                <button
                  type="button"
                  onClick={addTopic}
                  className="px-6 py-3 bg-[#0B4422] text-white rounded-xl hover:bg-[#166534] transition-all duration-200 font-semibold"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {blogPost.topics.map(topic => (
                  <span
                    key={topic}
                    className="inline-flex items-center px-4 py-2 rounded-xl text-sm bg-[#0B4422] text-white shadow-md"
                  >
                    {topic}
                    <button
                      type="button"
                      onClick={() => removeTopic(topic)}
                      className="ml-2 text-white hover:text-red-200 transition-colors duration-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="mt-8">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-[#0B4422] focus:border-[#0B4422] transition-all duration-200"
                  placeholder="Add a tag..."
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-6 py-3 bg-[#0B4422] text-white rounded-xl hover:bg-[#166534] transition-all duration-200 font-semibold"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {blogPost.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-4 py-2 rounded-xl text-sm bg-gray-100 text-gray-700 shadow-md hover:bg-gray-200 transition-colors duration-200"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-gray-500 hover:text-red-500 transition-colors duration-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className={`bg-white rounded-2xl shadow-lg border border-[#0B4422]/10 p-8 transition-all duration-300 ${activeStep === 4 ? 'opacity-100' : 'opacity-50'}`}>
            <div className="flex items-center mb-6">
              <span className="text-2xl mr-3">🔍</span>
              <h2 className="text-2xl font-bold text-[#0B4422]">SEO Settings</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  SEO Title
                </label>
                <input
                  type="text"
                  value={blogPost.seo_title}
                  onChange={(e) => handleInputChange('seo_title', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-[#0B4422] focus:border-[#0B4422] transition-all duration-200"
                  placeholder="SEO optimized title (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  SEO Description
                </label>
                <textarea
                  value={blogPost.seo_description}
                  onChange={(e) => handleInputChange('seo_description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-[#0B4422] focus:border-[#0B4422] transition-all duration-200 resize-none"
                  placeholder="SEO description for search engines (optional)"
                />
              </div>
            </div>
          </div>

          {/* Publish Settings */}
          <div className={`bg-white rounded-2xl shadow-lg border border-[#0B4422]/10 p-8 transition-all duration-300 ${activeStep === 5 ? 'opacity-100' : 'opacity-50'}`}>
            <div className="flex items-center mb-6">
              <span className="text-2xl mr-3">🚀</span>
              <h2 className="text-2xl font-bold text-[#0B4422]">Publish Settings</h2>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={blogPost.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-[#0B4422] focus:border-[#0B4422] transition-all duration-200"
                >
                  <option value="draft">📝 Save as Draft</option>
                  <option value="published">🚀 Publish Now</option>
                </select>
              </div>

              <div className="flex items-center gap-4 ml-8">
                <button
                  type="button"
                  onClick={() => router.push('/admin/blog-management')}
                  className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-3 bg-[#0B4422] text-white rounded-xl hover:bg-[#166534] disabled:opacity-50 transition-all duration-200 font-semibold flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      <span>Save Blog Post</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Message */}
        {message && (
          <div className={`mt-8 p-6 rounded-xl border ${
            message.includes('Error') 
              ? 'bg-red-50 text-red-700 border-red-200' 
              : 'bg-green-50 text-green-700 border-green-200'
          }`}>
            <div className="flex items-center">
              <span className="text-2xl mr-3">
                {message.includes('Error') ? '❌' : '✅'}
              </span>
              <span className="font-semibold">{message}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 