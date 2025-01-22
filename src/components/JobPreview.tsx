'use client'

import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ChevronLeft } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Job } from "@/lib/types/shared"
import { JobStatusButton } from "./JobStatusButton"

interface JobPreviewProps {
  selectedJob: Job | null;
  onBack?: () => void;
}

export default function JobPreview({ selectedJob, onBack }: JobPreviewProps) {
  if (!selectedJob) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <p className="text-muted-foreground">Select a job to view details</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <div className="p-6">
        <Button 
          variant="ghost" 
          className="lg:hidden mb-4" 
          onClick={onBack}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to list
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>
              <h2 className="text-2xl font-bold">{selectedJob.title || 'No Title'}</h2>
              <p className="text-lg text-muted-foreground mt-1">{selectedJob.company || 'No Company'}</p>
              <JobStatusButton jobId={selectedJob.id} currentStatus={selectedJob.status} />
            </CardTitle>
            <p className="text-muted-foreground">
              {selectedJob.location || 'No Location'} • {selectedJob.status || 'New'}
            </p>
            <Button size="lg" className="mt-4">Apply Now</Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Job Description</h3>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>
                  {selectedJob.description || 'No description available.'}
                </ReactMarkdown>
              </div>
            </div>
            <Separator />
            {selectedJob.url && (
              <div>
                <h3 className="text-xl font-semibold mb-2">Job URL</h3>
                <a href={selectedJob.url} target="_blank" rel="noopener noreferrer" 
                   className="text-blue-500 hover:underline">
                  View Original Posting
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
} 