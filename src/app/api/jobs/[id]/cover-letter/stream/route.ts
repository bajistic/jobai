import { NextRequest } from 'next/server';
import { OpenAIService } from '@/services/openai.service';
import { prisma } from '@/lib/prisma';
import { Job } from '@/lib/types/shared';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  console.log(`[StreamAPI] Processing cover letter stream request for job ID in params`);
  
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        console.log(`[StreamAPI] Initializing OpenAI service`);
        const openAIService = OpenAIService.getInstance();
        const jobId = Number(params.id);
        console.log(`[StreamAPI] Parsed job ID: ${jobId}`);
        
        console.log(`[StreamAPI] Getting auth session`);
        const session = await auth();
        const userId = session?.user?.id;
        console.log(`[StreamAPI] User ID from session: ${userId || 'none'}`);

        if (!userId) {
          console.error(`[StreamAPI] No user ID in session`);
          // Send an error event through the stream
          const errorData = encoder.encode(`data: ${JSON.stringify({ error: "Unauthorized", status: 401 })}\n\n`);
          controller.enqueue(errorData);
          controller.close();
          return;
        }

        console.log(`[StreamAPI] Fetching job preferences for job: ${jobId}, user: ${userId}`);
        const jobPreference = await prisma.job_preferences.findUnique({
          where: {
            job_id_user_id: { job_id: jobId, user_id: userId }
          }
        });
        console.log(`[StreamAPI] Job preference found: ${jobPreference ? 'yes' : 'no'}`);
        const notes = jobPreference?.notes || '';

        console.log(`[StreamAPI] Fetching job details for ID: ${jobId}`);
        const job = await prisma.jobs.findUnique({ where: { id: jobId } });
        if (!job) {
          console.error(`[StreamAPI] Job not found with ID: ${jobId}`);
          const errorData = encoder.encode(`data: ${JSON.stringify({ error: "Job not found", status: 404 })}\n\n`);
          controller.enqueue(errorData);
          controller.close();
          return;
        }
        console.log(`[StreamAPI] Found job: ${job.title}`);

        console.log(`[StreamAPI] Starting cover letter generation with streaming updates`);
        await openAIService.generateCoverLetter(
          userId,
          { ...job, id: jobId } as Job,
          (update) => {
            console.log(`[StreamAPI] Progress update: ${update.progress}%, status: ${update.status}`);
            const data = encoder.encode(`data: ${JSON.stringify(update)}\n\n`);
            controller.enqueue(data);
          },
          notes
        );
        console.log(`[StreamAPI] Cover letter generation completed`);
      } catch (error) {
        console.error(`[StreamAPI] Error during streaming:`, error);
        if (error instanceof Error) {
          console.error(`[StreamAPI] Error details: ${error.message}`);
          console.error(`[StreamAPI] Error stack: ${error.stack}`);
          
          // Send error through the stream
          const errorData = encoder.encode(`data: ${JSON.stringify({ 
            error: "Failed to generate cover letter", 
            details: error.message,
            status: 500 
          })}\n\n`);
          controller.enqueue(errorData);
        }
        controller.error(error);
      } finally {
        console.log(`[StreamAPI] Closing stream`);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
} 