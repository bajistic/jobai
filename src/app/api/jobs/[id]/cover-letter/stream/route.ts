import { NextRequest } from 'next/server';
import { OpenAIService } from '@/services/openai.service';
import { prisma } from '@/lib/prisma';
import { Job } from '@/lib/types/shared';
import { auth } from '@/lib/auth';
export async function GET(
  _req: NextRequest,
  context: { params: { id: string } }
) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const openAIService = OpenAIService.getInstance();
        const jobId = parseInt(context.params.id)
        const session = await auth()
        const userId = session?.user?.id
        const jobPreference = await prisma.job_preferences.findUnique({
          where: {
            job_id_user_id: { job_id: jobId, user_id: userId }
          }
        });
        const notes = jobPreference?.notes || ''

        await openAIService.generateCoverLetter(
          { id: context.params.id },
          (update) => {
            const data = encoder.encode(`data: ${JSON.stringify(update)}\n\n`);
            controller.enqueue(data);
          },
          notes
        );
      } catch (error) {
        controller.error(error);
      } finally {
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