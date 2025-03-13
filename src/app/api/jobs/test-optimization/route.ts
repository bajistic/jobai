import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { OpenAIService } from '@/services/openai.service'
import { prisma } from '@/lib/prisma'
import { Job } from '@/lib/types/shared'

/**
 * GET /api/jobs/test-optimization
 * 
 * Test endpoint to compare the old and new job filtering approaches.
 * This is for development and validation purposes only.
 * 
 * Query Parameters:
 * - jobId: Specific job ID to test (optional)
 * - limit: Number of jobs to test (default: 5, only used if jobId not provided)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication (could be restricted to admins in production)
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = session.user.id
    const searchParams = request.nextUrl.searchParams
    
    // Get parameters
    const jobId = searchParams.get('jobId')
    const limit = parseInt(searchParams.get('limit') || '5', 10)
    
    // Initialize OpenAI service
    const openAIService = OpenAIService.getInstance()
    
    // If jobId is provided, test just that job
    if (jobId) {
      const job = await prisma.jobs.findUnique({
        where: { id: parseInt(jobId, 10) }
      })
      
      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      }
      
      // Test both approaches
      console.time('Original method')
      const originalResult = await openAIService.rankJob(job as unknown as Job, userId)
      console.timeEnd('Original method')
      
      console.time('Optimized method')
      // First ensure we have analysis data
      await openAIService.analyzeJob(job as unknown as Job)
      // Then test the hybrid approach
      const hybridResult = await openAIService.rankJobHybrid(job as unknown as Job, userId)
      console.timeEnd('Optimized method')
      
      return NextResponse.json({
        jobId: job.id,
        title: job.title,
        originalMethod: originalResult,
        optimizedMethod: hybridResult,
        match: originalResult.ranking === hybridResult.ranking
      })
    }
    
    // If no specific job, test multiple jobs
    const jobs = await prisma.jobs.findMany({
      take: limit,
      orderBy: { published: 'desc' }
    })
    
    const results = []
    
    for (const job of jobs) {
      // Test both approaches
      console.time(`Job ${job.id} - Original method`)
      const originalResult = await openAIService.rankJob(job as unknown as Job, userId)
      console.timeEnd(`Job ${job.id} - Original method`)
      
      console.time(`Job ${job.id} - Optimized method`)
      // First ensure we have analysis data
      await openAIService.analyzeJob(job as unknown as Job)
      // Then test the hybrid approach
      const hybridResult = await openAIService.rankJobHybrid(job as unknown as Job, userId)
      console.timeEnd(`Job ${job.id} - Optimized method`)
      
      results.push({
        jobId: job.id,
        title: job.title,
        originalMethod: originalResult,
        optimizedMethod: hybridResult,
        match: originalResult.ranking === hybridResult.ranking
      })
    }
    
    // Calculate summary statistics
    const matchCount = results.filter(r => r.match).length
    const matchPercentage = (matchCount / results.length) * 100
    
    return NextResponse.json({
      results,
      summary: {
        total: results.length,
        matches: matchCount,
        matchPercentage: `${matchPercentage.toFixed(2)}%`
      }
    })
  } catch (error) {
    console.error('Error in test-optimization endpoint:', error)
    return NextResponse.json(
      { error: 'Test failed' },
      { status: 500 }
    )
  }
}