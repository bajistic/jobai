import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { OpenAIService } from '@/services/openai.service'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email,
        password: hashedPassword,
        updatedAt: new Date(),
      }
    })

    // Create the assistants & vector store immediately after signing up
    const openAIService = OpenAIService.getInstance()
    
    // Create vector store first
    const vectorStore = await openAIService.createUserVectorStore(user.id)
    
    // Now create assistants - the ranker assistant now handles its own DB creation
    await openAIService.createJobRankingAssistant(user.id)
    const composerAssistant = await openAIService.createComposerAssistant(user.id, vectorStore.id)

    // Record composer assistant in Prisma
    await prisma.userAssistant.create({
      data: {
        userId: user.id,
        assistantName: composerAssistant.name,
        assistantId: composerAssistant.id,
        systemPrompt: composerAssistant.instructions || '',
      },
    })
    await prisma.userVectorStore.create({
      data: {
        userId: user.id,
        vectorStoreId: vectorStore.id,
        fileIds: [],
      },
    })

    return NextResponse.json({ message: 'User created successfully' }, { status: 201 })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
} 