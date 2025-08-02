'use client';

import { useLanguage } from '@/lib/drishiq-i18n';
import { speak } from '@/lib/speechUtils';
import { notFound } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

// Audio embed HTML snippet (embedded directly)
const audioEmbedHtml = `<!-- DrishiQ Blog Audio Player Embed -->
<div style="background-color:#f4f4f4; padding: 20px; border-radius: 12px; max-width: 800px; margin: 2em auto;">
  <h3 style="font-family: Georgia, serif; color: #0B4422; margin-bottom: 10px;">🎧 Prefer to listen?</h3>
  <p style="font-family: Georgia, serif; font-size: 16px; color: #333;">Here's the audio version of this article — narrated in my own voice.</p>
  <audio controls style="width: 100%; margin-top: 10px; border-radius: 8px;">
    <source src="YOUR_AUDIO_FILE_URL_HERE.mp3" type="audio/mpeg">
    Your browser does not support the audio element.
  </audio>
</div>`;

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
  content: string;
}

export default function BlogArticlePage({ params }: { params: { slug: string } }) {
  const { locale } = useLanguage();
  const contentRef = useRef<HTMLDivElement>(null);
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/blog/posts/${params.slug}`);
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Article not found');
        }
        
        setArticle(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch article');
        console.error('Error fetching article:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [params.slug]);

  const handleListen = () => {
    if (article && contentRef.current) {
      speak(article.title + '. ' + article.excerpt, locale);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B4422] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return notFound();
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      {/* Audio Embed */}
      <div dangerouslySetInnerHTML={{ __html: audioEmbedHtml.replace('YOUR_AUDIO_FILE_URL_HERE.mp3', `/audio/${article.slug}.mp3`) }} />
      <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
      <div className="text-gray-500 mb-2">By {article.author} • {new Date(article.published_at).toLocaleDateString()} • {article.read_time}</div>
      <p className="text-lg mb-8">{article.excerpt}</p>
      <button
        className="mb-6 px-4 py-2 bg-[#0B4422] text-white rounded hover:bg-green-700"
        onClick={handleListen}
      >
        Listen (Text-to-Speech)
      </button>
      <div ref={contentRef} className="prose prose-lg">
        <div dangerouslySetInnerHTML={{ __html: article.content }} />
      </div>
    </div>
  );
} 