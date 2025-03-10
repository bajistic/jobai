'use client'

import { Button } from "@/components/ui/button"
import { List, FileText, ChevronLeft } from 'lucide-react'
import { JobFilter } from "@/components/JobFilter"
import { SearchBar } from "@/components/SearchBar"

interface HeaderProps {
  onToggleJobList: () => void
  showJobList: boolean
  selectedJob?: boolean
}

export default function Header({ onToggleJobList, showJobList, selectedJob }: HeaderProps) {
  return (
    <header className="border-b bg-background h-16">
      <div className="flex space-y-2 p-4 py-3 lg:flex-row lg:items-center justify-between lg:space-y-0">
        <div className="flex items-center space-x-4">
          {selectedJob && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden" 
              onClick={onToggleJobList}
              aria-label="Back to job list"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          {(!selectedJob || showJobList || window.innerWidth >= 1024) && (
            <SearchBar />
          )}
        </div>
        <div className="flex items-center space-x-2">
          {(!selectedJob || showJobList || window.innerWidth >= 1024) && (
            <JobFilter />
          )}
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onToggleJobList}>
            {showJobList ? <FileText className="h-5 w-5" /> : <List className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </header>
  )
} 