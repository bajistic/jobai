import { NextRequest, NextResponse } from 'next/server';
import { OpenAIService } from '@/services/openai.service';
import { prisma } from '@/lib/prisma';
import { Job } from '@/lib/types/shared';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const jobId = Number(params.id);
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const job = await prisma.jobs.findUnique({ where: { id: jobId } });
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    const jobPreference = await prisma.job_preferences.findUnique({
      where: { job_id_user_id: { job_id: jobId, user_id: userId } }
    });

    const openAIService = OpenAIService.getInstance();
    const { content, docs_url } = await openAIService.generateCoverLetter(
      userId,
      job as unknown as Job,
      undefined,
      jobPreference?.notes || ''
    );

    await prisma.cover_letters.create({
      data: {
        job_id: jobId,
        user_id: userId,
        content,
        docs_url,
      }
    });

    return NextResponse.json({ success: true, content, docs_url });
  } catch (error) {
    console.error('Failed to generate cover letter:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate cover letter' }, { status: 500 });
  }
}

export async function GET(
  _req: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = context;
  const jobId = Number(params.id);
  try {
    const letter = await prisma.cover_letters.findFirst({
      where: { job_id: jobId },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({
      success: true,
      letter,
    });
  } catch (error) {
    console.error('Failed to fetch cover letter:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cover letter' },
      { status: 500 }
    );
  }
} 