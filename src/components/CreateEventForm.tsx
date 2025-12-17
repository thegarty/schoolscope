"use client"

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Suspense } from 'react'
import SchoolAutocomplete from '@/components/SchoolAutocomplete'
import SchoolQuickSelect from '@/components/SchoolQuickSelect'
import { trackEventAction, trackForm, trackError, trackConversion } from '@/lib/analytics'

interface School {
  id: string
  name: string
  suburb: string
  state: string
}

interface Child {
  id: string
  name: string
  yearLevel: string
  school: School
}

interface CreateEventFormProps {
  createEventAction: (formData: FormData) => Promise<void>
  uniqueSchools: School[]
  userChildren: Child[]
}

export default function CreateEventForm({ createEventAction, uniqueSchools, userChildren }: CreateEventFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [isPrivate, setIsPrivate] = useState(false)

  const yearLevelOptions = [
    'Kindergarten/Prep/Reception',
    'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6',
    'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12'
  ]

  const categoryOptions = [
    'Academic',
    'Sports',
    'Arts & Culture',
    'Excursion',
    'Parent Meeting',
    'School Holiday',
    'Assessment',
    'Social Event',
    'Fundraising',
    'Other'
  ]

  const handleSubmit = async (formData: FormData) => {
    setError(null)
    
    // Client-side validation
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const startDate = formData.get('startDate') as string
    const schoolId = formData.get('schoolId') as string
    const category = formData.get('category') as string
    const isPrivateEvent = formData.get('isPrivate') === 'true'
    const childId = formData.get('childId') as string
    const yearLevels = formData.getAll('yearLevels') as string[]

    if (!title || !description || !startDate || !schoolId || !category) {
      setError('Please fill in all required fields.')
      trackForm('create_event', 'error', 'Missing required fields')
      return
    }

    if (isPrivateEvent && !childId) {
      setError('Please select a child for private events.')
      trackForm('create_event', 'error', 'Missing child selection')
      return
    }

    if (!isPrivateEvent && yearLevels.length === 0) {
      setError('Please select at least one year level for public events.')
      trackForm('create_event', 'error', 'Missing year levels')
      return
    }

    startTransition(async () => {
      try {
        await createEventAction(formData)
        trackEventAction('create', undefined, title, !isPrivateEvent)
        trackForm('create_event', 'success')
        trackConversion('event_created')
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create event'
        setError('Failed to create event. Please try again.')
        trackError(err instanceof Error ? err : new Error(errorMessage), 'create_event')
        trackForm('create_event', 'error', errorMessage)
        console.error('Form submission error:', err)
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Event Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Event Type *
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="isPrivate"
              value="false"
              checked={!isPrivate}
              onChange={() => setIsPrivate(false)}
              className="mr-2"
              disabled={isPending}
            />
            <span className="text-sm">
              <strong>Public Event</strong> - Visible to all parents at the school
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="isPrivate"
              value="true"
              checked={isPrivate}
              onChange={() => setIsPrivate(true)}
              className="mr-2"
              disabled={isPending}
            />
            <span className="text-sm">
              <strong>Private Event</strong> - Only visible to you (e.g., parent interviews)
            </span>
          </label>
        </div>
      </div>

      {/* Child Selection for Private Events */}
      {isPrivate && (
        <div>
          <label htmlFor="childId" className="block text-sm font-medium text-gray-700">
            Child *
          </label>
          <select 
            id="childId" 
            name="childId" 
            required={isPrivate}
            className="w-full border rounded-md px-3 py-2 disabled:opacity-50"
            disabled={isPending}
          >
            <option value="">Select a child...</option>
            {userChildren.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name} - {child.yearLevel} at {child.school.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            This event will only be visible to you and relate to this child
          </p>
        </div>
      )}

      {/* Basic Info */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Event Title *
        </label>
        <Input 
          id="title" 
          name="title" 
          required 
          placeholder={isPrivate ? "e.g., Parent Interview with Ms. Smith" : "e.g., Year 6 Graduation Ceremony"}
          disabled={isPending}
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          className="w-full border rounded-md px-3 py-2 disabled:opacity-50"
          placeholder="Provide details about the event..."
          disabled={isPending}
        />
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700">
          Location
        </label>
        <Input 
          id="location" 
          name="location" 
          placeholder="e.g., School Hall, Room 12, or external address"
          disabled={isPending}
        />
        <p className="text-xs text-gray-500 mt-1">
          This helps with calendar integration and directions
        </p>
      </div>

      {/* School Selection */}
      <div>
        <label htmlFor="schoolId" className="block text-sm font-medium text-gray-700">
          School *
        </label>
        <SchoolQuickSelect schools={uniqueSchools} />
        <Suspense fallback={<div>Loading schools...</div>}>
          <SchoolAutocomplete />
        </Suspense>
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
            Start Date *
          </label>
          <Input 
            id="startDate" 
            name="startDate" 
            type="date" 
            required 
            disabled={isPending}
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
            End Date
          </label>
          <Input 
            id="endDate" 
            name="endDate" 
            type="date" 
            disabled={isPending}
          />
          <p className="text-xs text-gray-500 mt-1">Leave blank if same as start date</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
            Start Time
          </label>
          <Input 
            id="startTime" 
            name="startTime" 
            type="time" 
            disabled={isPending}
          />
        </div>
        <div>
          <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
            End Time
          </label>
          <Input 
            id="endTime" 
            name="endTime" 
            type="time" 
            disabled={isPending}
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          Category *
        </label>
        <select 
          id="category" 
          name="category" 
          required 
          className="w-full border rounded-md px-3 py-2 disabled:opacity-50"
          disabled={isPending}
        >
          <option value="">Select a category...</option>
          {categoryOptions.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {/* Year Levels - Only for Public Events */}
      {!isPrivate && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Year Levels *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {yearLevelOptions.map((yearLevel) => (
              <label key={yearLevel} className="flex items-center">
                <input
                  type="checkbox"
                  name="yearLevels"
                  value={yearLevel}
                  className="mr-2 disabled:opacity-50"
                  disabled={isPending}
                />
                <span className="text-sm">{yearLevel}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">Select all year levels this event applies to</p>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-between items-center pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating Event...' : 'Create Event'}
        </Button>
        <Button asChild variant="outline" disabled={isPending}>
          <Link href="/events">Cancel</Link>
        </Button>
      </div>
    </form>
  )
} 