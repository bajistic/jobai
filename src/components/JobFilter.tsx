'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { JobFilter as JobFilterType } from '@/lib/types/shared'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Filter } from 'lucide-react'

export function JobFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [filters, setFilters] = useState<JobFilterType>({
    searchQuery: searchParams.get('searchQuery') || '',
    location: searchParams.get('location') || '',
    showHidden: searchParams.get('showHidden') === 'true',
    onlyStarred: searchParams.get('onlyStarred') === 'true',
  })

  const [localFilters, setLocalFilters] = useState(filters)

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (localFilters.searchQuery) params.set('searchQuery', localFilters.searchQuery)
    if (localFilters.location) params.set('location', localFilters.location)
    if (localFilters.showHidden) params.set('showHidden', 'true')
    if (localFilters.onlyStarred) params.set('onlyStarred', 'true')

    setFilters(localFilters)
    router.push(`/jobs?${params.toString()}`)
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
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                value={localFilters.searchQuery}
                onChange={(e) => setLocalFilters({ ...localFilters, searchQuery: e.target.value })}
                placeholder="Search jobs..."
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={localFilters.location}
                onChange={(e) => setLocalFilters({ ...localFilters, location: e.target.value })}
                placeholder="Filter by location..."
              />
            </div>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="showHidden" 
                checked={localFilters.showHidden}
                onCheckedChange={(checked) => 
                  setLocalFilters({ ...localFilters, showHidden: checked === true })}
              />
              <Label htmlFor="showHidden">Show Hidden</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="onlyStarred" 
                checked={localFilters.onlyStarred}
                onCheckedChange={(checked) => 
                  setLocalFilters({ ...localFilters, onlyStarred: checked === true })}
              />
              <Label htmlFor="onlyStarred">Only Starred</Label>
            </div>
          </div>
          <Button onClick={applyFilters}>Apply Filters</Button>
        </div>
      </PopoverContent>
    </Popover>
  )
} 