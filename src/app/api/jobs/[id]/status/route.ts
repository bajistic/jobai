import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const jobId = parseInt(params.id);
    const { status } = await request.json();

    // Upsert the job preference (create if doesn't exist, update if it does)
    await prisma.job_preferences.upsert({
      where: {
        job_id_user_id: {
          job_id: jobId,
          user_id: userId,
        },
      },
      create: {
        job_id: jobId,
        user_id: userId,
        status,
      },
      update: {
        status,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating job status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 