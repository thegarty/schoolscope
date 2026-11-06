import AppHeader from '@/components/AppHeader'
import AppFooter from '@/components/AppFooter'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { School, Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <AppHeader />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <School className="h-24 w-24 text-gray-400 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
            <p className="text-gray-600 mb-8">
              Sorry, we couldn't find the page you're looking for. The school or page you're trying to access may have been moved or doesn't exist.
            </p>
          </div>

          <div className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <Link href="/schools">
                <Search className="h-4 w-4 mr-2" />
                Browse Schools
              </Link>
            </Button>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Looking for a specific school? Try our{' '}
              <Link href="/schools" className="text-violet-600 hover:text-violet-500 underline">
                school search
              </Link>{' '}
              to find what you need.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <AppFooter />
    </div>
  )
} 