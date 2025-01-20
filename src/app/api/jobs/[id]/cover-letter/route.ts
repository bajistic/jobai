import { NextRequest, NextResponse } from 'next/server';
import { OpenAIService } from '@/services/openai.service';
import { prisma } from '@/lib/prisma';
import { Job } from '@/lib/types/shared';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = Number(params.id);
    const job = await prisma.jobs.findUnique({
      where: { id: jobId },
      include: { job_preferences: true, cover_letters: true }
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }
    
    // Convert bigint to number
    const jobData = {
      ...job,
      id: Number(job.id),
      preferences: job.job_preferences.map(p => ({
        ...p,
        job_id: Number(p.job_id)
      }))
    };

    const openAIService = OpenAIService.getInstance();
    const { content, docs_url } = await openAIService.generateCoverLetter(jobData as Job);

    // Save to database
    await prisma.cover_letters.create({
      data: {
        job_id: job.id,
        content,
        docs_url,
      }
    });

    return NextResponse.json({ 
      success: true, 
      content,
      docs_url
    });
  } catch (error) {
    console.error('Failed to generate cover letter:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate cover letter' },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
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