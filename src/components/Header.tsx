'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Menu, Search, List, FileText } from 'lucide-react'
import { JobFilter } from "@/components/JobFilter"

interface HeaderProps {
  onToggleJobList: () => void
  showJobList: boolean
  onToggleSidebar: () => void
}

export default function Header({ onToggleJobList, showJobList, onToggleSidebar }: HeaderProps) {
  return (
    <header className="border-b bg-background h-16">
      <div className="flex flex-col space-y-2 p-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex items-center space-x-4">
{/*           <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
            <Menu className="h-5 w-5" />
          </Button> */}
          <div className="relative flex-1 lg:flex-none">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8 w-full lg:w-64"
              placeholder="Search jobs..."
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <JobFilter />
          <Button variant="outline" className="flex-1 lg:flex-none">Select</Button>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onToggleJobList}>
            {showJobList ? <FileText className="h-5 w-5" /> : <List className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </header>
  )
} 