import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { notes } = await request.json()
    const jobId = parseInt(params.id)

    const updatedJob = await prisma.job_preferences.update({
      where: { job_id_user_id: { job_id: jobId, user_id: 1 } },
      data: { notes },
    })

    return NextResponse.json(updatedJob)
  } catch (error) {
    console.error('Error updating notes:', error)
    return NextResponse.json(
      { error: 'Failed to update notes' },
      { status: 500 }
    )
  }
} 