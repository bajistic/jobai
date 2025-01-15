'use client'

import { Job } from '@/lib/types/shared'
import { useState } from 'react'
import Link from 'next/link'

interface JobCardProps {
  job: Job
  onUpdate: () => void
}

export function JobCard({ job, onUpdate }: JobCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleHidden = async () => {
    try {
      await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHidden: !job.isHidden }),
      })
      onUpdate()
    } catch (error) {
      console.error('Error updating job:', error)
    }
  }

  const toggleStarred = async () => {
    try {
      await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStarred: !job.isStarred }),
      })
      onUpdate()
    } catch (error) {
      console.error('Error updating job:', error)
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${job.isHidden ? 'opacity-50' : ''}`}>
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold">{job.title}</h2>
          <p className="text-gray-600">{job.company}</p>
          <p className="text-gray-500">{job.location}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={toggleStarred}
            className={`p-2 rounded ${job.isStarred ? 'text-yellow-500' : 'text-gray-400'}`}
          >
            ★
          </button>
          <button
            onClick={toggleHidden}
            className={`p-2 rounded ${job.isHidden ? 'text-red-500' : 'text-gray-400'}`}
          >
            👁
          </button>
        </div>
      </div>
      
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-2 text-blue-500 hover:underline"
      >
        {isExpanded ? 'Show less' : 'Show more'}
      </button>

      {isExpanded && (
        <div className="mt-4">
          <div className="prose max-w-none">
            {job.description}
          </div>
          <div className="mt-4 flex space-x-4">
            <Link
              href={job.url}
              target="_blank"
              className="text-blue-500 hover:underline"
            >
              View Original
            </Link>
            {!job.coverLetter && (
              <Link
                href={`/jobs/${job.id}/generate`}
                className="text-green-500 hover:underline"
              >
                Generate Cover Letter
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 