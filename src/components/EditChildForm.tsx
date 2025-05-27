"use client"

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Suspense } from 'react'
import SchoolAutocomplete from '@/components/SchoolAutocomplete'

interface School {
  id: string
  name: string
  suburb: string
  state: string
  postcode: string
}

interface Child {
  id: string
  name: string
  yearLevel: string
  school: School
}

interface EditChildFormProps {
  child: Child
  updateChildAction: (formData: FormData) => Promise<void>
  deleteChildAction: (formData: FormData) => Promise<void>
}

export default function EditChildForm({ child, updateChildAction, deleteChildAction }: EditChildFormProps) {
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const yearLevelOptions = [
    'Kindergarten/Prep/Reception',
    'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6',
    'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12'
  ]

  const handleSubmit = async (formData: FormData) => {
    setError(null)
    
    // Client-side validation
    const name = formData.get('name') as string
    const yearLevel = formData.get('yearLevel') as string
    const schoolId = formData.get('schoolId') as string

    if (!name || !yearLevel || !schoolId) {
      setError('Please fill in all required fields.')
      return
    }

    startTransition(async () => {
      try {
        await updateChildAction(formData)
      } catch (err) {
        setError('Failed to update child. Please try again.')
        console.error('Form submission error:', err)
      }
    })
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const formData = new FormData()
      formData.append('childId', child.id)
      await deleteChildAction(formData)
    } catch (err) {
      setError('Failed to delete child. Please try again.')
      console.error('Delete error:', err)
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form action={handleSubmit} className="space-y-6">
        <input type="hidden" name="childId" value={child.id} />
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name *
          </label>
          <Input 
            id="name" 
            name="name" 
            required 
            defaultValue={child.name}
            disabled={isPending}
          />
        </div>

        <div>
          <label htmlFor="yearLevel" className="block text-sm font-medium text-gray-700">
            Year Level *
          </label>
          <select 
            id="yearLevel" 
            name="yearLevel" 
            required 
            defaultValue={child.yearLevel}
            className="w-full border rounded-md px-3 py-2 disabled:opacity-50"
            disabled={isPending}
          >
            <option value="">Select year level...</option>
            {yearLevelOptions.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="schoolId" className="block text-sm font-medium text-gray-700">
            School *
          </label>
          <Suspense fallback={<div>Loading school...</div>}>
            <SchoolAutocomplete preselected={child.school} />
          </Suspense>
          <p className="text-xs text-gray-500 mt-1">Start typing to search for a different school.</p>
        </div>

        <div className="flex justify-between items-center pt-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Updating...' : 'Update Child'}
          </Button>
          <Button asChild variant="outline" disabled={isPending}>
            <Link href="/dashboard">Cancel</Link>
          </Button>
        </div>
      </form>

      {/* Delete Section */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Danger Zone</h3>
        <p className="text-sm text-gray-600 mb-4">
          Deleting this child will also remove all their private events. This action cannot be undone.
        </p>
        
        {!showDeleteConfirm ? (
          <Button 
            variant="outline" 
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-600 border-red-600 hover:bg-red-50"
            disabled={isPending || isDeleting}
          >
            Delete Child
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-red-800">
              Are you sure you want to delete {child.name}?
            </p>
            <div className="flex space-x-3">
              <Button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 