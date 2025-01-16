'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'

const JobList = dynamic(() => import('@/components/JobList'), { ssr: false })
const JobPreview = dynamic(() => import('@/components/JobPreview'), { ssr: false })

export default function Dashboard() {
  const [jobs, setJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [totalJobs, setTotalJobs] = useState(0)

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const searchParams = new URLSearchParams(window.location.search)
      const page = searchParams.get('page') || '1'
      const pageSize = '10'
      
      const response = await fetch(`/api/jobs?page=${page}&pageSize=${pageSize}`)
      const { data, total } = await response.json()
      setJobs(data)
      setTotalJobs(total)
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs, window.location.search])

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="w-1/3 border-r">
        <JobList 
          jobs={jobs} 
          loading={loading}
          onSelectJob={setSelectedJob} 
          selectedJobId={selectedJob?.id}
          totalJobs={totalJobs}
        />
      </div>
      <div className="flex-1">
        <JobPreview selectedJob={selectedJob} />
      </div>
    </div>
  )
}