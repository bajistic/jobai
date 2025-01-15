import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const job = await prisma.job.findUnique({
      where: { id: parseInt(params.id) }
    })
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // TODO: Add your cover letter generation logic here
    const content = `Generated cover letter for ${job.title} at ${job.company}`

    const coverLetter = await prisma.coverLetter.create({
      data: {
        jobId: job.id,
        content,
      }
    })

    return NextResponse.json(coverLetter)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate cover letter' },
      { status: 500 }
    )
  }
} 