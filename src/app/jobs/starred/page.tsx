'use client'

import dynamic from 'next/dynamic'
import { useJobs } from '@/contexts/JobContext'
import { useEffect } from "react"

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

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="w-1/3 border-r">
        <JobList 
          jobs={jobs} 
          loading={loading} 
          totalJobs={totalJobs}
          selectedJobId={selectedJobId}
          onSelectJob={(job) => setSelectedJobId(job.id)}
        />
      </div>
      <div className="flex-1">
        <JobPreview selectedJob={jobs.find(job => job.id === selectedJobId) || null} />
      </div>
    </div>
  )
} 