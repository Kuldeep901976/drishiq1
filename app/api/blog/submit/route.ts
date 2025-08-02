import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      excerpt,
      content,
      author,
      author_email,
      category,
      tags,
      featured_image
    } = body;

    // Validate required fields
    if (!title || !content || !author || !category) {
      return NextResponse.json(
        { error: 'Title, content, author, and category are required' },
        { status: 400 }
      );
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);

    // Check if slug already exists
    const { data: existingPost } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingPost) {
      // Add timestamp to make slug unique
      const timestamp = Date.now();
      const uniqueSlug = `${slug}-${timestamp}`;
      
      // Create blog post with unique slug
      const { data: post, error } = await supabase
        .from('blog_posts')
        .insert({
          title,
          slug: uniqueSlug,
          excerpt,
          content,
          author,
          author_email,
          category,
          tags: tags || [],
          featured_image,
          status: 'pending',
          read_time: calculateReadTime(content)
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: 'Blog post submitted successfully for review',
        data: {
          id: post.id,
          slug: post.slug,
          status: post.status
        }
      });
    } else {
      // Create blog post with original slug
      const { data: post, error } = await supabase
        .from('blog_posts')
        .insert({
          title,
          slug,
          excerpt,
          content,
          author,
          author_email,
          category,
          tags: tags || [],
          featured_image,
          status: 'pending',
          read_time: calculateReadTime(content)
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: 'Blog post submitted successfully for review',
        data: {
          id: post.id,
          slug: post.slug,
          status: post.status
        }
      });
    }

  } catch (error) {
    console.error('Error submitting blog post:', error);
    return NextResponse.json(
      { error: 'Failed to submit blog post' },
      { status: 500 }
    );
  }
}

function calculateReadTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
} 