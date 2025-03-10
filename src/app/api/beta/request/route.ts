import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { name, email } = await request.json()
    
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Check if this email has already requested beta access
    const existingRequest = await prisma.betaRequest.findFirst({
      where: { email }
    })
    
    if (existingRequest) {
      // Update the existing request
      await prisma.betaRequest.update({
        where: { id: existingRequest.id },
        data: {
          name, // Update name in case it changed
          requestDate: new Date(), // Update the request date
          updatedAt: new Date()
        }
      })
      console.log('Updated existing beta request for:', email)
    } else {
      // Create a new beta request
      await prisma.betaRequest.create({
        data: {
          name,
          email,
          status: 'pending'
        }
      })
      console.log('New beta request created for:', email)
    }
    
    // Here you could also send an email notification to admins or users
    
    return NextResponse.json(
      { success: true, message: 'Beta request received' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error processing beta request:', error)
    return NextResponse.json(
      { error: 'Failed to process beta request' },
      { status: 500 }
    )
  }
}