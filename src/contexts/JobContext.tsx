'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Job } from '@/lib/types/shared'

interface JobContextType {
  jobs: Job[]
  loading: boolean
  totalJobs: number
  selectedJobId: number | null
  pagination: {
    currentPage: number
    totalPages: number
    handlePageChange: (page: number) => void
    getPageNumbers: () => (number | string)[]
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  fetchJobs: (options?: JobFetchOptions) => Promise<void>
  setSelectedJobId: (id: number | null) => void
  updateJobStatus: (jobId: number, status: 'new' | 'applied' | 'rejected' | 'interview') => Promise<void>
}

interface JobFetchOptions {
  onlyStarred?: boolean
  showHidden?: boolean
  status?: string
  page?: number
  pageSize?: number
  location?: string
  ranking?: string
}

const JobContext = createContext<JobContextType>({
  jobs: [],
  loading: false,
  totalJobs: 0,
  selectedJobId: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    handlePageChange: () => {},
    getPageNumbers: () => [],
    hasNextPage: false,
    hasPrevPage: false
  },
  fetchJobs: async (options?: JobFetchOptions) => undefined,
  setSelectedJobId: () => {},
  updateJobStatus: async () => {},
})

export function JobProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [totalJobs, setTotalJobs] = useState(0)
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentPage = Number(searchParams.get('page')) || 1
  const itemsPerPage = 10
  const totalPages = Math.max(1, Math.ceil(totalJobs / itemsPerPage))

  const fetchJobs = useCallback(async (options: JobFetchOptions = {}) => {
    console.log('Fetching jobs with options:', JSON.stringify(options, null, 2))
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (options.onlyStarred) params.set('onlyStarred', 'true')
      if (options.showHidden) params.set('showHidden', 'true')
      if (options.status) params.set('status', options.status)
      if (options.location) params.set('location', options.location)
      if (options.ranking && options.ranking !== 'all') params.set('ranking', options.ranking)
      params.set('page', String(currentPage))
      params.set('pageSize', String(itemsPerPage))

      const response = await fetch(`/api/jobs?${params.toString()}`)
      const data = await response.json()
      setJobs(data.jobs || [])
      setTotalJobs(data.total || 0)
    } catch (error) {
      console.error('Error fetching jobs:', error)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [currentPage])

  const handlePageChange = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  const getPageNumbers = useCallback(() => {
    const delta = 1
    const range = []
    const rangeWithDots = []
    let l

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i)
      }
    }

    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1)
        } else if (i - l !== 1) {
          rangeWithDots.push('...')
        }
      }
      rangeWithDots.push(i)
      l = i
    }

    return rangeWithDots
  }, [currentPage, totalPages])

  const pagination = {
    currentPage,
    totalPages,
    handlePageChange,
    getPageNumbers,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  }

  const updateJobStatus = useCallback(async (jobId: number, status: 'new' | 'applied' | 'rejected' | 'interview') => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update job status');
      }

      // Refetch jobs to update the list
      await fetchJobs();
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  }, [fetchJobs]);

  return (
    <JobContext.Provider value={{
      jobs,
      loading,
      totalJobs,
      selectedJobId,
      pagination,
      fetchJobs,
      setSelectedJobId,
      updateJobStatus,
    }}>
      {children}
    </JobContext.Provider>
  )
}

export function useJobs() {
  const context = useContext(JobContext)
  if (!context) {
    throw new Error('useJobs must be used within a JobProvider')
  }
  return context
} 