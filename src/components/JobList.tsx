'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useState } from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { Job } from '@/lib/types/shared'
import { JobCard } from '@/components/JobCard'
import { JobPagination } from '@/components/ui/JobPagination'

interface JobListProps {
  jobs: Job[]
  loading: boolean
  onSelectJob: (job: Job) => void
  selectedJobId: number | null
  totalJobs: number
}

export default function JobList({ jobs, loading, onSelectJob, selectedJobId, totalJobs }: JobListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentPage = Number(searchParams.get('page')) || 1
  const jobsPerPage = 10
  
  const totalPages = Math.max(1, Math.ceil(totalJobs / jobsPerPage))

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`?${params.toString()}`, { scroll: false })
  }

  // Ensure current page is within valid range
  useEffect(() => {
    if (currentPage > totalPages) {
      handlePageChange(totalPages)
    } else if (currentPage < 1) {
      handlePageChange(1)
    }
  }, [currentPage, totalPages])

  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="cursor-pointer">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-3 w-1/2 mb-2" />
                  <Skeleton className="h-3 w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {jobs.map(job => (
              <JobCard
                key={job.id}
                job={job}
                isSelected={selectedJobId === job.id}
                onSelect={() => onSelectJob(job)}
              />
            ))}
            <JobPagination />
          </>
        )}
      </div>
    </ScrollArea>
  )
} 