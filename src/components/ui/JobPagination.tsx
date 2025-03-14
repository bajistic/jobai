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
    <Pagination className="py-4 bg-background sticky bottom-0 border-t">
      <PaginationContent className="flex-wrap justify-center">
        <PaginationItem>
          <PaginationPrevious 
            onClick={() => handlePageChange(currentPage - 1)}
            className={!hasPrevPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
          />
        </PaginationItem>
        
        {getPageNumbers().map((number, i) => (
          <PaginationItem key={i}>
            {number === '...' ? (
              <span className="px-3 py-2 text-sm">{number}</span>
            ) : (
              <PaginationLink
                onClick={() => handlePageChange(Number(number))}
                isActive={currentPage === number}
                className="cursor-pointer h-10 w-10 sm:h-10 sm:w-10 flex items-center justify-center"
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