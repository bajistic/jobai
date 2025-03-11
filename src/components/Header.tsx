'use client'

import { Button } from "@/components/ui/button"
import { List, FileText, ChevronLeft } from 'lucide-react'
import { JobFilter } from "@/components/JobFilter"
import { SearchBar } from "@/components/SearchBar"
import { ThemeToggle } from "@/components/ThemeToggle"
import dynamic from 'next/dynamic'

const Sidebar = dynamic(() => import('@/components/Sidebar'), { ssr: false })

interface HeaderProps {
  onToggleJobList: () => void
  showJobList: boolean
  selectedJob?: boolean
}

export default function Header({ onToggleJobList, showJobList, selectedJob }: HeaderProps) {
  return (
    <>
      <Sidebar />
      <header className="border-b border-ui bg-background h-16">
        <div className="flex p-3 lg:flex-row lg:items-center justify-between">
          <div className="flex items-center space-x-3 pl-10 flex-1">
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
              <div className="flex-1 max-w-3xl">
                <SearchBar />
              </div>
            )}
          </div>
          <div className="flex items-center ml-2">
            {(!selectedJob || showJobList || window.innerWidth >= 1024) && (
              <JobFilter />
            )}
          </div>
        </div>
      </header>
    </>
  )
}