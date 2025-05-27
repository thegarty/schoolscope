import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, School, Users, MapPin } from 'lucide-react'
import SchoolTicker from '@/components/SchoolTicker'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link className="flex items-center justify-center" href="/">
          <School className="h-6 w-6 mr-2" />
          <span className="font-bold text-xl">SchoolScope</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/login">
            Login
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/register">
            Register
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section 
        className="relative w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/schoolscope-header.png')"
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40"></div>
        
        <div className="relative container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-white drop-shadow-lg">
                Welcome to SchoolScope
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-100 md:text-xl drop-shadow-md">
                The crowdsourced calendar and wiki for Australian schools. Stay connected with your school community, 
                track events, and never miss what's important for your children.
              </p>
            </div>
            <div className="space-x-4">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
                <Link href="/register">Get Started</Link>
              </Button>
              <Button variant="outline" asChild size="lg" className="bg-white/90 hover:bg-white text-gray-900 border-white shadow-lg">
                <Link href="/schools">Browse Schools</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* School Ticker */}
      <SchoolTicker />

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">
            Everything you need to stay connected
          </h2>
          <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
            <Card>
              <CardHeader>
                <Calendar className="h-8 w-8 mb-2" />
                <CardTitle>School Events Calendar</CardTitle>
                <CardDescription>
                  View and track all school events, excursions, parent nights, and holidays in one place.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-8 w-8 mb-2" />
                <CardTitle>Community Driven</CardTitle>
                <CardDescription>
                  Parents, students, and teachers collaborate to keep information accurate and up-to-date.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <MapPin className="h-8 w-8 mb-2" />
                <CardTitle>School Profiles</CardTitle>
                <CardDescription>
                  Comprehensive school information including location, year levels, contacts, and more.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        className="relative w-full py-12 md:py-24 lg:py-32 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/schoolscope-header-bg.png')"
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/50"></div>
        
        <div className="relative container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white drop-shadow-lg">
                Ready to get started?
              </h2>
              <p className="mx-auto max-w-[600px] text-gray-100 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed drop-shadow-md">
                Join thousands of Australian families staying connected with their school communities.
              </p>
            </div>
            <Button size="lg" asChild className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
              <Link href="/register">Create Your Account</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center mb-4">
                <School className="h-6 w-6 mr-2" />
                <span className="font-bold text-xl">SchoolScope</span>
              </div>
              <p className="text-gray-400 text-sm">
                Connecting Australian school communities through events, calendars, and information sharing.
              </p>
            </div>

            {/* Schools by State */}
            <div>
              <h3 className="font-semibold mb-4">Schools by State</h3>
              <div className="space-y-2">
                <Link href="/schools/state/nsw" className="block text-sm text-gray-400 hover:text-white transition-colors">
                  New South Wales Schools
                </Link>
                <Link href="/schools/state/vic" className="block text-sm text-gray-400 hover:text-white transition-colors">
                  Victoria Schools
                </Link>
                <Link href="/schools/state/qld" className="block text-sm text-gray-400 hover:text-white transition-colors">
                  Queensland Schools
                </Link>
                <Link href="/schools/state/wa" className="block text-sm text-gray-400 hover:text-white transition-colors">
                  Western Australia Schools
                </Link>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">More States</h3>
              <div className="space-y-2">
                <Link href="/schools/state/sa" className="block text-sm text-gray-400 hover:text-white transition-colors">
                  South Australia Schools
                </Link>
                <Link href="/schools/state/tas" className="block text-sm text-gray-400 hover:text-white transition-colors">
                  Tasmania Schools
                </Link>
                <Link href="/schools/state/nt" className="block text-sm text-gray-400 hover:text-white transition-colors">
                  Northern Territory Schools
                </Link>
                <Link href="/schools/state/act" className="block text-sm text-gray-400 hover:text-white transition-colors">
                  ACT Schools
                </Link>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/schools" className="block text-sm text-gray-400 hover:text-white transition-colors">
                  Browse All Schools
                </Link>
                <Link href="/register" className="block text-sm text-gray-400 hover:text-white transition-colors">
                  Join SchoolScope
                </Link>
                <Link href="/privacy" className="block text-sm text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="block text-sm text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-xs text-gray-400">
              © 2024 SchoolScope. All rights reserved.
            </p>
            <p className="text-xs text-gray-400 mt-2 sm:mt-0">
              Connecting 10,000+ Australian schools nationwide
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
} 