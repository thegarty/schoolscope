import { redirect } from 'next/navigation'
import { validateRequest } from '@/auth/lucia'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { Suspense } from 'react'
import React, { useState, useEffect } from 'react'
import SchoolAutocomplete from '@/components/SchoolAutocomplete'

async function addChild(formData: FormData) {
  'use server'
  const name = formData.get('name') as string
  const yearLevel = formData.get('yearLevel') as string
  const schoolId = formData.get('schoolId') as string

  const { user } = await validateRequest()
  if (!user) {
    redirect('/login')
  }
  if (!name || !yearLevel || !schoolId) {
    return
  }
  await db.child.create({
    data: {
      name,
      yearLevel,
      userId: user.id,
      schoolId
    }
  })
  revalidatePath('/dashboard')
  redirect('/dashboard')
}

async function getSchoolById(schoolId: string) {
  if (!schoolId) return null
  return db.school.findUnique({
    where: { id: schoolId },
    select: { id: true, name: true, suburb: true, state: true, postcode: true }
  })
}

export default async function AddChildPage({ searchParams }: { searchParams?: Record<string, string> }) {
  const { user } = await validateRequest()
  if (!user) redirect('/login')
  const schoolId = searchParams?.schoolId || ''
  const preselected = schoolId ? await getSchoolById(schoolId) : null

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader>
            <CardTitle>Add Child</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={addChild} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <label htmlFor="yearLevel" className="block text-sm font-medium text-gray-700">Year Level</label>
                <select id="yearLevel" name="yearLevel" required className="w-full border rounded-md px-3 py-2">
                  <option value="">Select year level...</option>
                  <option value="Kindergarten/Prep/Reception">Kindergarten / Prep / Reception</option>
                  <option value="Year 1">Year 1</option>
                  <option value="Year 2">Year 2</option>
                  <option value="Year 3">Year 3</option>
                  <option value="Year 4">Year 4</option>
                  <option value="Year 5">Year 5</option>
                  <option value="Year 6">Year 6</option>
                  <option value="Year 7">Year 7</option>
                  <option value="Year 8">Year 8</option>
                  <option value="Year 9">Year 9</option>
                  <option value="Year 10">Year 10</option>
                  <option value="Year 11">Year 11</option>
                  <option value="Year 12">Year 12</option>
                </select>
              </div>
              <div>
                <label htmlFor="schoolId" className="block text-sm font-medium text-gray-700">School</label>
                <Suspense fallback={<div>Loading school...</div>}>
                  <SchoolAutocomplete preselected={preselected} />
                </Suspense>
                <p className="text-xs text-gray-500 mt-1">Start typing to search for your school.</p>
              </div>
              <div className="flex justify-between items-center">
                <Button type="submit">Add Child</Button>
                <Button asChild variant="outline">
                  <Link href="/dashboard">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 