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
    const rankerAssistant = await openAIService.createJobRankerAssistant(user.id)
    const vectorStore = await openAIService.createUserVectorStore(user.id)
    const composerAssistant = await openAIService.createComposerAssistant(user.id, vectorStore.id)

    // Record these in Prisma
    await prisma.userAssistant.create({
      data: {
        userId: user.id,
        assistantName: rankerAssistant.name,
        assistantId: rankerAssistant.id,
        systemPrompt: rankerAssistant.instructions,
      },
    })
    await prisma.userAssistant.create({
      data: {
        userId: user.id,
        assistantName: composerAssistant.name,
        assistantId: composerAssistant.id,
        systemPrompt: composerAssistant.instructions,
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