"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Job } from "@/lib/types/shared";
import { useJobs } from "@/contexts/JobContext";

/**
 * Displays a single job to rank and fetches the next job when the user clicks a button
 */
export default function RankJobsPage() {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const { fetchUnrankedJob, rankJob } = useJobs();

  async function fetchNextUnrankedJob() {
    try {
      setLoading(true);
      setMessage("");

      // Use JobContext's fetchJobs with ranking="unranked"
      await fetchJobs({ ranking: "unranked", pageSize: 1 });
      const response = await fetch("/api/jobs/rank");
      if (!response.ok) {
        throw new Error("Failed to fetch the next unranked job.");
      }

      const data = await response.json();
      if (!data.job) {
        setJob(null);
        setMessage("No more unranked jobs!");
      } else {
        setJob(data.job);
      }
    } catch (error: any) {
      console.error("Error:", error);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }


  async function handleRankJob() {
    if (!job) return;

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch("/api/jobs/rank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to rank the job.");
      }

      const data = await response.json();
      setMessage(
        `Job ranked as: ${data.ranking} for job "${job.title}" (${job.company})`
      );

      // Fetch the next job immediately
    } catch (error: any) {
      console.error("Error:", error);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Fetch the first job on page load
    fetchJobs({ ranking: "unranked", pageSize: 1 });
  }, [fetchJobs]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Rank Jobs</h1>
      <div className="flex flex-col gap-4">
        {loading && <p>Loading...</p>}
        {message && <p className="text-sm text-red-500 my-2">{message}</p>}
          <Button onClick={handleRankJob} disabled={loading}>
            Rank Jobs
          </Button>
      </div>
      {job ? (
        <div className="mb-4 border p-4 rounded">
          <h2 className="text-lg font-semibold">Job: {job.title}</h2>
          <p className="text-sm">Company: {job.company}</p>
          <p className="text-sm">Location: {job.location}</p>
        </div>
      ) : (
        <p>No job to rank at the moment.</p>
      )}
    </div>
  );
} 