'use client'

import dynamic from 'next/dynamic'
import { useJobs } from '@/contexts/JobContext'
import { useEffect } from "react"
import { useIsMobile } from '@/hooks/use-mobile'

const JobList = dynamic(() => import('@/components/JobList'), { ssr: false })
const JobPreview = dynamic(() => import('@/components/JobPreview'), { ssr: false })

export default function StarredJobsPage() {
  const { 
    jobs, 
    loading, 
    totalJobs, 
    selectedJobId, 
    setSelectedJobId, 
    fetchJobs,
    pagination: { currentPage }
  } = useJobs()

  useEffect(() => {
    fetchJobs({ onlyStarred: true })
  }, [fetchJobs, currentPage])

  const isMobile = useIsMobile()

  return (
    <div className="flex flex-1 h-full w-full overflow-hidden">
      {/* JobList Container */}
      <div className={`${isMobile && selectedJobId ? 'hidden' : 'block'} ${isMobile ? 'w-full' : 'w-1/3 border-r'} h-full`}>
        <JobList 
          jobs={jobs} 
          loading={loading} 
          totalJobs={totalJobs}
          selectedJobId={selectedJobId}
          onSelectJob={(job) => setSelectedJobId(job.id)}
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