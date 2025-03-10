import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()
    
    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // In a real application, you would check if the user has admin rights
    // For now, we'll simply allow any authenticated user to see the beta requests
    
    // Get all beta requests from the database
    const betaRequests = await prisma.betaRequest.findMany({
      orderBy: { requestDate: 'desc' }
    })
    
    return NextResponse.json(betaRequests)
  } catch (error) {
    console.error('Error fetching beta requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch beta requests' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()
    
    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get request data
    const { id, status } = await request.json()
    
    if (!id || !status || !['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }
    
    // Update the beta request status
    const updatedRequest = await prisma.betaRequest.update({
      where: { id },
      data: { status, updatedAt: new Date() }
    })
    
    // If the status was changed to approved, you might want to:
    // 1. Create a user account for this person
    // 2. Send them an email with login instructions
    
    return NextResponse.json(updatedRequest)
  } catch (error) {
    console.error('Error updating beta request:', error)
    return NextResponse.json(
      { error: 'Failed to update beta request' },
      { status: 500 }
    )
  }
}