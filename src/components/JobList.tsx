'use client'

import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { Job } from '@/lib/types/shared'

interface JobListProps {
  jobs: Job[]
  loading: boolean
  onSelectJob: (job: Job) => void
  selectedJobId: number | null
}

export default function JobList({ jobs, loading, onSelectJob, selectedJobId }: JobListProps) {
  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="cursor-pointer">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-3 w-1/2 mb-2" />
                  <Skeleton className="h-3 w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          jobs.map(job => (
            <Card 
              key={job.id} 
              className={cn(
                "cursor-pointer hover:bg-accent/50 transition-colors",
                selectedJobId === job.id && "ring-2 ring-primary"
              )}
              onClick={() => onSelectJob(job)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">{job.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{job.company}</p>
                <p className="text-sm text-muted-foreground">{job.location}</p>
                <Badge variant="secondary" className="mt-2">
                  {job.status || 'New'}
                </Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </ScrollArea>
  )
} 