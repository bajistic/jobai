'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { JobFilter as JobFilterType } from '@/lib/types/shared'

export function JobFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [filters, setFilters] = useState<JobFilterType>({
    searchQuery: searchParams.get('searchQuery') || '',
    location: searchParams.get('location') || '',
    showHidden: searchParams.get('showHidden') === 'true',
    onlyStarred: searchParams.get('onlyStarred') === 'true',
  })

  const updateFilters = (newFilters: Partial<JobFilterType>) => {
    const updated = { ...filters, ...newFilters }
    setFilters(updated)

    const params = new URLSearchParams()
    if (updated.searchQuery) params.set('searchQuery', updated.searchQuery)
    if (updated.location) params.set('location', updated.location)
    if (updated.showHidden) params.set('showHidden', 'true')
    if (updated.onlyStarred) params.set('onlyStarred', 'true')

    router.push(`/jobs?${params.toString()}`)
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Search</label>
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => updateFilters({ searchQuery: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="Search jobs..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Location</label>
          <input
            type="text"
            value={filters.location}
            onChange={(e) => updateFilters({ location: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="Filter by location..."
          />
        </div>
      </div>
      
      <div className="flex space-x-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.showHidden}
            onChange={(e) => updateFilters({ showHidden: e.target.checked })}
            className="rounded border-gray-300 text-blue-600"
          />
          <span className="ml-2">Show Hidden</span>
        </label>
        
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.onlyStarred}
            onChange={(e) => updateFilters({ onlyStarred: e.target.checked })}
            className="rounded border-gray-300 text-blue-600"
          />
          <span className="ml-2">Only Starred</span>
        </label>
      </div>
    </div>
  )
} 