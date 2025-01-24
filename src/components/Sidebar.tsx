'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { 
  ChevronDown, 
  Menu,
  Home, 
  BookmarkIcon, 
  CheckCircle, 
  EyeOff, 
  ListFilter,
  User,
  X,
  Download
} from 'lucide-react'
import Link from "next/link"
import { useSession } from 'next-auth/react'

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [jobsOpen, setJobsOpen] = useState(true)
  const { data: session } = useSession()

  return (
    <div className={cn(
      "border-r bg-background",
      isOpen ? "w-52" : "w-16",
      "transition-all duration-300 flex-shrink-0"
    )}>
      <div className="flex h-16 items-center justify-between px-4 border-b">
        <h2 className={cn("text-xl font-bold", !isOpen && "hidden")}>
          Job AI
        </h2>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
          {!isOpen ? (
            <Menu className={cn("h-4 w-4 transition-transform")} />
          ) : (
            <X className={cn("h-4 w-4 transition-transform")} />
          )}
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
            </CollapsibleContent>
          </Collapsible>

          {session?.user?.email === "bbayarbileg@gmail.com" && (
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/scrape">
                <Download className="h-4 w-4 mr-2" />
                <span className={cn(!isOpen && "hidden")}>Scrape Jobs</span>
              </Link>
            </Button>
          )}

          <div className="mt-auto pt-4 border-t">
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/profile">
                <User className="h-4 w-4 mr-2" />
                <span className={cn(!isOpen && "hidden")}>Profile</span>
              </Link>
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}