'use client'

import { Job } from '@/lib/types/shared'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface JobActionsProps {
  job: Job
}

export function JobActions({ job }: JobActionsProps) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)

  const updateJob = async (data: Partial<Job>) => {
    setIsUpdating(true)
    try {
      await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      router.refresh()
    } catch (error) {
      console.error('Error updating job:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex flex-col space-y-2">
      <Link
        href={job.url}
        target="_blank"
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        View Original
      </Link>
      
      <button
        onClick={() => updateJob({ isStarred: !job.isStarred })}
        disabled={isUpdating}
        className={`px-4 py-2 rounded ${
          job.isStarred 
            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
        }`}
      >
        {job.isStarred ? 'Unstar' : 'Star'}
      </button>

      <button
        onClick={() => updateJob({ isHidden: !job.isHidden })}
        disabled={isUpdating}
        className={`px-4 py-2 rounded ${
          job.isHidden
            ? 'bg-red-100 text-red-800 hover:bg-red-200'
            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
        }`}
      >
        {job.isHidden ? 'Unhide' : 'Hide'}
      </button>
    </div>
  )
} 