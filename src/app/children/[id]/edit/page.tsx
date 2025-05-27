import { redirect, notFound } from 'next/navigation'
import { validateRequest } from '@/auth/lucia'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { Suspense } from 'react'
import SchoolAutocomplete from '@/components/SchoolAutocomplete'
import EditChildForm from '@/components/EditChildForm'

interface EditChildPageProps {
  params: { id: string }
}

async function updateChildAction(formData: FormData) {
  'use server'
  
  try {
    const { user } = await validateRequest()
    if (!user) {
      redirect('/login')
    }

    const childId = formData.get('childId') as string
    const name = formData.get('name') as string
    const yearLevel = formData.get('yearLevel') as string
    const schoolId = formData.get('schoolId') as string

    if (!name || !yearLevel || !schoolId || !childId) {
      throw new Error('All fields are required')
    }

    // Verify child belongs to user
    const existingChild = await db.child.findFirst({
      where: {
        id: childId,
        userId: user.id
      }
    })

    if (!existingChild) {
      throw new Error('Child not found or access denied')
    }

    // Update the child
    await db.child.update({
      where: { id: childId },
      data: {
        name,
        yearLevel,
        schoolId
      }
    })

    revalidatePath('/dashboard')
    redirect('/dashboard')
  } catch (error) {
    console.error('Error updating child:', error)
    throw error
  }
}

async function deleteChildAction(formData: FormData) {
  'use server'
  
  try {
    const { user } = await validateRequest()
    if (!user) {
      redirect('/login')
    }

    const childId = formData.get('childId') as string

    if (!childId) {
      throw new Error('Child ID is required')
    }

    // Verify child belongs to user
    const existingChild = await db.child.findFirst({
      where: {
        id: childId,
        userId: user.id
      }
    })

    if (!existingChild) {
      throw new Error('Child not found or access denied')
    }

    // Delete the child
    await db.child.delete({
      where: { id: childId }
    })

    revalidatePath('/dashboard')
    redirect('/dashboard')
  } catch (error) {
    console.error('Error deleting child:', error)
    throw error
  }
}

export default async function EditChildPage({ params }: EditChildPageProps) {
  const { user } = await validateRequest()
  if (!user) redirect('/login')

  // Get the child data
  const child = await db.child.findFirst({
    where: {
      id: params.id,
      userId: user.id
    },
    include: {
      school: true
    }
  })

  if (!child) {
    notFound()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader>
            <CardTitle>Edit Child</CardTitle>
          </CardHeader>
          <CardContent>
            <EditChildForm 
              child={child}
              updateChildAction={updateChildAction}
              deleteChildAction={deleteChildAction}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 