import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = parseInt(await params.id)
    const userId = 1 // TODO: Get from auth session
    const { isStarred } = await request.json()

    const updatedPreference = await prisma.job_preferences.upsert({
      where: {
        job_id_user_id: {
          job_id: jobId,
          user_id: userId,
        },
      },
      create: {
        job_id: jobId,
        user_id: userId,
        is_starred: isStarred,
      },
      update: {
        is_starred: isStarred,
      },
    })

    // Convert BigInt to Number before serializing
    const serializedPreference = {
      ...updatedPreference,
      job_id: Number(updatedPreference.job_id)
    }

    return NextResponse.json(serializedPreference)
  } catch (error) {
    console.error('Error updating star status:', error)
    return NextResponse.json(
      { error: 'Failed to update star status' },
      { status: 500 }
    )
  }
} 