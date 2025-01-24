import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.group || session.user.group !== "admin") {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const recentJobs = await prisma.jobs.findMany({
      orderBy: {
        published: 'desc'
      },
      take: 50,
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        published: true,
        status: true
      }
    });

    return NextResponse.json({
      jobs: recentJobs.map(job => ({
        ...job,
        id: Number(job.id)
      }))
    });
  } catch (error) {
    console.error('Error fetching scraping history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scraping history' },
      { status: 500 }
    );
  }
} 