'use client'

import { useJobs } from '@/contexts/JobContext'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export function JobPagination() {
  const { totalJobs, pagination } = useJobs()
  const { 
    currentPage, 
    // totalPages, - unused variable
    handlePageChange, 
    getPageNumbers,
    hasNextPage,
    hasPrevPage 
  } = pagination

  if (totalJobs <= 10) return null

  return (
    <Pagination className="py-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious 
            onClick={() => handlePageChange(currentPage - 1)}
            className={!hasPrevPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
            onClick={() => handlePageChange(currentPage + 1)}
            className={!hasNextPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
} 