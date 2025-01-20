import { NextResponse } from 'next/server';
import { ScraperService } from '@/services/scraper.service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session.user.email !== "baji@gmail.com") {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get scraper status
    const scraper = ScraperService.getInstance();
    const status = scraper.getStatus();

    return NextResponse.json({
      isRunning: status.isRunning,
      totalJobs: status.totalJobs,
      currentPage: status.currentPage,
      lastRun: status.lastRun
    });
  } catch (error) {
    console.error('Error fetching scraper status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scraper status' },
      { status: 500 }
    );
  }
} 