import { readFileSync } from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { lng: string; ns: string } }
) {
  try {
    const { lng, ns } = params;
    
    // Construct the file path
    const filePath = join(process.cwd(), 'public', 'locales', lng, `${ns}.json`);
    
    // Read the file
    const fileContent = readFileSync(filePath, 'utf-8');
    const translations = JSON.parse(fileContent);
    
    // Return the translations with proper headers
    return NextResponse.json(translations, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error loading translation file:', error);
    return NextResponse.json(
      { error: 'Translation file not found' },
      { status: 404 }
    );
  }
} 