import Link from 'next/link'
import { School } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | SchoolScope',
  description: 'Terms of service for SchoolScope - the rules and guidelines for using our platform.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="flex items-center">
              <School className="h-8 w-8 text-blue-600 mr-3" />
              <span className="text-2xl font-bold text-gray-900">SchoolScope</span>
            </Link>
            <Link href="/" className="text-blue-600 hover:text-blue-500">
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow px-8 py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600 mb-6">
              By accessing and using SchoolScope, you accept and agree to be bound by the terms and 
              provision of this agreement. If you do not agree to abide by the above, please do not 
              use this service.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Description of Service</h2>
            <p className="text-gray-600 mb-6">
              SchoolScope is a platform that connects Australian school communities through event 
              calendars, school information, and community features. The service is provided to help 
              parents, students, and school staff stay informed about school activities and events.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. User Responsibilities</h2>
            <p className="text-gray-600 mb-4">
              As a user of SchoolScope, you agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-6">
              <li>Provide accurate and truthful information</li>
              <li>Respect the privacy and rights of other users</li>
              <li>Not post inappropriate, offensive, or harmful content</li>
              <li>Use the platform only for its intended educational and community purposes</li>
              <li>Not attempt to gain unauthorized access to the system</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Content Guidelines</h2>
            <p className="text-gray-600 mb-4">
              All content posted on SchoolScope must be:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-6">
              <li>Relevant to school activities and community</li>
              <li>Respectful and appropriate for all ages</li>
              <li>Accurate and not misleading</li>
              <li>Free from spam, advertising, or commercial content (unless authorized)</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Privacy and Data Protection</h2>
            <p className="text-gray-600 mb-6">
              Your privacy is important to us. Please review our Privacy Policy, which also governs 
              your use of the service, to understand our practices.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Prohibited Uses</h2>
            <p className="text-gray-600 mb-4">
              You may not use SchoolScope for:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-6">
              <li>Any unlawful purpose or to solicit others to perform unlawful acts</li>
              <li>Violating any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
              <li>Infringing upon or violating our intellectual property rights or the intellectual property rights of others</li>
              <li>Harassing, abusing, insulting, harming, defaming, slandering, disparaging, intimidating, or discriminating</li>
              <li>Submitting false or misleading information</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Account Termination</h2>
            <p className="text-gray-600 mb-6">
              We reserve the right to terminate or suspend your account and bar access to the service 
              immediately, without prior notice or liability, for any reason whatsoever, including 
              without limitation if you breach the Terms.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Disclaimer</h2>
            <p className="text-gray-600 mb-6">
              The information on this platform is provided on an "as is" basis. To the fullest extent 
              permitted by law, this Company excludes all representations, warranties, conditions and 
              terms relating to our platform and the use of this platform.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Changes to Terms</h2>
            <p className="text-gray-600 mb-6">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any 
              time. If a revision is material, we will try to provide at least 30 days notice prior 
              to any new terms taking effect.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Contact Information</h2>
            <p className="text-gray-600 mb-6">
              If you have any questions about these Terms of Service, please contact us at 
              legal@schoolscope.com.au
            </p>
          </div>
        </div>
      </main>
    </div>
  )
} 