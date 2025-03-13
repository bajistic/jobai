import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { OpenAIService } from "@/services/openai.service";
import { Job } from "@/lib/types/shared";

/**
 * GET: /api/jobs/rank?next=true
 *   Returns a single "next" unranked job (example criteria: job_preferences not found or empty).
 *
 * POST: /api/jobs/rank
 *   Ranks the specified job using OpenAI, stores it in job_preferences, and returns the ranking.
 */

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    //const { searchParams } = new URL(request.url);
    //const next = searchParams.get("next");

    // If we want the next unranked job, we can filter for job_preferences
    // that do not exist or have no ranking for this user
      const jobs = await prisma.jobs.findMany({
        where: {
          job_preferences: {
            none: {
              user_id: userId,
              ranking: { not: null },
            },
          },
        },
      });

      if (!jobs) {
        return NextResponse.json({ job: null, message: "No unranked jobs found" });
      }
      console.log("Fetched Jobs", jobs.length);
      return NextResponse.json({ job: jobs[0] });
  } catch (error) {
    console.error("Error in GET /api/jobs/rank:", error || "Unknown error");
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const { jobId } = await request.json();

    // Retrieve the job
    const job = await prisma.jobs.findUnique({
      where: { id: Number(jobId) },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Use the hybrid approach that can use either optimized or traditional ranking
    const openAIService = OpenAIService.getInstance();
    const { ranking, canton } = await openAIService.rankJobHybrid(
      job as unknown as Job,
      userId
    );

    // Save the ranking in job_preferences
    const updated = await prisma.job_preferences.upsert({
      where: {
        job_id_user_id: {
          job_id: job.id,
          user_id: userId,
        },
      },
      create: {
        job_id: job.id,
        user_id: userId,
        ranking,
      },
      update: {
        ranking,
      },
    });

    // Optionally also update the job entry with new canton or metadata
    await prisma.jobs.update({
      where: { id: job.id },
      data: {
        canton: canton || job.canton,
      },
    });

    return NextResponse.json({
      success: true,
      ranking,
      canton,
      jobPreference: updated,
    });
  } catch (error) {
    console.error("Error in POST /api/jobs/rank:", error);
    return NextResponse.json({ error: "Failed to rank job" }, { status: 500 });
  }
} 