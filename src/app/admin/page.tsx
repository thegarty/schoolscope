'use client';

import { useState, useEffect } from 'react';

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

export default function AdminDashboard() {
  const [emailStats, setEmailStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [message, setMessage] = useState('');

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
    loadEmailStats();
  }, []);

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
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
          Admin Panel
        </span>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      {/* Email Statistics */}
      {emailStats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Email Statistics</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold">{emailStats.stats.totalUsers}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{emailStats.stats.subscribedUsers}</div>
              <div className="text-sm text-gray-600">Subscribed Users</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{emailStats.stats.recentBouncesCount}</div>
              <div className="text-sm text-gray-600">Recent Bounces</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{emailStats.stats.recentComplaintsCount}</div>
              <div className="text-sm text-gray-600">Recent Complaints</div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Delivery Statistics (Last 30 Days)</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Object.entries(emailStats.deliveryStats).map(([type, count]) => (
                <div key={type} className="text-center bg-gray-50 p-3 rounded">
                  <div className="text-xl font-bold">{count}</div>
                  <div className="text-sm text-gray-600">{type}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Test Email Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Send Test Email</h2>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Email Type</label>
              <select
                value={testEmail.type}
                onChange={(e) => setTestEmail({ ...testEmail, type: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="welcome">Welcome Email</option>
                <option value="event">Event Notification</option>
                <option value="custom">Custom Email</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Recipient Email</label>
              <input
                type="email"
                value={testEmail.email}
                onChange={(e) => setTestEmail({ ...testEmail, email: e.target.value })}
                placeholder="test@example.com"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          {testEmail.type === 'custom' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <input
                  type="text"
                  value={testEmail.subject}
                  onChange={(e) => setTestEmail({ ...testEmail, subject: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">HTML Content (optional)</label>
                <textarea
                  value={testEmail.html}
                  onChange={(e) => setTestEmail({ ...testEmail, html: e.target.value })}
                  placeholder="Leave empty for default test email content"
                  rows={6}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          )}

          {testEmail.type === 'welcome' && (
            <div>
              <label className="block text-sm font-medium mb-1">User Name</label>
              <input
                type="text"
                value={testEmail.name}
                onChange={(e) => setTestEmail({ ...testEmail, name: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          )}

          {testEmail.type === 'event' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">Event Title</label>
                <input
                  type="text"
                  value={testEmail.eventTitle}
                  onChange={(e) => setTestEmail({ ...testEmail, eventTitle: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">School Name</label>
                <input
                  type="text"
                  value={testEmail.schoolName}
                  onChange={(e) => setTestEmail({ ...testEmail, schoolName: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          )}

          <button
            onClick={sendTestEmail}
            disabled={!testEmail.email || testEmailLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {testEmailLoading ? 'Sending...' : 'Send Test Email'}
          </button>
        </div>
      </div>

      {/* Recent Email Events */}
      {emailStats && emailStats.recentEvents.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Email Events</h2>
          <div className="space-y-3">
            {emailStats.recentEvents.slice(0, 10).map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{event.email}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(event.timestamp).toLocaleString()}
                  </div>
                  {event.reason && (
                    <div className="text-xs text-gray-500">{event.reason}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      event.eventType === 'DELIVERY' ? 'bg-green-100 text-green-800' :
                      event.eventType === 'BOUNCE' ? 'bg-red-100 text-red-800' :
                      event.eventType === 'COMPLAINT' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {event.eventType}
                  </span>
                  {event.bounceType && (
                    <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                      {event.bounceType}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="space-y-2 text-sm">
          <p><strong>View detailed email stats:</strong> <code>GET /api/admin/email-stats</code></p>
          <p><strong>Manage users:</strong> <code>GET /api/admin/users</code></p>
          <p><strong>SNS Webhook endpoint:</strong> <code>POST /api/webhooks/sns</code></p>
          <p><strong>Unsubscribe page:</strong> <code>GET /api/email/unsubscribe</code></p>
        </div>
      </div>
    </div>
  );
} 