import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CoverLetter, Job, JobPreference } from '@/lib/types/shared'

// Define the status type explicitly
type JobStatus = 'new' | 'applied' | 'rejected' | 'interview'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const onlyStarred = searchParams.get('onlyStarred') === 'true'
    const showHidden = searchParams.get('showHidden') === 'true'
    const status = searchParams.get('status') as JobStatus | undefined
    const location = searchParams.get('location')
    const searchQuery = searchParams.get('searchQuery')
    const ranking = searchParams.get('ranking')

    console.log('API Received params:', { onlyStarred, showHidden, status, page, pageSize, location, searchQuery, ranking })

    const where = {
      ...(onlyStarred && {
        preferences: {
          some: {
            is_starred: true,
            user_id: 1
          }
        }
      }),
      ...(showHidden && {
        preferences: {
          some: {
            is_hidden: true,
            user_id: 1
          }
        }
      }),
      ...(status && { 
        status: status as JobStatus
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
      ...(ranking && ranking !== 'all' && {
        ranking: ranking
      })
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
              user_id: 1
            }
          }
        }
      }),
      prisma.jobs.count({ where })
    ])

    const serializeJob = (job: Job) => ({
      ...job,
      id: Number(job.id),
      preferences: job.preferences?.map((p: JobPreference) => ({
        ...p,
        id: Number(p.id),
        job_id: Number(p.job_id),
        user_id: Number(p.user_id)
      })),
      isStarred: job.preferences?.some((p: JobPreference) => p.is_starred) || false,
      isHidden: job.preferences?.some((p: JobPreference) => p.is_hidden) || false,
      cover_letters: job.cover_letter?.map((cl: CoverLetter) => ({
        ...cl,
        id: Number(cl.id),
        jobId: cl.jobId ? Number(cl.jobId) : null
      }))
    })

    return NextResponse.json({
      jobs: jobs.map(serializeJob),
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