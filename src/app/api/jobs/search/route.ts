import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json({ jobs: [] })
    }

    const jobs = await prisma.jobs.findMany({
      where: {
        OR: [
          { id: { equals: parseInt(query) || 0 } },
          { title: { contains: query, mode: 'insensitive' } },
          { company: { contains: query, mode: 'insensitive' } },
          { location: { contains: query, mode: 'insensitive' } },
          { canton: { contains: query, mode: 'insensitive' } },
          { categories: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        job_preferences: {
          where: {
            user_id: session.user.id
          }
        }
      },
      orderBy: {
        published: 'desc'
      }
    })

    return NextResponse.json({ jobs })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Failed to search jobs' },
      { status: 500 }
    )
  }
} 