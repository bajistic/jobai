import { NextRequest, NextResponse } from 'next/server';
import { ScraperService } from '@/services/scraper.service';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  // Return scraping status
  if (type === 'status') {
    const scraper = ScraperService.getInstance();
    return NextResponse.json(scraper.getStatus());
  }
  
  // Return scraping history
  if (type === 'history') {
    const jobs = await prisma.jobs.findMany({
      orderBy: { id: 'desc' },
      take: 20, // Or whatever limit you want
    });
    return NextResponse.json({ jobs });
  }

  // If no type, just return status by default
  const scraper = ScraperService.getInstance();
  return NextResponse.json(scraper.getStatus());
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const pageNumber = Number(data.pageNumber) || 1;
    const userId = data.userId;

    const scraper = ScraperService.getInstance();
    await scraper.startScraping(pageNumber, userId);

    return NextResponse.json({
      success: true,
      message: `Scraping started at page ${pageNumber}`
    });
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json({ error: 'Failed to start scraper' }, { status: 500 });
  }
} 