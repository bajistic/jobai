import { NextRequest, NextResponse } from 'next/server';
import { ScraperService } from '@/services/scraper.service';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const pageNumber = Number(data.pageNumber) || 1; // Default to 1 if not provided
    
    const scraper = ScraperService.getInstance();
    await scraper.startScraping(pageNumber);
    
    return NextResponse.json({ 
      success: true, 
      message: `Scraping completed successfully for page ${pageNumber}` 
    });
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      { error: 'Failed to scrape jobs' },
      { status: 500 }
    );
  }
} 