import { NextResponse } from 'next/server';
import { ScraperService } from '@/services/scraper.service';

export async function POST() {
  try {
    const scraper = ScraperService.getInstance();
    await scraper.startScraping(1);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Scraping completed successfully' 
    });
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      { error: 'Failed to scrape jobs' },
      { status: 500 }
    );
  }
} 