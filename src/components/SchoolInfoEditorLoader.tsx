"use client"

import { useEffect, useState } from 'react'
import SchoolInfoEditor from '@/components/SchoolInfoEditor'

interface School {
  id: string
  name: string
  website?: string | null
  phone?: string | null
  email?: string | null
  principalName?: string | null
  address?: string | null
}

interface SchoolInfoEditorLoaderProps {
  school: School
}

export function SchoolInfoEditorLoader({ school }: SchoolInfoEditorLoaderProps) {
  const [state, setState] = useState<'loading' | 'unauthenticated' | 'ready'>('loading')
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [pendingEdits, setPendingEdits] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/auth/me')
      .then(async r => {
        if (!r.ok) { setState('unauthenticated'); return }
        const { user } = await r.json()
        setCurrentUserId(user.id)
        return fetch(`/api/schools/${school.id}/edits`)
      })
      .then(async r => {
        if (!r) return
        if (r.ok) {
          const data = await r.json()
          setPendingEdits(data.edits ?? [])
        }
        setState('ready')
      })
      .catch(() => setState('unauthenticated'))
  }, [school.id])

  if (state === 'loading') {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 rounded-md bg-gray-100 animate-pulse" />
        ))}
      </div>
    )
  }

  if (state === 'unauthenticated') {
    return (
      <div className="text-center py-12 text-gray-500">
        Please <a href="/login" className="text-blue-600 hover:underline">log in</a> to view and edit school information.
      </div>
    )
  }

  return (
    <SchoolInfoEditor
      school={school}
      pendingEdits={pendingEdits}
      currentUserId={currentUserId}
    />
  )
}
