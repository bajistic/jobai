import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    const jobId = parseInt(params.id)
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

    return NextResponse.json(updatedPreference)
  } catch (error) {
    console.error('Error updating star status:', error)
    return NextResponse.json(
      { error: 'Failed to update star status' },
      { status: 500 }
    )
  }
} 