import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OpenAIService } from '@/services/openai.service'

export async function GET(request: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id;
    console.log('Auth userId:', userId)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        documents: true,
        assistants: true,
      },
    })
    
    console.log('Fetched user data:', JSON.stringify(user, null, 2))
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      documents: user.documents,
      jobFilterPrompt: user.jobFilterPrompt,
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

    const data = await request.json()
    
    // Update job ranking assistant if prompt changed
    if (data.jobFilterPrompt) {
      const openAIService = OpenAIService.getInstance();
      await openAIService.updateJobRankingAssistant(userId, data.jobFilterPrompt);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        image: data.image,
        jobFilterPrompt: data.jobFilterPrompt,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        jobFilterPrompt: true,
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
} 