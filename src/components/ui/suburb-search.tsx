'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

interface SuburbSearchProps {
  suburbs: string[]
  defaultValue?: string
  name: string
  placeholder?: string
}

export function SuburbSearch({ suburbs, defaultValue = '', name, placeholder = 'Search suburbs...' }: SuburbSearchProps) {
  const [query, setQuery] = useState(defaultValue)
  const [isOpen, setIsOpen] = useState(false)
  const [filteredSuburbs, setFilteredSuburbs] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.length > 0) {
      const filtered = suburbs
        .filter(suburb => 
          suburb.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 10) // Limit to 10 results
      setFilteredSuburbs(filtered)
    } else {
      setFilteredSuburbs([])
    }
  }, [query, suburbs])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setIsOpen(value.length > 0)
  }

  const handleSuburbSelect = (suburb: string) => {
    setQuery(suburb)
    setIsOpen(false)
    inputRef.current?.blur()
  }

  const handleClear = () => {
    setQuery('')
    setIsOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          name={name}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(query.length > 0)}
          placeholder={placeholder}
          className="border rounded-md px-3 py-2 w-full pr-8"
          autoComplete="off"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {query ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <Search className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {isOpen && filteredSuburbs.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {filteredSuburbs.map((suburb) => (
            <button
              key={suburb}
              type="button"
              onClick={() => handleSuburbSelect(suburb)}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
            >
              {suburb}
            </button>
          ))}
          {query && !filteredSuburbs.includes(query) && (
            <div className="px-3 py-2 text-sm text-gray-500 border-t">
              Press Enter to search for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  )
} 