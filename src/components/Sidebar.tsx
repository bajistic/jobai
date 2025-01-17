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
import { 
  ChevronDown, 
  Home, 
  BookmarkIcon, 
  CheckCircle, 
  EyeOff, 
  Archive, 
  ListFilter 
} from 'lucide-react'
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true)
  const [jobsOpen, setJobsOpen] = useState(true)
  const pathname = usePathname()

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
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              <span className={cn(!isOpen && "hidden")}>All Jobs</span>
            </Link>
          </Button>

          <Collapsible open={jobsOpen && isOpen} onOpenChange={setJobsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-start">
                <ListFilter className="h-4 w-4 mr-2" />
                <span className={cn(!isOpen && "hidden")}>Lists</span>
                <ChevronDown className={cn(
                  "h-4 w-4 ml-auto transition-transform",
                  jobsOpen && "rotate-180",
                  !isOpen && "hidden"
                )} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 pl-6">
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/jobs/starred">
                  <BookmarkIcon className="h-4 w-4 mr-2" />
                  <span>Starred Jobs</span>
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/jobs/applied">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>Applied Jobs</span>
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/jobs/hidden">
                  <EyeOff className="h-4 w-4 mr-2" />
                  <span>Hidden Jobs</span>
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/jobs/archived">
                  <Archive className="h-4 w-4 mr-2" />
                  <span>Archived Jobs</span>
                </Link>
              </Button>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
    </div>
  )
}