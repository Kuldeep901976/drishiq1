'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import { useLanguage } from '../../lib/drishiq-i18n';

interface BlogArticle {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  category: string;
  read_time: string;
  published_at: string;
  author: string;
  featured: boolean;
  tags: string[];
}

const categories = ['All', 'Personal Growth', 'Stories', 'Mindfulness', 'Psychology', 'Emotional Intelligence', 'Relationships'];

export default function BlogPage() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const articlesPerPage = 6;

  // Fetch articles from API
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/blog/posts?status=published');
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch articles');
        }
        
        setArticles(result.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch articles');
        console.error('Error fetching articles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);
  const startIndex = (currentPage - 1) * articlesPerPage;
  const endIndex = startIndex + articlesPerPage;
  const currentArticles = filteredArticles.slice(startIndex, endIndex);

  const featuredArticles = articles.filter(article => article.featured);

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex-grow pt-20">
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B4422] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading articles...</p>
            </div>
          </main>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="flex-grow pt-20">
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <p className="text-red-600 mb-4">Error: {error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-[#0B4422] text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Try Again
              </button>
            </div>
          </main>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="flex-grow pt-20">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-[#0B4422] mb-6">
              DrishiQ Blog
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Insights, stories, and practical wisdom to help you see through challenges and discover clarity in your journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/blog/submit" 
                className="bg-[#0B4422] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#1a6b3a] transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                <i className="fas fa-plus mr-2"></i>
                Submit Your Article
              </Link>
              <Link 
                href="/blog/create" 
                className="bg-white text-[#0B4422] border-2 border-[#0B4422] px-8 py-3 rounded-lg font-semibold hover:bg-[#0B4422] hover:text-white transition-colors duration-200"
              >
                <i className="fas fa-edit mr-2"></i>
                Create Article
              </Link>
            </div>
          </div>

          {/* Featured Articles */}
          {featuredArticles.length > 0 && (
            <section className="mb-16">
              <h2 className="text-2xl font-bold text-[#0B4422] mb-8">Featured Articles</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredArticles.map(article => (
                  <article key={article.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-[#0B4422] bg-[#E8F5E8] px-3 py-1 rounded-full">
                          {article.category}
                        </span>
                        <span className="text-sm text-gray-500">{article.read_time}</span>
                      </div>
                      <h3 className="text-xl font-bold text-[#0B4422] mb-3 line-clamp-2">
                        <Link href={`/blog/${article.slug}`} className="hover:text-[#1a6b3a] transition-colors">
                          {article.title}
                        </Link>
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-3">{article.excerpt}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">By {article.author}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(article.published_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Call to Action Section */}
          <section className="mb-12 bg-gradient-to-r from-[#0B4422] to-[#1a6b3a] rounded-lg p-8 text-white">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">Share Your Wisdom</h3>
              <p className="text-lg mb-6 opacity-90">
                Have insights that could help others? Submit your article for review and join our community of writers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/blog/submit" 
                  className="bg-white text-[#0B4422] px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
                >
                  <i className="fas fa-paper-plane mr-2"></i>
                  Submit for Review
                </Link>
                <Link 
                  href="/blog/create" 
                  className="bg-transparent text-white border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-[#0B4422] transition-colors duration-200"
                >
                  <i className="fas fa-edit mr-2"></i>
                  Start Writing
                </Link>
              </div>
            </div>
          </section>

          {/* Search and Filter Section */}
          <section className="mb-12">
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4422] focus:border-transparent"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                      selectedCategory === category
                        ? 'bg-[#0B4422] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* All Articles */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-[#0B4422]">
                All Articles ({filteredArticles.length})
              </h2>
            </div>

            {currentArticles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No articles found matching your criteria.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {currentArticles.map(article => (
                  <article key={article.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-[#0B4422] bg-[#E8F5E8] px-3 py-1 rounded-full">
                          {article.category}
                        </span>
                        <span className="text-sm text-gray-500">{article.read_time}</span>
                      </div>
                      <h3 className="text-lg font-bold text-[#0B4422] mb-3 line-clamp-2">
                        <Link href={`/blog/${article.slug}`} className="hover:text-[#1a6b3a] transition-colors">
                          {article.title}
                        </Link>
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-3">{article.excerpt}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {article.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">By {article.author}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(article.published_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg border ${
                        currentPage === page
                          ? 'bg-[#0B4422] text-white border-[#0B4422]'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        </main>

        {/* Floating Action Button */}
        <div className="fixed bottom-8 right-8 z-50">
          <Link 
            href="/blog/submit"
            className="bg-[#0B4422] text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:bg-[#1a6b3a] transition-all duration-200"
            title="Submit Article"
          >
            <i className="fas fa-plus text-xl"></i>
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
} 