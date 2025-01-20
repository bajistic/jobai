'use client'

import { Job } from '@/lib/types/shared'
import { useState } from 'react'
import { GenerateLetterDialog } from './generate-letter-dialog'

interface CoverLetterSectionProps {
  job: Job
}

export function CoverLetterSection({ job }: CoverLetterSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  if (job.cover_letter) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold">Cover Letter</h2>
          {job.cover_letter[0].docs_url && (
            <a
              href={job.cover_letter[0].docs_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Open in Google Docs
            </a>
          )}
        </div>
        <div className="prose max-w-none whitespace-pre-wrap">
          {job.cover_letter[0].content}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Cover Letter</h2>
        <p className="text-gray-600 mb-4">No cover letter generated yet.</p>
        <button
          onClick={() => setDialogOpen(true)}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Generate Cover Letter
        </button>
      </div>

      <GenerateLetterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        job={job}
      />
    </>
  )
} 