'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { School, Calendar, Users, Plus, Home, Menu, X } from 'lucide-react'
import NotificationBell from './NotificationBell'
import { useState } from 'react'

interface User {
  id: string
  name?: string | null
  email: string
}

interface AppHeaderProps {
  user?: User | null
  showNotifications?: boolean
}

export default function AppHeader({ user, showNotifications = true }: AppHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <School className="h-8 w-8 text-blue-600 mr-3" />
            <Link href={user ? "/dashboard" : "/"} className="text-2xl font-bold text-gray-900">
              SchoolScope
            </Link>
          </div>

          {/* Navigation Links (when logged in) */}
          {user && (
            <nav className="hidden md:flex items-center space-x-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard" className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  My Calendar
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/events" className="flex items-center">
                  <Home className="h-4 w-4 mr-2" />
                  All Events
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/children" className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Children
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/schools" className="flex items-center">
                  <School className="h-4 w-4 mr-2" />
                  Schools
                </Link>
              </Button>
              
              {/* Quick Actions */}
              <div className="border-l border-gray-200 pl-4 ml-4">
                <Button asChild size="sm">
                  <Link href="/events/create" className="flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Event
                  </Link>
                </Button>
              </div>
            </nav>
          )}

          {/* User Menu and Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Mobile Navigation Menu */}
                <div className="md:hidden relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="relative"
                  >
                    {isMobileMenuOpen ? (
                      <X className="h-4 w-4" />
                    ) : (
                      <Menu className="h-4 w-4" />
                    )}
                  </Button>

                  {isMobileMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <div className="p-2">
                        <div className="space-y-1">
                          <Link
                            href="/dashboard"
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Calendar className="h-4 w-4 mr-3" />
                            My Calendar
                          </Link>
                          <Link
                            href="/events"
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Home className="h-4 w-4 mr-3" />
                            All Events
                          </Link>
                          <Link
                            href="/children"
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Users className="h-4 w-4 mr-3" />
                            Children
                          </Link>
                          <Link
                            href="/schools"
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <School className="h-4 w-4 mr-3" />
                            Schools
                          </Link>
                          <div className="border-t border-gray-200 my-2"></div>
                          <Link
                            href="/events/create"
                            className="flex items-center w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md font-medium"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Plus className="h-4 w-4 mr-3" />
                            Add Event
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Overlay to close dropdown when clicking outside */}
                  {isMobileMenuOpen && (
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsMobileMenuOpen(false)}
                    />
                  )}
                </div>

                {/* Notifications */}
                {showNotifications && <NotificationBell />}

                {/* User Info */}
                <div className="hidden sm:flex items-center space-x-3">
                  <span className="text-sm text-gray-700">
                    Welcome, {user.name || user.email.split('@')[0]}
                  </span>
                  <form action="/api/auth/logout" method="POST">
                    <Button variant="outline" type="submit" size="sm">
                      Logout
                    </Button>
                  </form>
                </div>

                {/* Mobile User Menu */}
                <div className="sm:hidden">
                  <form action="/api/auth/logout" method="POST">
                    <Button variant="outline" type="submit" size="sm">
                      Logout
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              /* Guest Navigation */
              <div className="flex items-center space-x-4">
                <Button asChild variant="outline" size="sm">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register">Register</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
} 