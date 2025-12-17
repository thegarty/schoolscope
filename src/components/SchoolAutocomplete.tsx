"use client"
import React, { useState, useEffect } from 'react'
import { trackSearch } from '@/lib/analytics'

export default function SchoolAutocomplete({ preselected, name = 'schoolId' }: { preselected?: any, name?: string }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(preselected || null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (preselected) setSelected(preselected)
  }, [preselected])

  useEffect(() => {
    if (!query) {
      setResults([])
      return
    }
    setLoading(true)
    fetch(`/api/schools/search?q=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => {
        setResults(data)
        trackSearch(query, data.length, 'school')
      })
      .finally(() => setLoading(false))
  }, [query])

  return (
    <div>
      <input
        type="text"
        placeholder="Type to search for a school..."
        className="border rounded-md px-3 py-2 w-full"
        value={selected ? `${selected.name} (${selected.suburb}, ${selected.state})` : query}
        onChange={e => {
          setQuery(e.target.value)
          setSelected(null)
        }}
        autoComplete="off"
      />
      <input type="hidden" name={name} value={selected?.id || ''} />
      {loading && <div className="text-xs text-gray-400 mt-1">Searching...</div>}
      {!selected && results.length > 0 && (
        <ul className="border rounded-md bg-white mt-1 max-h-48 overflow-auto z-10 relative">
          {results.map((school) => (
            <li
              key={school.id}
              className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
              onClick={() => {
                setSelected(school)
                setQuery('')
                setResults([])
              }}
            >
              {school.name} ({school.suburb}, {school.state})
            </li>
          ))}
        </ul>
      )}
      {!selected && query && !loading && results.length === 0 && (
        <div className="text-xs text-gray-400 mt-1">No schools found.</div>
      )}
      {selected && (
        <button type="button" className="text-xs text-blue-600 mt-1 underline" onClick={() => setSelected(null)}>
          Change school
        </button>
      )}
    </div>
  )
} 