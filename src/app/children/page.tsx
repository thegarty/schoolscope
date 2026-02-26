import { redirect } from 'next/navigation'
import { validateRequest } from '@/auth/lucia'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { School, Users, MapPin, Edit, Plus } from 'lucide-react'
import Link from 'next/link'
import AppHeader from '@/components/AppHeader'

export default async function ChildrenPage() {
  const { user } = await validateRequest()
  
  if (!user) {
    redirect('/login')
  }

  // Get user's children and their schools
  const children = await db.child.findMany({
    where: { userId: user.id },
    include: {
      school: true,
      privateEvents: {
        where: {
          startDate: { gte: new Date() }
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Manage Children</h2>
              <p className="text-gray-600 mt-2">
                Add, edit, or remove your children's school information.
              </p>
            </div>
            <Button asChild>
              <Link href="/children/add">
                <Plus className="h-4 w-4 mr-2" />
                Add Child
              </Link>
            </Button>
          </div>

          {/* Children List */}
          {children.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {children.map((child: typeof children[number]) => (
                <Card key={child.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{child.name}</CardTitle>
                        <CardDescription className="text-base">
                          {child.yearLevel}
                        </CardDescription>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/children/${child.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <School className="h-4 w-4 mr-2" />
                        <div>
                          <p className="font-medium">{child.school.name}</p>
                          <p className="text-xs text-gray-500">
                            {child.school.suburb}, {child.school.state} {child.school.postcode}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{child.school.type} • {child.school.sector}</span>
                      </div>

                      {child.privateEvents.length > 0 && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-blue-600">
                            {child.privateEvents.length} upcoming private event{child.privateEvents.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      )}

                      <div className="pt-3 flex space-x-2">
                        <Button asChild variant="outline" size="sm" className="flex-1">
                          <Link href={`/schools/${encodeURIComponent(child.school.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'))}-${encodeURIComponent(child.school.suburb.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'))}-${encodeURIComponent(child.school.state.toLowerCase())}`}>
                            View School
                          </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="flex-1">
                          <Link href={`/events/create?childId=${child.id}`}>
                            Add Event
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No children added yet</h3>
                <p className="text-gray-500 mb-6">
                  Add your children to start tracking their school events and information.
                </p>
                <Button asChild>
                  <Link href="/children/add">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Child
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          {children.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button asChild variant="outline" className="h-16">
                  <Link href="/events" className="flex flex-col items-center">
                    <School className="h-6 w-6 mb-2" />
                    View All Events
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-16">
                  <Link href="/events/create" className="flex flex-col items-center">
                    <Plus className="h-6 w-6 mb-2" />
                    Create Event
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-16">
                  <Link href="/schools" className="flex flex-col items-center">
                    <School className="h-6 w-6 mb-2" />
                    Browse Schools
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-16">
                  <Link href="/children/add" className="flex flex-col items-center">
                    <Users className="h-6 w-6 mb-2" />
                    Add Another Child
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
} 