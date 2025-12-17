'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { trackSearch } from '@/lib/analytics'

/**
 * Component to track school searches when search params are present
 */
export function SchoolSearchTracker() {
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const name = searchParams.get('name')
    const suburb = searchParams.get('suburb')
    const state = searchParams.get('state')
    const type = searchParams.get('type')
    const sector = searchParams.get('sector')
    
    // Build search query string
    const searchTerms: string[] = []
    if (name) searchTerms.push(`name:${name}`)
    if (suburb) searchTerms.push(`suburb:${suburb}`)
    if (state) searchTerms.push(`state:${state}`)
    if (type) searchTerms.push(`type:${type}`)
    if (sector) searchTerms.push(`sector:${sector}`)
    
    // Track if there's at least one search parameter
    if (searchTerms.length > 0) {
      const query = searchTerms.join(' ')
      trackSearch(query, undefined, 'school')
    }
  }, [searchParams])
  
  return null
}

