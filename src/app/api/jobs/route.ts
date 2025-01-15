import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Breakpoint 1: Check if route is hit
    debugger;
    console.log('🔍 Testing database connection...')
    
    // Breakpoint 2: Before database query
    debugger;
    const count = await prisma.jobs.count()
    console.log('✅ Database connected! Total jobs:', count)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    
    // Breakpoint 3: Before main query
    debugger;
    const [jobs, total] = await Promise.all([
      prisma.jobs.findMany({
        orderBy: { published: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { cover_letter: true }
      }),
      prisma.jobs.count()
    ])

    // Breakpoint 4: Check query results
    debugger;
    console.log('✅ Found jobs:', { total, jobCount: jobs.length })
    
    return NextResponse.json({
      data: jobs,
      total,
      page,
      pageSize
    })
  } catch (error) {
    // Breakpoint 5: Check errors
    debugger;
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