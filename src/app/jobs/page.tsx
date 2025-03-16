'use client'

import dynamic from 'next/dynamic'
import { useJobs } from '@/contexts/JobContext'
import { useEffect } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'

const JobList = dynamic(() => import('@/components/JobList'), { ssr: false })
const JobPreview = dynamic(() => import('@/components/JobPreview'), { ssr: false })

export default function JobsPage() {
  const { jobs, loading, totalJobs, selectedJobId, setSelectedJobId, fetchJobs } = useJobs()
  const isMobile = useIsMobile()

  // Initialize with empty selection on first render only
  useEffect(() => {
    // Only reset on initial page load, not during updates
    if (isMobile) {
      setSelectedJobId(null);
    }
  }, [isMobile, setSelectedJobId]);

  // Fetch jobs when page changes
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return (
    <div className="flex flex-1 h-full w-full overflow-hidden">
      {/* JobList Container */}
      <div className={`${isMobile && selectedJobId ? 'hidden' : 'block'} ${isMobile ? 'w-full' : 'w-1/3 border-r'} h-full`}>
        <JobList
          jobs={jobs}
          loading={loading}
          onSelectJob={(job) => setSelectedJobId(job.id)}
          selectedJobId={selectedJobId}
          totalJobs={totalJobs}
        />
      </div>
      {/* JobPreview Container */}
      <div className={`${!selectedJobId && isMobile ? 'hidden' : 'block'} ${isMobile ? 'w-full' : 'flex-1'} h-full`}>
        <JobPreview
          selectedJob={jobs.find(job => job.id === selectedJobId) || null}
          onBack={() => setSelectedJobId(null)}
        />
      </div>
    </div>
  )
}
