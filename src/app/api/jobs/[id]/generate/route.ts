import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'
import { config } from '@/lib/config'

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
})

const ASSISTANT_ID = "asst_ycM57UoS5QGUBoSxepUAXvsJ" // Cover Letter Composer ID

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = parseInt(params.id)
    
    // Fetch job details
    const job = await prisma.jobs.findUnique({
      where: { id: jobId },
      include: {
        preferences: true
      }
    })

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Create thread
    const thread = await openai.beta.threads.create()

    // Add message to thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: `Inserat: ${job.description}\nAnmerkungen: ${job.preferences?.notes || ''}`
    })

    // Start assistant run
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
    })

    // Wait for completion
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id)
    let attempts = 0
    const maxAttempts = 30

    while (runStatus.status !== 'completed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id)
      attempts++
    }

    if (attempts >= maxAttempts) {
      throw new Error('Generation timeout')
    }

    // Get response
    const messages = await openai.beta.threads.messages.list(thread.id)
    const content = messages.data[0].content[0]
    
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    // Save the generated letter
    const updatedJob = await prisma.jobs.update({
      where: { id: jobId },
      data: {
        cover_letter: {
          create: {
            content: content.text.value,
          },
        },
      },
    })

    return NextResponse.json({ coverLetter: content.text.value })
  } catch (error) {
    console.error('Cover letter generation failed:', error)
    return NextResponse.json(
      { error: 'Failed to generate cover letter' },
      { status: 500 }
    )
  }
} 