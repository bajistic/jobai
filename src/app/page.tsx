'use client'

import dynamic from 'next/dynamic'
import { useJobs } from '@/contexts/JobContext'
import { useEffect } from 'react'

const JobList = dynamic(() => import('@/components/JobList'), { ssr: false })
const JobPreview = dynamic(() => import('@/components/JobPreview'), { ssr: false })

export default function Dashboard() {
  const { jobs, loading, totalJobs, selectedJobId, setSelectedJobId, fetchJobs } = useJobs()

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className={`w-full lg:w-1/3 border-r ${selectedJobId ? 'hidden lg:block' : 'block'}`}>
        <JobList 
          jobs={jobs} 
          loading={loading}
          onSelectJob={(job) => setSelectedJobId(job.id)} 
          selectedJobId={selectedJobId}
          totalJobs={totalJobs}
        />
      </div>
      <div className={`flex-1 ${selectedJobId ? 'block' : 'hidden lg:block'}`}>
        <JobPreview 
          selectedJob={jobs.find(job => job.id === selectedJobId) || null} 
          onBack={() => setSelectedJobId(null)}
        />
      </div>
    </div>
  )
}