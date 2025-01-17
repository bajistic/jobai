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
                value={filters.searchQuery}
                onChange={(e) => updateFilters({ searchQuery: e.target.value })}
                placeholder="Search jobs..."
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={filters.location}
                onChange={(e) => updateFilters({ location: e.target.value })}
                placeholder="Filter by location..."
              />
            </div>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="showHidden" 
                checked={filters.showHidden}
                onCheckedChange={(checked) => 
                  updateFilters({ showHidden: checked === true })}
              />
              <Label htmlFor="showHidden">Show Hidden</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="onlyStarred" 
                checked={filters.onlyStarred}
                onCheckedChange={(checked) => 
                  updateFilters({ onlyStarred: checked === true })}
              />
              <Label htmlFor="onlyStarred">Only Starred</Label>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
} 