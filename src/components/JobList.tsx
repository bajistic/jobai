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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

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

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const delta = 1; // Show only 1 page before and after current (3 total)
    const range = []
    const rangeWithDots = []
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || // First page
        i === totalPages || // Last page
        (i >= currentPage - delta && i <= currentPage + delta) // Pages around current
      ) {
        range.push(i)
      }
    }

    for (let i of range) {
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
  }

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
                onSelect={onSelectJob}
                onUpdate={() => {
                  console.log('Job updated:', job.id)
                  // Refresh the jobs list if needed
                }}
              />
            ))}

            {!loading && totalJobs > jobsPerPage && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      className={cn(
                        "cursor-pointer",
                        currentPage <= 1 && "pointer-events-none opacity-50"
                      )}
                    />
                  </PaginationItem>
                  
                  {getPageNumbers().map((number, i) => (
                    <PaginationItem key={i}>
                      {number === '...' ? (
                        <span className="px-4 py-2">{number}</span>
                      ) : (
                        <PaginationLink
                          onClick={() => handlePageChange(Number(number))}
                          isActive={currentPage === number}
                          className="cursor-pointer"
                        >
                          {number}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      className={cn(
                        "cursor-pointer",
                        currentPage >= totalPages && "pointer-events-none opacity-50"
                      )}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </div>
    </ScrollArea>
  )
} 