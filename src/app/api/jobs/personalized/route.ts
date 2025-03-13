import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { OpenAIService, USE_OPTIMIZED_JOB_FILTERING } from '@/services/openai.service'

/**
 * GET /api/jobs/personalized
 * 
 * Returns personalized job recommendations for the current user,
 * using the optimized local filtering based on pre-computed scores.
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - pageSize: Number of jobs per page (default: 20)
 * - force: Set to 'true' to use optimized filtering even if disabled globally
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = session.user.id
    const searchParams = request.nextUrl.searchParams
    
    // Get pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)
    const forceOptimized = searchParams.get('force') === 'true'
    
    // Check if optimized filtering is enabled or forced
    if (!USE_OPTIMIZED_JOB_FILTERING && !forceOptimized) {
      return NextResponse.json(
        { error: 'Optimized job filtering is disabled. Use the regular /api/jobs endpoint.' }, 
        { status: 400 }
      )
    }
    
    // Get personalized jobs using the optimized method
    const openAIService = OpenAIService.getInstance()
    const { jobs, total } = await openAIService.getPersonalizedJobs(userId, page, pageSize)
    
    // Format the response
    return NextResponse.json({
      jobs,
      pagination: {
        page,
        pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  } catch (error) {
    console.error('Error in personalized jobs endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to get personalized jobs' },
      { status: 500 }
    )
  }
}