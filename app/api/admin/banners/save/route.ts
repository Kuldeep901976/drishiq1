import { existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const { banners } = await request.json();

    if (!banners || !Array.isArray(banners)) {
      return NextResponse.json({ error: 'Invalid banner data' }, { status: 400 });
    }

    // Create assets/banners directory if it doesn't exist
    const bannersDir = join(process.cwd(), 'public', 'assets', 'banners');
    if (!existsSync(bannersDir)) {
      await mkdir(bannersDir, { recursive: true });
    }

    // Prepare banner data for storage
    const bannerData = banners.map((banner: any, index: number) => ({
      id: index + 1,
      position: index + 1,
      title: banner.title,
      text: banner.text,
      image_url: banner.image,
      cta_label: banner.cta.label,
      cta_link: banner.cta.link,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Save to JSON file
    const bannersFile = join(bannersDir, 'banners-data.json');
    await writeFile(bannersFile, JSON.stringify(bannerData, null, 2));

    return NextResponse.json({ 
      success: true, 
      message: 'Banners saved successfully to assets folder',
      data: bannerData,
      filePath: '/assets/banners/banners-data.json'
    });

  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json({ 
      error: 'Failed to save banners' 
    }, { status: 500 });
  }
} 