import { redirect } from 'next/navigation'
import { validateRequest } from '@/lib/auth'
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
    <div className="min-h-screen bg-background">
      <AppHeader user={user} />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="min-w-0">
          {/* Header Section */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold text-primary">YOUR SCHOOL DAY, SIMPLIFIED</p><h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Your children</h1>
              <p className="text-muted-foreground mt-2">
                Add, edit, or remove your children's school information.
              </p>
            </div>
            <Button asChild className="sm:shrink-0">
              <Link href="/children/add">
                <Plus className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                Add Child
              </Link>
            </Button>
          </div>

          {/* Children List */}
          {children.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {children.map((child: typeof children[number]) => (
                <Card key={child.id} className="min-w-0">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="break-words text-xl leading-snug">{child.name}</CardTitle>
                        <CardDescription className="text-base">
                          {child.yearLevel}
                        </CardDescription>
                      </div>
                      <Button asChild variant="ghost" size="icon" className="shrink-0">
                        <Link href={`/children/${child.id}/edit`} aria-label={`Edit ${child.name}'s details`}>
                          <Edit className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <School className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        <div>
                          <p className="break-words font-medium">{child.school.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {child.school.suburb}, {child.school.state} {child.school.postcode}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>{child.school.type} • {child.school.sector}</span>
                      </div>

                      {child.privateEvents.length > 0 && (
                        <div className="pt-2 border-t">
                          <p className="text-sm font-medium text-primary">
                            {child.privateEvents.length} upcoming private event{child.privateEvents.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-2 pt-3 min-[360px]:grid-cols-2">
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
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No children added yet</h3>
                <p className="text-muted-foreground mb-6">
                  Add your children to start tracking their school events and information.
                </p>
                <Button asChild>
                  <Link href="/children/add">
                    <Plus className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    Add Your First Child
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          {children.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Button asChild variant="outline" className="h-auto min-h-24 whitespace-normal p-4 text-center">
                  <Link href="/events" className="flex flex-col items-center gap-2">
                    <School className="h-5 w-5 text-primary" aria-hidden="true" />
                    View All Events
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto min-h-24 whitespace-normal p-4 text-center">
                  <Link href="/events/create" className="flex flex-col items-center gap-2">
                    <Plus className="h-5 w-5 text-primary" aria-hidden="true" />
                    Create Event
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto min-h-24 whitespace-normal p-4 text-center">
                  <Link href="/schools" className="flex flex-col items-center gap-2">
                    <School className="h-5 w-5 text-primary" aria-hidden="true" />
                    Browse Schools
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto min-h-24 whitespace-normal p-4 text-center">
                  <Link href="/children/add" className="flex flex-col items-center gap-2">
                    <Users className="h-5 w-5 text-primary" aria-hidden="true" />
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