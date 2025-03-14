import { NextRequest, NextResponse } from 'next/server';
import { OpenAIService } from '@/services/openai.service';
import { prisma } from '@/lib/prisma';
import { Job } from '@/lib/types/shared';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const jobId = Number(params.id);
  console.log(`[CoverLetterAPI] Processing cover letter request for job ID: ${jobId}`);
  
  const session = await auth();
  const userId = session?.user?.id;
  console.log(`[CoverLetterAPI] User ID from session: ${userId || 'none'}`);

  if (!userId) {
    console.error(`[CoverLetterAPI] Unauthorized request - no user ID in session`);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log(`[CoverLetterAPI] Fetching job with ID: ${jobId}`);
    const job = await prisma.jobs.findUnique({ where: { id: jobId } });
    
    if (!job) {
      console.error(`[CoverLetterAPI] Job not found with ID: ${jobId}`);
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }
    console.log(`[CoverLetterAPI] Found job: ${job.title}`);

    console.log(`[CoverLetterAPI] Fetching job preferences for job: ${jobId}, user: ${userId}`);
    const jobPreference = await prisma.job_preferences.findUnique({
      where: { job_id_user_id: { job_id: jobId, user_id: userId } }
    });
    console.log(`[CoverLetterAPI] Job preference found: ${jobPreference ? 'yes' : 'no'}`);

    console.log(`[CoverLetterAPI] Initializing OpenAI service`);
    const openAIService = OpenAIService.getInstance();
    console.log(`[CoverLetterAPI] Starting cover letter generation`);
    
    const { content, docs_url } = await openAIService.generateCoverLetter(
      userId,
      job as unknown as Job,
      undefined,
      jobPreference?.notes || ''
    );
    console.log(`[CoverLetterAPI] Generation successful, content length: ${content.length}`);
    console.log(`[CoverLetterAPI] Google Docs URL: ${docs_url}`);

    console.log(`[CoverLetterAPI] Saving cover letter to database`);
    await prisma.cover_letters.create({
      data: {
        job_id: jobId,
        user_id: userId,
        content,
        docs_url,
      }
    });
    console.log(`[CoverLetterAPI] Cover letter saved successfully`);

    return NextResponse.json({ success: true, content, docs_url });
  } catch (error) {
    console.error('[CoverLetterAPI] Failed to generate cover letter:', error);
    if (error instanceof Error) {
      console.error(`[CoverLetterAPI] Error details: ${error.message}`);
      console.error(`[CoverLetterAPI] Error stack: ${error.stack}`);
    }
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to generate cover letter',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
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