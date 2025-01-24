import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OpenAIService } from '@/services/openai.service'

export async function GET(request: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        documents: true,
        assistants: {
          where: {
            assistantName: {
              in: [`JobRanker_${userId}`, `Composer_${userId}`]
            }
          }
        },
      },
    })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      documents: user.documents,
      systemPrompt: user.assistants[0].systemPrompt,
      assistants: user.assistants,
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id;
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    const userJobRanker = await prisma.userAssistant.findFirst({ where: { userId, assistantName: `JobRanker_${userId}` } })
    const userComposer = await prisma.userAssistant.findFirst({ where: { userId, assistantName: `Composer_${userId}` } })
    const data = await request.json()
    
    console.log('Received data for update:', data);

    // First update the user's name and image
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        image: data.image,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        assistants: true,
      }
    });

    // Then update assistants if prompts changed
    if (data.jobRankerPrompt) {
      const openAIService = OpenAIService.getInstance();
      await openAIService.updateJobRankingAssistant(userId, userJobRanker?.assistantId ?? "", data.jobRankerPrompt);
    }

    if (data.composerPrompt) {
      const openAIService = OpenAIService.getInstance();
      await openAIService.updateComposerAssistant(userId, userComposer?.assistantId ?? "", data.composerPrompt);
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id;
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Delete all files associated with the user
    await prisma.userDocument.deleteMany({
      where: { userId: userId }
    });

    // Delete all vector stores associated with the user
    await prisma.userVectorStore.deleteMany({
      where: { userId: userId }
    });

    // Delete all assistants associated with the user
    const userAssistants = await prisma.userAssistant.findMany({
      where: { userId: userId }
    });

    // Delete the assistants from OpenAI
    const openAIService = OpenAIService.getInstance();
    for (const assistant of userAssistants) {
      if (assistant.assistantId) {
        await openAIService.deleteAssistant(assistant.assistantId);
      }
    }

    // Delete the assistants from the database
    await prisma.userAssistant.deleteMany({
      where: { userId: userId }
    });

    // Finally delete the user
    await prisma.user.delete({
      where: { id: userId }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Profile deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 });
  }
} 