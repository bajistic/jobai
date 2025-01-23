'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useJobs } from '@/contexts/JobContext'
import { JobFilter as JobFilterType } from '@/lib/types/shared'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Filter } from 'lucide-react'

function JobFilterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { fetchJobs } = useJobs()
  
  const [filters, setFilters] = useState<JobFilterType>({
    location: searchParams.get('location') || '',
    ranking: searchParams.get('ranking') || '',
  })

  const [localFilters, setLocalFilters] = useState(filters)

  // Update local filters when URL params change
  useEffect(() => {
    const newFilters = {
      location: searchParams.get('location') || '',
      ranking: searchParams.get('ranking') || '',
    }
    setLocalFilters(newFilters)
    setFilters(newFilters)
  }, [searchParams])

  const applyFilters = () => {
    const params = new URLSearchParams()
    
    // Only add non-empty values to params
    Object.entries(localFilters).forEach(([key, value]) => {
      if (value && typeof value === 'string' && value.trim()) {
        params.set(key, value.trim())
      }
    })

    // Add current page if it exists
    const currentPage = searchParams.get('page')
    if (currentPage) {
      params.set('page', currentPage)
    }

    setFilters(localFilters)
    router.push(`?${params.toString()}`, { scroll: false })
    fetchJobs({
      ...localFilters,
      page: Number(currentPage) || 1,
      pageSize: 10
    })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Filters</h4>
            <p className="text-sm text-muted-foreground">
              Customize your job search results
            </p>
          </div>
          <div className="grid gap-2">
            <div className="grid gap-1">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={localFilters.location}
                onChange={(e) => setLocalFilters({ ...localFilters, location: e.target.value })}
                placeholder="Filter by location..."
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="ranking">Ranking</Label>
              <Select
                value={localFilters.ranking}
                onValueChange={(value) => setLocalFilters({ ...localFilters, ranking: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ranking" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="bingo">Bingo</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="okay">Okay</SelectItem>
                  <SelectItem value="bad">Bad</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={applyFilters}>Apply Filters</Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function JobFilter() {
  return (
    <Suspense fallback={<div>Loading filters...</div>}>
      <JobFilterContent />
    </Suspense>
  )
} 