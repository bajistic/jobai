import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { job_status } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }     const userId = session.user.id;


    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const onlyStarred = searchParams.get('onlyStarred') === 'true'
    const showHidden = searchParams.get('showHidden') === 'true'
    const status = searchParams.get('status') as job_status | undefined
    const location = searchParams.get('location')
    const searchQuery = searchParams.get('searchQuery')
    const ranking = searchParams.get('ranking')

    console.log('API Received params:', { onlyStarred, showHidden, status, page, pageSize, location, searchQuery, ranking })

    // Build job_preferences conditions
    const jobPrefsConditions = {
      user_id: userId,
      ...(status && { status: status as job_status }),
      ...(onlyStarred && { is_starred: true }),
      ...(showHidden && { is_hidden: true }),
      ...(ranking && ranking !== 'all' && { ranking: ranking })
    };

    const where = {
      // Only add job_preferences if we have any conditions beyond user_id
      ...(Object.keys(jobPrefsConditions).length > 1 && {
        job_preferences: {
          some: jobPrefsConditions
        }
      }),
      ...(location && {
        location: {
          contains: location,
          mode: 'insensitive' as const
        }
      }),
      ...(searchQuery && {
        OR: [
          { title: { contains: searchQuery, mode: 'insensitive' as const } },
          { description: { contains: searchQuery, mode: 'insensitive' as const } }
        ]
      }),
    }

    console.log('Prisma where clause:', JSON.stringify(where, null, 2))

    const [jobs, total] = await Promise.all([
      prisma.jobs.findMany({
        where,
        orderBy: { published: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { 
          cover_letters: true,
          job_preferences: {
            where: {
              user_id: userId
            }
          }
        }
      }),
      prisma.jobs.count({ where })
    ])


    return NextResponse.json({
      jobs: jobs.map(job => ({
        ...job,
        status: job.job_preferences[0]?.status as job_status || null,
        isStarred: job.job_preferences?.some(p => p.is_starred) || false,
        isHidden: job.job_preferences?.some(p => p.is_hidden) || false
      })),
      total,
      page,
      pageSize
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const job = await prisma.jobs.create({
      data: {
        title: data.title,
        company: data.company,
        location: data.location,
        status: data.status,
        url: data.url,
      },
    })
    return NextResponse.json(job)
  } catch (error) {
    console.error('❌ Database Error:', error)
    return NextResponse.json(
      { error: 'Failed to create job', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 