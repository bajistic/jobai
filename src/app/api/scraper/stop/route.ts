import { NextResponse } from 'next/server';
import { ScraperService } from '@/services/scraper.service';

export async function POST(request: Request) {
  try {
    // Check if this is a force reset request
    let forceReset = false;
    try {
      const data = await request.json();
      forceReset = data.force === true;
    } catch (e) {
      // No request body or invalid JSON, continue with normal stop
    }
    
    const scraper = ScraperService.getInstance();
    
    if (forceReset) {
      console.log('Force resetting scraper status');
      // Reset the scraper's internal status
      scraper.setStatus({
        isRunning: false,
        currentPage: 1,
        lastRun: new Date().toISOString()
      });
      const status = scraper.getStatus();
      
      return NextResponse.json({ 
        success: true, 
        message: 'Scraper status force reset', 
        status 
      });
    } else {
      // Normal stop operation
      const result = await scraper.stopScraping();
      console.log('Stop scraper API called, result:', result);
      return NextResponse.json({ 
        success: true, 
        message: 'Scraper stopping...' 
      });
    }
  } catch (error) {
    console.error('Error stopping scraper from API:', error);
    return NextResponse.json({ error: 'Failed to stop scraper' }, { status: 500 });
  }
}