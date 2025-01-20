import { NextRequest } from 'next/server';

export async function GET(
  _req: NextRequest,
  context: { params: { id: string } }
) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const steps = [
          { progress: 20, status: 'Creating thread...' },
          { progress: 40, status: 'Adding message to thread...' },
          { progress: 60, status: 'Starting assistant run...' },
          { progress: 80, status: 'Generating content...' },
          { progress: 90, status: 'Creating Google Doc...' },
          { progress: 100, status: 'Completed!' },
        ];

        for (const step of steps) {
          const data = encoder.encode(`data: ${JSON.stringify(step)}\n\n`);
          controller.enqueue(data);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
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