'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  Users, 
  School, 
  Calendar, 
  Mail, 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  UserCheck, 
  UserX,
  Plus,
  Settings,
  BarChart3,
  Activity,
  MapPin,
  Send,
  FileText,
  Database
} from 'lucide-react';

interface DashboardStats {
  users: {
    total: number;
    admins: number;
    subscribed: number;
    unsubscribed: number;
    recentSignups: number;
  };
  schools: {
    total: number;
    byState: Record<string, number>;
    recentlyAdded: number;
  };
  events: {
    total: number;
    pending: number;
    thisMonth: number;
  };
  email: {
    totalEvents: number;
    deliveries: number;
    bounces: number;
    complaints: number;
    recentActivity: Array<{
      id: string;
      email: string;
      eventType: string;
      timestamp: string;
    }>;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

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
      
      // Load dashboard stats
      await loadDashboardStats();
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardStats = async () => {
    try {
      // Load all stats in parallel
      const [usersResponse, emailResponse, schoolsResponse] = await Promise.all([
        fetch('/api/admin/users?limit=1000'),
        fetch('/api/admin/email-stats'),
        fetch('/api/schools/search?limit=1000')
      ]);

      const usersData = usersResponse.ok ? await usersResponse.json() : null;
      const emailData = emailResponse.ok ? await emailResponse.json() : null;
      const schoolsData = schoolsResponse.ok ? await schoolsResponse.json() : null;

      // Process user stats
      const users = usersData?.users || [];
      const userStats = {
        total: users.length,
        admins: users.filter((u: any) => u.isAdmin).length,
        subscribed: users.filter((u: any) => u.emailSubscribed).length,
        unsubscribed: users.filter((u: any) => !u.emailSubscribed).length,
        recentSignups: users.filter((u: any) => {
          const createdAt = new Date(u.createdAt);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return createdAt > weekAgo;
        }).length,
      };

      // Process school stats
      const schools = schoolsData?.schools || [];
      const schoolsByState: Record<string, number> = {};
      schools.forEach((school: any) => {
        if (school.state) {
          schoolsByState[school.state] = (schoolsByState[school.state] || 0) + 1;
        }
      });

      const schoolStats = {
        total: schools.length,
        byState: schoolsByState,
        recentlyAdded: schools.filter((s: any) => {
          const createdAt = new Date(s.createdAt);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return createdAt > weekAgo;
        }).length,
      };

      // Process email stats
      const emailStats = emailData?.stats || {};
      const emailEvents = emailData?.recentEvents || [];
      const deliveryStats = emailData?.deliveryStats || {};

      const processedStats: DashboardStats = {
        users: userStats,
        schools: schoolStats,
        events: {
          total: 0, // Would need events API
          pending: 0,
          thisMonth: 0,
        },
        email: {
          totalEvents: emailStats.totalEmailEvents || 0,
          deliveries: deliveryStats.DELIVERY || 0,
          bounces: deliveryStats.BOUNCE || 0,
          complaints: deliveryStats.COMPLAINT || 0,
          recentActivity: emailEvents.slice(0, 5),
        },
      };

      setStats(processedStats);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  if (loading) {
    return (
      <AdminLayout user={currentUser}>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout user={currentUser}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {currentUser?.name || 'Admin'}. Here's what's happening with SchoolScope.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              System Online
            </span>
            <span className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.users.total || 0}</p>
                <p className="text-xs text-green-600">
                  +{stats?.users.recentSignups || 0} this week
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <School className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Schools</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.schools.total || 0}</p>
                <p className="text-xs text-green-600">
                  +{stats?.schools.recentlyAdded || 0} this week
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Mail className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Email Events</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.email.totalEvents || 0}</p>
                <p className="text-xs text-blue-600">
                  {stats?.email.deliveries || 0} delivered
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Shield className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Admin Users</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.users.admins || 0}</p>
                <p className="text-xs text-gray-600">
                  {((stats?.users.admins || 0) / (stats?.users.total || 1) * 100).toFixed(1)}% of users
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/admin/users"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Users className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Manage Users</h3>
                  <p className="text-sm text-gray-500">View and edit user accounts</p>
                </div>
              </Link>

              <Link
                href="/admin/schools/add"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Plus className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Add School</h3>
                  <p className="text-sm text-gray-500">Register a new school</p>
                </div>
              </Link>

              <Link
                href="/admin/email/test"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Send className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Test Email</h3>
                  <p className="text-sm text-gray-500">Send test emails</p>
                </div>
              </Link>

              <Link
                href="/admin/system/settings"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Settings className="h-8 w-8 text-gray-600 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Settings</h3>
                  <p className="text-sm text-gray-500">System configuration</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Detailed Stats Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* User Statistics */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">User Statistics</h2>
                <Link href="/admin/users" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View All →
                </Link>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <UserCheck className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium">Email Subscribed</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold">{stats?.users.subscribed || 0}</span>
                    <span className="text-sm text-gray-500 ml-1">
                      ({((stats?.users.subscribed || 0) / (stats?.users.total || 1) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <UserX className="h-5 w-5 text-red-600 mr-2" />
                    <span className="text-sm font-medium">Unsubscribed</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold">{stats?.users.unsubscribed || 0}</span>
                    <span className="text-sm text-gray-500 ml-1">
                      ({((stats?.users.unsubscribed || 0) / (stats?.users.total || 1) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-purple-600 mr-2" />
                    <span className="text-sm font-medium">Admin Users</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold">{stats?.users.admins || 0}</span>
                    <Link href="/admin/users/admins" className="text-blue-600 hover:text-blue-700 text-sm ml-2">
                      Manage
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Email System Health */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Email System Health</h2>
                <Link href="/admin/email" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View Details →
                </Link>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium">Successful Deliveries</span>
                  </div>
                  <span className="text-lg font-semibold text-green-600">{stats?.email.deliveries || 0}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
                    <span className="text-sm font-medium">Bounces</span>
                  </div>
                  <span className="text-lg font-semibold text-orange-600">{stats?.email.bounces || 0}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                    <span className="text-sm font-medium">Complaints</span>
                  </div>
                  <span className="text-lg font-semibold text-red-600">{stats?.email.complaints || 0}</span>
                </div>

                {stats?.email.bounces || stats?.email.complaints ? (
                  <Link 
                    href="/admin/users/banned"
                    className="block w-full text-center py-2 px-4 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors text-sm font-medium"
                  >
                    Review Problematic Emails
                  </Link>
                ) : (
                  <div className="text-center py-2 px-4 bg-green-50 text-green-700 rounded-md text-sm">
                    ✅ No email issues detected
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Schools by State & Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Schools by State */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Schools by State</h2>
                <Link href="/admin/schools" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Manage Schools →
                </Link>
              </div>
            </div>
            <div className="p-6">
              {stats?.schools.byState && Object.keys(stats.schools.byState).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(stats.schools.byState)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 6)
                    .map(([state, count]) => (
                    <div key={state} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium">{state}</span>
                      </div>
                      <span className="text-lg font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <School className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No schools registered yet</p>
                  <Link 
                    href="/admin/schools/add"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Add the first school
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Email Activity */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Email Activity</h2>
                <Link href="/admin/email" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View All →
                </Link>
              </div>
            </div>
            <div className="p-6">
              {stats?.email.recentActivity && stats.email.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {stats.email.recentActivity.map((event) => (
                    <div key={event.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center min-w-0 flex-1">
                        <div className={`w-2 h-2 rounded-full mr-3 ${
                          event.eventType === 'DELIVERY' ? 'bg-green-500' :
                          event.eventType === 'BOUNCE' ? 'bg-orange-500' :
                          event.eventType === 'COMPLAINT' ? 'bg-red-500' :
                          'bg-gray-500'
                        }`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{event.email}</p>
                          <p className="text-xs text-gray-500">{event.eventType}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 ml-2">
                        {new Date(event.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No recent email activity</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
          </div>
          <div className="p-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium">Database</p>
                  <p className="text-xs text-gray-500">Connected</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium">Email Service</p>
                  <p className="text-xs text-gray-500">AWS SES Active</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium">Notifications</p>
                  <p className="text-xs text-gray-500">SNS Connected</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium">Admin Panel</p>
                  <p className="text-xs text-gray-500">Operational</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 