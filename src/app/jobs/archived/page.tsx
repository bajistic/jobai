'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { Job } from '@/lib/types/shared'
import { useJobs } from '@/contexts/JobContext'

const JobList = dynamic(() => import('@/components/JobList'), { ssr: false })

export default function ArchivedJobsPage() {
  const { jobs, loading, totalJobs } = useJobs({ status: 'archived' })
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null)

  return (
    <JobList 
      jobs={jobs} 
      loading={loading} 
      totalJobs={totalJobs}
      selectedJobId={selectedJobId}
      onSelectJob={(job: Job) => setSelectedJobId(job.id)}
    />
  )
} 