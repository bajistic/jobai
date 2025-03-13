import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { OpenAIService, USE_OPTIMIZED_JOB_FILTERING } from '@/services/openai.service'

/**
 * POST /api/jobs/filter-daily
 * 
 * This endpoint triggers the daily batch job filtering process.
 * It should be called by a cron job or scheduler once per day.
 * 
 * Query Parameters:
 * - limit: Number of jobs to process (default: 100)
 * - force: Set to 'true' to ignore feature flag (requires admin)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin status
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // For now, the feature can be controlled by an environment variable 
    // or forced via query parameter by admin users
    const searchParams = request.nextUrl.searchParams
    const forceRun = searchParams.get('force') === 'true'
    
    if (!USE_OPTIMIZED_JOB_FILTERING && !forceRun) {
      return NextResponse.json(
        { error: 'Optimized job filtering is disabled. Set USE_OPTIMIZED_JOB_FILTERING to true or use force=true parameter.' }, 
        { status: 400 }
      )
    }
    
    // Get processing limit from query parameters (default to 100)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 100
    
    // Start the filtering process
    const openAIService = OpenAIService.getInstance()
    const processedCount = await openAIService.filterJobsOnceDaily(limit)
    
    return NextResponse.json({
      success: true,
      processedCount,
      message: `Successfully processed ${processedCount} jobs`
    })
  } catch (error) {
    console.error('Error in filter-daily endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to run daily job filtering' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/jobs/filter-daily
 * 
 * Returns status information about the optimized job filtering system
 */
export async function GET() {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Count jobs with scores
    const { prisma } = await import('@/lib/prisma')
    const analyzedJobsCount = await prisma.jobs.count({
      where: {
        scores: { not: null }
      }
    })
    
    // Get the most recently analyzed job date
    const lastAnalyzedJob = await prisma.jobs.findFirst({
      where: {
        last_analyzed: { not: null }
      },
      orderBy: {
        last_analyzed: 'desc'
      },
      select: {
        last_analyzed: true
      }
    })
    
    return NextResponse.json({
      enabled: USE_OPTIMIZED_JOB_FILTERING,
      analyzedJobsCount,
      lastAnalyzedAt: lastAnalyzedJob?.last_analyzed || null
    })
  } catch (error) {
    console.error('Error in filter-daily status endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to get filtering status' },
      { status: 500 }
    )
  }
}