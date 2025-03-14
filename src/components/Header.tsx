'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { List, FileText, ChevronLeft, Menu, X } from 'lucide-react'
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
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <header className="border-b bg-background h-16">
        <div className="flex p-3 lg:flex-row lg:items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {!sidebarOpen ? (
                <Menu className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
            
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