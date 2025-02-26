"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useJobs } from "@/contexts/JobContext";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
  Display all unranked jobs for the user
  By clicking the button, the user can rank the first unranked job using the JobContext's rankJob function
*/
export default function RankJobsPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const { unrankedJobs, fetchUnrankedJobs, rankJob } = useJobs();

  useEffect(() => {
    fetchUnrankedJobs();
  }, [fetchUnrankedJobs]);

  const handleRankFirstJob = async () => {
    if (!unrankedJobs || unrankedJobs.length === 0) {
      setMessage("No jobs to rank.");
      return;
    }
    setLoading(true);
    try {
      await rankJob(unrankedJobs[0].id, "unranked");
    } catch (error) {
      console.error("Failed to rank the job:", error);
      setMessage("Error ranking the job.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Rank Jobs</h1>

        <div className="flex flex-col gap-4">
          {loading && <p>Loading...</p>}
          {message && <p className="text-sm text-red-500 my-2">{message}</p>}
          
          <Button onClick={handleRankFirstJob} disabled={loading}>
            Rank First Job
          </Button>
        </div>

        {unrankedJobs && unrankedJobs.length > 0 ? (
          unrankedJobs.map((job) => (
            <div key={job.id} className="mb-4 border p-4 rounded">
              <h2 className="text-lg font-semibold">Job: {job.title}</h2>
              <p className="text-sm">Company: {job.company}</p>
              <p className="text-sm">Location: {job.location}</p>
            </div>
          ))
        ) : (
          <p>No jobs to rank at the moment.</p>
        )}
      </div>
    </ScrollArea>
  );
} 