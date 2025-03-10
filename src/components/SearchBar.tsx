'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { useDebounce } from '@/lib/hooks/useDebounce'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { trackEvent, AnalyticsEvents } from '@/lib/analytics'

export function SearchBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')
  const debouncedSearch = useDebounce(searchTerm, 300)

  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    if (debouncedSearch) {
      params.set('q', debouncedSearch)
      
      // Track search event when user completes typing (debounced)
      if (debouncedSearch.length > 2) {
        trackEvent(AnalyticsEvents.JOBS_SEARCHED, {
          search_term: debouncedSearch,
          page: pathname,
        })
      }
    } else {
      params.delete('q')
    }
    router.replace(`${pathname}?${params.toString()}`)
  }, [debouncedSearch, pathname, router, searchParams])

  return (
    <div className="relative flex-1 lg:flex-none">
      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-8 w-full"
        placeholder="Search jobs, companies, locations..."
        aria-label="Search jobs"
      />
    </div>
  )
}
