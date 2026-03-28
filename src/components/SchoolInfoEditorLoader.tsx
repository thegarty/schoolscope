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
  const [state, setState] = useState<'loading' | 'ready'>('loading')
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [pendingEdits, setPendingEdits] = useState<any[]>([])

  useEffect(() => {
    fetch(`/api/schools/${school.id}/edits`)
      .then(async r => {
        if (r.ok) {
          const data = await r.json()
          setPendingEdits(data.edits ?? [])
        }
      })
      .catch(() => {
        // School info remains public even if edits cannot be loaded.
      })
      .finally(() => {
        fetch('/api/auth/me')
          .then(async r => {
            if (!r.ok) return
            const { user } = await r.json()
            setCurrentUserId(user.id)
          })
          .catch(() => {
            // Unauthenticated users can still view school information.
          })
          .finally(() => setState('ready'))
      })
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

  return (
    <SchoolInfoEditor
      school={school}
      pendingEdits={pendingEdits}
      currentUserId={currentUserId}
    />
  )
}
