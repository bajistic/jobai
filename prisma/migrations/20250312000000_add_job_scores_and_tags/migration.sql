-- AddJobScoresAndTags
-- This migration adds support for optimized job filtering

-- Add new fields to the jobs table
ALTER TABLE "jobs" ADD COLUMN "scores" JSONB;
ALTER TABLE "jobs" ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "jobs" ADD COLUMN "last_analyzed" TIMESTAMP(3);

-- Add index on scores for faster querying
CREATE INDEX "jobs_scores_idx" ON "jobs" USING GIN ("scores");