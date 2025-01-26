import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  const userId = session.user.id;

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
  return NextResponse.json({ jobs });
} catch (error) {
  console.error("Error in GET /api/jobs/unranked:", error || "Unknown error");
  return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
}
}