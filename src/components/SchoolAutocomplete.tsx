"use client"
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { trackSearch } from '@/lib/analytics'

type SchoolOption = {
  id: string
  name: string
  suburb: string
  state: string
  postcode?: string
}

function normalizeSchoolResults(data: unknown): SchoolOption[] {
  if (Array.isArray(data)) return data as SchoolOption[]
  if (data && typeof data === 'object' && 'schools' in data) {
    const schools = (data as { schools?: unknown }).schools
    return Array.isArray(schools) ? (schools as SchoolOption[]) : []
  }
  return []
}

export default function SchoolAutocomplete({
  preselected,
  name = 'schoolId',
}: {
  preselected?: SchoolOption | null
  name?: string
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SchoolOption[]>([])
  const [selected, setSelected] = useState<SchoolOption | null>(preselected || null)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (preselected) setSelected(preselected)
  }, [preselected])

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current) return
      if (!wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const trimmedQuery = useMemo(() => query.trim(), [query])

  useEffect(() => {
    if (!trimmedQuery || trimmedQuery.length < 2) {
      setResults([])
      setHighlightedIndex(-1)
      return
    }
    const controller = new AbortController()
    const timeout = setTimeout(() => {
      setLoading(true)
      fetch(`/api/schools/search?q=${encodeURIComponent(trimmedQuery)}&limit=12`, {
        signal: controller.signal,
      })
        .then(res => res.json())
        .then(data => {
          const normalized = normalizeSchoolResults(data)
          setResults(normalized)
          setIsOpen(true)
          setHighlightedIndex(normalized.length > 0 ? 0 : -1)
          trackSearch(trimmedQuery, normalized.length, 'school')
        })
        .catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === 'AbortError')) {
            setResults([])
          }
        })
        .finally(() => setLoading(false))
    }, 200)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [trimmedQuery])

  const selectSchool = (school: SchoolOption) => {
    setSelected(school)
    setQuery('')
    setResults([])
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        type="text"
        placeholder="Type to search for a school..."
        className="border rounded-md px-3 py-2 w-full"
        value={selected ? `${selected.name} (${selected.suburb}, ${selected.state})` : query}
        onChange={e => {
          setQuery(e.target.value)
          setSelected(null)
          setIsOpen(true)
          setHighlightedIndex(-1)
        }}
        onFocus={() => {
          if (results.length > 0) setIsOpen(true)
        }}
        onKeyDown={(e) => {
          if (!isOpen || results.length === 0) return
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setHighlightedIndex((prev) => (prev + 1) % results.length)
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHighlightedIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1))
          } else if (e.key === 'Enter') {
            e.preventDefault()
            const school = results[highlightedIndex >= 0 ? highlightedIndex : 0]
            if (school) selectSchool(school)
          } else if (e.key === 'Escape') {
            setIsOpen(false)
          }
        }}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={isOpen}
      />
      <input type="hidden" name={name} value={selected?.id || ''} />
      {loading && <div className="text-xs text-gray-400 mt-1">Searching...</div>}
      {!selected && isOpen && results.length > 0 && (
        <ul className="absolute left-0 right-0 border rounded-md bg-white mt-1 max-h-56 overflow-auto z-50 shadow-md">
          {results.map((school) => (
            <li
              key={school.id}
              className={`px-3 py-2 cursor-pointer ${
                results[highlightedIndex]?.id === school.id ? 'bg-blue-100' : 'hover:bg-blue-50'
              }`}
              onMouseDown={() => selectSchool(school)}
            >
              {school.name} ({school.suburb}, {school.state})
            </li>
          ))}
        </ul>
      )}
      {!selected && trimmedQuery.length >= 2 && !loading && results.length === 0 && (
        <div className="text-xs text-gray-400 mt-1">No schools found.</div>
      )}
      {!selected && trimmedQuery.length > 0 && trimmedQuery.length < 2 && (
        <div className="text-xs text-gray-400 mt-1">Type at least 2 characters to search.</div>
      )}
      {selected && (
        <button
          type="button"
          className="text-xs text-blue-600 mt-1 underline"
          onClick={() => {
            setSelected(null)
            setIsOpen(false)
          }}
        >
          Change school
        </button>
      )}
    </div>
  )
} 