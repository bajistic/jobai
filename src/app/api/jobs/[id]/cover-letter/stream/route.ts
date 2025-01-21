import { NextRequest } from 'next/server';
import { OpenAIService } from '@/services/openai.service';

export async function GET(
  _req: NextRequest,
  context: { params: { id: string } }
) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const openAIService = OpenAIService.getInstance();
        
        await openAIService.generateCoverLetter(
          { id: context.params.id },
          (update) => {
            const data = encoder.encode(`data: ${JSON.stringify(update)}\n\n`);
            controller.enqueue(data);
          }
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