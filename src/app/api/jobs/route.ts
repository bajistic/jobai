import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing database connection...')
    
    // Test query
    const count = await prisma.jobs.count()
    console.log('✅ Database connected! Total jobs:', count)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    
    console.log('📊 Query params:', { page, pageSize })

    const [jobs, total] = await Promise.all([
      prisma.jobs.findMany({
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { cover_letter: true }
      }),
      prisma.jobs.count()
    ])

    console.log('✅ Found jobs:', { total, jobCount: jobs.length })
    
    return NextResponse.json({
      data: jobs,
      total,
      page,
      pageSize
    })
  } catch (error) {
    console.error('❌ Database Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch jobs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const job = await prisma.job.create({
      data: {
        title: data.title,
        company: data.company,
        location: data.location,
        status: data.status,
        link: data.link,
      },
    })
    return NextResponse.json(job)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    )
  }
} 