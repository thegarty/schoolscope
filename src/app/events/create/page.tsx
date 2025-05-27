import { redirect } from 'next/navigation'
import { validateRequest } from '@/auth/lucia'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import CreateEventForm from '@/components/CreateEventForm'

async function createEvent(formData: FormData) {
  'use server'
  
  try {
    const { user } = await validateRequest()
    if (!user) {
      console.log('No user found, redirecting to login')
      redirect('/login')
    }

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const startDate = formData.get('startDate') as string
    const endDate = formData.get('endDate') as string
    const startTime = formData.get('startTime') as string
    const endTime = formData.get('endTime') as string
    const schoolId = formData.get('schoolId') as string
    const category = formData.get('category') as string
    const location = formData.get('location') as string
    const isPrivate = formData.get('isPrivate') === 'true'
    const childId = formData.get('childId') as string
    const yearLevels = formData.getAll('yearLevels') as string[]

    console.log('Form data received:', {
      title,
      description,
      startDate,
      endDate,
      startTime,
      endTime,
      schoolId,
      category,
      location,
      isPrivate,
      childId,
      yearLevels
    })

    // Validation
    if (!title || !description || !startDate || !schoolId || !category) {
      console.log('Validation failed: Missing required fields')
      throw new Error('Missing required fields')
    }

    if (isPrivate && !childId) {
      console.log('Validation failed: Private event requires child selection')
      throw new Error('Private event requires child selection')
    }

    if (!isPrivate && yearLevels.length === 0) {
      console.log('Validation failed: Public event requires year levels')
      throw new Error('Public event requires year levels')
    }

    // For private events, verify the child belongs to the user
    if (isPrivate) {
      const child = await db.child.findFirst({
        where: {
          id: childId,
          userId: user.id
        }
      })
      
      if (!child) {
        console.log('Validation failed: Child not found or not owned by user')
        throw new Error('Invalid child selection')
      }
    }

    // Combine date and time
    const startDateTime = new Date(`${startDate}T${startTime || '00:00'}`)
    const endDateTime = endDate 
      ? new Date(`${endDate}T${endTime || '23:59'}`)
      : new Date(`${startDate}T${endTime || '23:59'}`)

    console.log('Creating event with data:', {
      title,
      description,
      startDate: startDateTime,
      endDate: endDateTime,
      schoolId,
      userId: user.id,
      category,
      location,
      isPrivate,
      childId: isPrivate ? childId : null,
      yearLevels: isPrivate ? [] : yearLevels,
      confirmed: isPrivate // Private events are automatically confirmed
    })

    const event = await db.event.create({
      data: {
        title,
        description,
        startDate: startDateTime,
        endDate: endDateTime,
        schoolId,
        userId: user.id,
        category,
        location,
        isPrivate,
        childId: isPrivate ? childId : null,
        yearLevels: isPrivate ? [] : yearLevels,
        confirmed: isPrivate // Private events are automatically confirmed
      }
    })

    console.log('Event created successfully:', event.id)

    revalidatePath('/events')
    redirect('/events')
  } catch (error) {
    console.error('Error creating event:', error)
    throw error
  }
}

export default async function CreateEventPage() {
  const { user } = await validateRequest()
  if (!user) redirect('/login')

  // Get user's children and their schools for quick selection
  const children = await db.child.findMany({
    where: { userId: user.id },
    include: { school: true }
  })

  const userSchools = children.map(child => child.school)
  const uniqueSchools = userSchools.filter((school, index, self) => 
    index === self.findIndex(s => s.id === school.id)
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Create Event</h1>
          <p className="text-gray-600 mt-2">
            Add a new event to help keep your school community informed, or create a private reminder for yourself.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateEventForm 
              createEventAction={createEvent}
              uniqueSchools={uniqueSchools}
              userChildren={children}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 