'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { ChevronDown, Home, Briefcase, Users, Settings } from 'lucide-react'

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true)
  const [jobsOpen, setJobsOpen] = useState(true)

  return (
    <div className={cn(
      "border-r bg-background",
      isOpen ? "w-64" : "w-16",
      "transition-all duration-300 flex-shrink-0"
    )}>
      <div className="flex h-16 items-center justify-between px-4 border-b">
        <h2 className={cn("text-xl font-bold", !isOpen && "hidden")}>
          Job Dashboard
        </h2>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
          <ChevronDown className={cn("h-4 w-4 transition-transform", !isOpen && "rotate-180")} />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="space-y-1 p-2">
          <Button variant="ghost" className="w-full justify-start">
            <Home className="h-4 w-4 mr-2" />
            <span className={cn(!isOpen && "hidden")}>Dashboard</span>
          </Button>

          <Collapsible open={jobsOpen && isOpen} onOpenChange={setJobsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-start">
                <Briefcase className="h-4 w-4 mr-2" />
                <span className={cn(!isOpen && "hidden")}>Jobs</span>
                <ChevronDown className={cn(
                  "h-4 w-4 ml-auto transition-transform",
                  jobsOpen && "rotate-180",
                  !isOpen && "hidden"
                )} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 pl-6">
              <Button variant="ghost" className="w-full justify-start">All Jobs</Button>
              <Button variant="ghost" className="w-full justify-start">Active Jobs</Button>
              <Button variant="ghost" className="w-full justify-start">Archived Jobs</Button>
            </CollapsibleContent>
          </Collapsible>

          <Button variant="ghost" className="w-full justify-start">
            <Users className="h-4 w-4 mr-2" />
            <span className={cn(!isOpen && "hidden")}>Candidates</span>
          </Button>

          <Button variant="ghost" className="w-full justify-start">
            <Settings className="h-4 w-4 mr-2" />
            <span className={cn(!isOpen && "hidden")}>Settings</span>
          </Button>
        </div>
      </ScrollArea>
    </div>
  )
} 