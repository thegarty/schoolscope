'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { UserX, Search, AlertTriangle, Mail, Ban } from 'lucide-react';

interface BannedEmail {
  id: string;
  email: string;
  eventType: string;
  reason?: string;
  bounceType?: string;
  timestamp: string;
  userId?: string;
  user?: {
    id: string;
    name: string | null;
    emailSubscribed: boolean;
  };
}

export default function BannedUsersPage() {
  const [bannedEmails, setBannedEmails] = useState<BannedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadBannedEmails();
    }
  }, [currentUser, search]);

  const checkAdminAccess = async () => {
    try {
      const userResponse = await fetch('/api/auth/me');
      if (!userResponse.ok) {
        router.push('/login');
        return;
      }
      const userData = await userResponse.json();
      setCurrentUser(userData.user);
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.push('/login');
    }
  };

  const loadBannedEmails = async () => {
    try {
      setLoading(true);
      // Get bounced and complaint emails from email events
      const response = await fetch('/api/admin/email-stats');
      if (response.ok) {
        const data = await response.json();
        // Filter for bounces and complaints
        const problematicEvents = data.recentEvents.filter((event: any) => 
          event.eventType === 'BOUNCE' || event.eventType === 'COMPLAINT'
        );
        setBannedEmails(problematicEvents);
      }
    } catch (error) {
      console.error('Error loading banned emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const unbanEmail = async (email: string) => {
    if (!confirm(`Are you sure you want to unban ${email}? This will allow them to receive emails again.`)) {
      return;
    }

    try {
      // Find user by email and re-subscribe them
      const usersResponse = await fetch(`/api/admin/users?search=${encodeURIComponent(email)}&limit=1`);
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        if (usersData.users && usersData.users.length > 0) {
          const user = usersData.users[0];
          const response = await fetch('/api/admin/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              userId: user.id, 
              updates: { emailSubscribed: true } 
            }),
          });

          if (response.ok) {
            loadBannedEmails();
            alert('User has been unbanned and resubscribed to emails.');
          } else {
            alert('Failed to unban user.');
          }
        } else {
          alert('User not found in the system.');
        }
      }
    } catch (error) {
      console.error('Error unbanning email:', error);
      alert('Failed to unban user.');
    }
  };

  const filteredEmails = bannedEmails.filter(email =>
    email.email.toLowerCase().includes(search.toLowerCase()) ||
    email.reason?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout user={currentUser}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Ban className="h-6 w-6 text-red-600" />
            <h1 className="text-2xl font-bold text-gray-900">Banned Users</h1>
          </div>
          <div className="text-sm text-gray-500">
            {filteredEmails.length} problematic emails
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                About Banned Users
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  This page shows email addresses that have bounced or complained. These users are automatically 
                  unsubscribed to maintain good email reputation. You can manually re-enable them if needed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by email or reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Banned Emails Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmails.map((emailEvent) => (
                <tr key={emailEvent.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center">
                          <Mail className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {emailEvent.email}
                        </div>
                        {emailEvent.user && (
                          <div className="text-sm text-gray-500">
                            {emailEvent.user.name || 'No name'}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        emailEvent.eventType === 'BOUNCE' 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {emailEvent.eventType === 'BOUNCE' ? (
                          <AlertTriangle className="w-3 h-3 mr-1" />
                        ) : (
                          <Ban className="w-3 h-3 mr-1" />
                        )}
                        {emailEvent.eventType}
                      </span>
                      {emailEvent.bounceType && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {emailEvent.bounceType}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="max-w-xs">
                      {emailEvent.reason || 'No reason provided'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(emailEvent.timestamp).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => unbanEmail(emailEvent.email)}
                      className="px-3 py-1 text-xs rounded bg-green-100 text-green-700 hover:bg-green-200"
                    >
                      Unban & Resubscribe
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {loading && (
            <div className="p-8 text-center">
              <p className="text-gray-500">Loading banned emails...</p>
            </div>
          )}

          {!loading && filteredEmails.length === 0 && (
            <div className="p-8 text-center">
              <Ban className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {search ? 'No matching banned emails' : 'No banned emails found'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {search 
                  ? 'Try adjusting your search terms.' 
                  : 'Great! No users have been banned due to email issues.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Bounces</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {bannedEmails.filter(e => e.eventType === 'BOUNCE').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Ban className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Complaints</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {bannedEmails.filter(e => e.eventType === 'COMPLAINT').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <UserX className="h-8 w-8 text-gray-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Unique Emails</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {new Set(bannedEmails.map(e => e.email)).size}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 