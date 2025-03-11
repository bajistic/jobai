import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const jobId = parseInt(params.id)
    const session = await auth()
    const userId = session?.user?.id

    const jobPreference = await prisma.job_preferences.findUnique({
      where: {
        job_id_user_id: { job_id: jobId, user_id: userId }
      }
    })

    return NextResponse.json(jobPreference || { notes: '' })
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { notes } = await request.json()
    const jobId = parseInt(params.id)
    const session = await auth()
    const userId = session?.user?.id;

    const updatedJob = await prisma.job_preferences.upsert({
      where: { job_id_user_id: { job_id: jobId, user_id: userId } },
      update: { notes },
      create: { job_id: jobId, user_id: userId, notes },
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