'use client'

import { Job } from '@/lib/types/shared'
import { useState } from 'react'
import Link from 'next/link'

interface CoverLetterSectionProps {
  job: Job
}

export function CoverLetterSection({ job }: CoverLetterSectionProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const generateCoverLetter = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch(`/api/jobs/${job.id}/cover-letter`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to generate cover letter')
      window.location.reload()
    } catch (error) {
      console.error('Error generating cover letter:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  if (job.coverLetter) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold">Cover Letter</h2>
          {job.coverLetter.googleDocsUrl && (
            <Link
              href={job.coverLetter.googleDocsUrl}
              target="_blank"
              className="text-blue-500 hover:underline"
            >
              Open in Google Docs
            </Link>
          )}
        </div>
        <div className="prose max-w-none whitespace-pre-wrap">
          {job.coverLetter.content}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Cover Letter</h2>
      <p className="text-gray-600 mb-4">No cover letter generated yet.</p>
      <button
        onClick={generateCoverLetter}
        disabled={isGenerating}
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
      >
        {isGenerating ? 'Generating...' : 'Generate Cover Letter'}
      </button>
    </div>
  )
} 