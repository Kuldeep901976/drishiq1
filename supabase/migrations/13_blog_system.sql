-- Create blog_posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT NOT NULL CHECK (char_length(excerpt) <= 200),
    category TEXT NOT NULL,
    topics TEXT[] DEFAULT '{}',
    read_time TEXT NOT NULL,
    author TEXT NOT NULL,
    publish_date DATE NOT NULL,
    featured_image TEXT,
    video_url TEXT,
    status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
    seo_title TEXT,
    seo_description TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create storage buckets for blog media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('blog-videos', 'blog-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Public Access to Blog Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-images');

CREATE POLICY "Admin Upload Blog Images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'blog-images' AND auth.role() = 'authenticated');

CREATE POLICY "Public Access to Blog Videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-videos');

CREATE POLICY "Admin Upload Blog Videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'blog-videos' AND auth.role() = 'authenticated');

-- Set up RLS policies for blog_posts
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Access to Published Blog Posts"
ON public.blog_posts FOR SELECT
USING (status = 'published');

CREATE POLICY "Admin Full Access to Blog Posts"
ON public.blog_posts FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 