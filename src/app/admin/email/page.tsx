'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { Mail, TrendingUp, AlertTriangle, CheckCircle, Send, Users } from 'lucide-react';

interface EmailStats {
  stats: {
    totalUsers: number;
    subscribedUsers: number;
    unsubscribedUsers: number;
    totalEmailEvents: number;
    recentBouncesCount: number;
    recentComplaintsCount: number;
  };
  deliveryStats: Record<string, number>;
  recentEvents: Array<{
    id: string;
    email: string;
    eventType: string;
    timestamp: string;
    reason?: string;
    bounceType?: string;
  }>;
}

export default function EmailManagementPage() {
  const [emailStats, setEmailStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  // Test email form state
  const [testEmail, setTestEmail] = useState({
    type: 'custom',
    email: '',
    subject: 'Test Email from SchoolScope',
    html: '',
    name: 'Test User',
    eventTitle: 'Test School Event',
    schoolName: 'Test School',
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const userResponse = await fetch('/api/auth/me');
      if (!userResponse.ok) {
        router.push('/login');
        return;
      }
      const userData = await userResponse.json();
      setCurrentUser(userData.user);
      
      // Load email stats
      loadEmailStats();
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.push('/login');
    }
  };

  const loadEmailStats = async () => {
    try {
      const response = await fetch('/api/admin/email-stats');
      if (response.ok) {
        const data = await response.json();
        setEmailStats(data);
      } else {
        setMessage('Failed to load email statistics');
      }
    } catch (error) {
      console.error('Error loading email stats:', error);
      setMessage('Failed to load email statistics');
    } finally {
      setLoading(false);
    }
  };

  const sendTestEmail = async () => {
    setTestEmailLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testEmail),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ ${data.message}`);
        loadEmailStats(); // Reload stats
      } else {
        setMessage(`❌ ${data.error || 'Failed to send test email'}`);
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      setMessage('❌ Failed to send test email');
    } finally {
      setTestEmailLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout user={currentUser}>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Email Management</h1>
          <p>Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout user={currentUser}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Email Management</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Mail className="h-4 w-4" />
            Email System Dashboard
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg ${message.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}

        {/* Email Statistics Overview */}
        {emailStats && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Users</p>
                  <p className="text-2xl font-semibold text-gray-900">{emailStats.stats.totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Subscribed</p>
                  <p className="text-2xl font-semibold text-gray-900">{emailStats.stats.subscribedUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Recent Bounces</p>
                  <p className="text-2xl font-semibold text-gray-900">{emailStats.stats.recentBouncesCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Events</p>
                  <p className="text-2xl font-semibold text-gray-900">{emailStats.stats.totalEmailEvents}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Statistics */}
        {emailStats && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Statistics (Last 30 Days)</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Object.entries(emailStats.deliveryStats).map(([type, count]) => (
                <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                  <div className="text-sm text-gray-600 capitalize">{type.toLowerCase()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Email Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center mb-4">
            <Send className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Send Test Email</h2>
          </div>
          
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Type</label>
                <select
                  value={testEmail.type}
                  onChange={(e) => setTestEmail({ ...testEmail, type: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="welcome">Welcome Email</option>
                  <option value="event">Event Notification</option>
                  <option value="custom">Custom Email</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Email</label>
                <input
                  type="email"
                  value={testEmail.email}
                  onChange={(e) => setTestEmail({ ...testEmail, email: e.target.value })}
                  placeholder="test@example.com"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {testEmail.type === 'custom' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={testEmail.subject}
                    onChange={(e) => setTestEmail({ ...testEmail, subject: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">HTML Content (optional)</label>
                  <textarea
                    value={testEmail.html}
                    onChange={(e) => setTestEmail({ ...testEmail, html: e.target.value })}
                    placeholder="Leave empty for default test email content"
                    rows={6}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {testEmail.type === 'welcome' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User Name</label>
                <input
                  type="text"
                  value={testEmail.name}
                  onChange={(e) => setTestEmail({ ...testEmail, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {testEmail.type === 'event' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                  <input
                    type="text"
                    value={testEmail.eventTitle}
                    onChange={(e) => setTestEmail({ ...testEmail, eventTitle: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                  <input
                    type="text"
                    value={testEmail.schoolName}
                    onChange={(e) => setTestEmail({ ...testEmail, schoolName: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            <button
              onClick={sendTestEmail}
              disabled={!testEmail.email || testEmailLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {testEmailLoading ? 'Sending...' : 'Send Test Email'}
            </button>
          </div>
        </div>

        {/* Recent Email Events */}
        {emailStats && emailStats.recentEvents.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Email Events</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {emailStats.recentEvents.slice(0, 10).map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {event.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          event.eventType === 'DELIVERY' ? 'bg-green-100 text-green-800' :
                          event.eventType === 'BOUNCE' ? 'bg-red-100 text-red-800' :
                          event.eventType === 'COMPLAINT' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {event.eventType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(event.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {event.reason && (
                          <div className="max-w-xs truncate">{event.reason}</div>
                        )}
                        {event.bounceType && (
                          <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            {event.bounceType}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
              <div className="font-medium text-gray-900">Email Templates</div>
              <div className="text-sm text-gray-500">Manage email templates</div>
            </button>
            <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
              <div className="font-medium text-gray-900">Notification Settings</div>
              <div className="text-sm text-gray-500">Configure email notifications</div>
            </button>
            <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
              <div className="font-medium text-gray-900">Bulk Email</div>
              <div className="text-sm text-gray-500">Send emails to multiple users</div>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 