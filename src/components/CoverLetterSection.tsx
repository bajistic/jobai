'use client'

import { Job } from '@/lib/types/shared'
import { useState } from 'react'
import { GenerateLetterDialog } from './generate-letter-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

interface CoverLetterSectionProps {
  job: Job
}

export function CoverLetterSection({ job }: CoverLetterSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  if (job.cover_letter) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold">Cover Letter</h2>
          {job.cover_letter[0].docs_url && (
            <a
              href={job.cover_letter[0].docs_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline text-sm whitespace-nowrap ml-2"
            >
              Open in Google Docs
            </a>
          )}
        </div>
        <div className="h-[400px] md:h-[600px] w-full">
          <ScrollArea className="h-full w-full">
            <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap p-1">
              {job.cover_letter[0].content}
            </div>
          </ScrollArea>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Cover Letter</h2>
        <div className="flex flex-col items-start justify-center min-h-[150px]">
          <p className="text-gray-600 dark:text-gray-400 mb-4">No cover letter generated yet.</p>
          <button
            onClick={() => setDialogOpen(true)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Generate Cover Letter
          </button>
        </div>
      </div>

      <GenerateLetterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        job={job}
      />
    </>
  )
}