'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const JobList = dynamic(() => import('@/components/JobList'), { ssr: false })
const JobPreview = dynamic(() => import('@/components/JobPreview'), { ssr: false })

export default function Dashboard() {
  const [jobs, setJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('/api/jobs')
        const { data } = await response.json()
        setJobs(data)
      } catch (error) {
        console.error('Failed to fetch jobs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [])

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="w-1/3 border-r">
        <JobList 
          jobs={jobs} 
          loading={loading}
          onSelectJob={setSelectedJob} 
          selectedJobId={selectedJob?.id} 
        />
      </div>
      <div className="flex-1">
        <JobPreview selectedJob={selectedJob} />
      </div>
    </div>
  )
}