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
    <>
      {/* Toggle button - always visible */}
      <div className="fixed top-0 left-0 z-50 h-16 flex items-center justify-center">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
          className="ml-3"
        >
          {!isOpen ? (
            <Menu className="h-4 w-4" />
          ) : (
            <X className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Sidebar content - hidden when collapsed */}
      <div className={cn(
        "fixed top-0 left-0 h-screen border-r bg-background",
        isOpen ? "w-52 opacity-100 visible" : "w-0 opacity-0 invisible",
        "transition-all duration-300 overflow-hidden z-40"
      )}>
        <div className="h-16 flex items-center px-4 border-b">
          <h2 className="text-xl font-bold ml-8">Job AI</h2>
        </div>
        <ScrollArea className="h-[calc(100vh-4rem)]">
          <div className="space-y-1 p-2">
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                <span>All Jobs</span>
              </Link>
            </Button>

            <Collapsible open={jobsOpen} onOpenChange={setJobsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-start">
                  <ListFilter className="h-4 w-4 mr-2" />
                  <span>Lists</span>
                  <ChevronDown className={cn(
                    "h-4 w-4 ml-auto transition-transform",
                    jobsOpen && "rotate-180"
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

            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/jobs/rank">
                <ListFilter className="h-4 w-4 mr-2" />
                <span>Rank Jobs</span>
              </Link>
            </Button>

            {session?.user?.email === "bbayarbileg@gmail.com" && (
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/scrape">
                  <Download className="h-4 w-4 mr-2" />
                  <span>Scrape Jobs</span>
                </Link>
              </Button>
            )}

            <div className="mt-auto pt-4 border-t">
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/profile">
                  <User className="h-4 w-4 mr-2" />
                  <span>Profile</span>
                </Link>
              </Button>
            </div>
          </div>
        </ScrollArea>
      </div>
    </>
  )
}