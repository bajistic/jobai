import { NextRequest, NextResponse } from 'next/server';
import { ScraperService } from '@/services/scraper.service';

export async function POST(request: NextRequest) {
  const scraper = ScraperService.getInstance();
  scraper.stopScraping();
  return NextResponse.json({ success: true });
}