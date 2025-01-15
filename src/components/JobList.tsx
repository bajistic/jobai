'use client'

import { useState, useEffect } from 'react'
import { Job } from '@/lib/types/shared'
import { JobCard } from './JobCard'

export function JobList() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchJobs()
  }, [])

  async function fetchJobs() {
    try {
      const response = await fetch('/api/jobs')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      if (!result.data) {
        throw new Error('No data in response')
      }
      setJobs(result.data)
    } catch (error) {
      console.error('Error fetching jobs:', error)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  // Prevent hydration mismatch
  if (!mounted) return null

  if (loading) return <div>Loading...</div>

  return (
    <div className="grid gap-4">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} onUpdate={fetchJobs} />
      ))}
    </div>
  )
} 