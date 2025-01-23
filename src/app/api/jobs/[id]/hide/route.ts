import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = parseInt(await params.id)
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id
    const { isHidden } = await request.json()

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
        is_hidden: isHidden,
      },
      update: {
        is_hidden: isHidden,
      },
    })

    // Convert BigInt to Number before serializing
    const serializedPreference = {
      ...updatedPreference,
      job_id: Number(updatedPreference.job_id)
    }

    return NextResponse.json(serializedPreference)
  } catch (error) {
    console.error('Error updating hidden status:', error)
    return NextResponse.json(
      { error: 'Failed to update hidden status' },
      { status: 500 }
    )
  }
} 