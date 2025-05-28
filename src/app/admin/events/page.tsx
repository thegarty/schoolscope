'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  Calendar, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  CheckCircle, 
  XCircle,
  Clock,
  MapPin,
  Users,
  School
} from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  yearLevels: string[];
  category: string;
  confirmed: boolean;
  isPrivate: boolean;
  location?: string;
  childId?: string;
  schoolId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  school: {
    name: string;
    suburb?: string;
    state?: string;
  };
  user: {
    name?: string;
    email: string;
  };
  child?: {
    name: string;
  };
  _count: {
    confirmations: number;
  };
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const router = useRouter();

  const categories = [
    'Academic', 'Sports', 'Arts', 'Social', 'Fundraising', 'Meeting', 'Other'
  ];

  const statusOptions = [
    { value: '', label: 'All Events' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'pending', label: 'Pending Approval' },
    { value: 'private', label: 'Private Events' },
    { value: 'public', label: 'Public Events' },
  ];

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadEvents();
    }
  }, [currentUser, search, categoryFilter, statusFilter, schoolFilter]);

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

  const loadEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);
      if (statusFilter) {
        if (statusFilter === 'confirmed') params.append('confirmed', 'true');
        if (statusFilter === 'pending') params.append('confirmed', 'false');
        if (statusFilter === 'private') params.append('isPrivate', 'true');
        if (statusFilter === 'public') params.append('isPrivate', 'false');
      }
      if (schoolFilter) params.append('schoolId', schoolFilter);
      params.append('limit', '50');

      const response = await fetch(`/api/admin/events?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      } else {
        console.error('Failed to load events:', response.status);
        setEvents([]);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleEventConfirmation = async (eventId: string, confirmed: boolean) => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed: !confirmed }),
      });

      if (response.ok) {
        loadEvents();
      } else if (response.status === 403) {
        alert('You do not have permission to modify events. Admin access required.');
      } else {
        alert('Failed to update event status.');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Failed to update event status.');
    }
  };

  const deleteEvent = async (eventId: string, eventTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadEvents();
      } else if (response.status === 403) {
        alert('You do not have permission to delete events. Admin access required.');
      } else {
        alert('Failed to delete event.');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event.');
    }
  };

  const getStatusBadge = (event: Event) => {
    if (!event.confirmed) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3" />
          Pending
        </span>
      );
    }
    if (event.isPrivate) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <Eye className="h-3 w-3" />
          Private
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3" />
        Public
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AdminLayout user={currentUser}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">Events Management</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {events.length} events
            </span>
            <button
              onClick={() => router.push('/admin/events/create')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Event
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearch('');
                  setCategoryFilter('');
                  setStatusFilter('');
                  setSchoolFilter('');
                }}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {event.title}
                      </h3>
                      {getStatusBadge(event)}
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {event.category}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                    
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(event.startDate)}
                        {event.startDate !== event.endDate && ` - ${formatDate(event.endDate)}`}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatTime(event.startDate)}
                      </div>
                      <div className="flex items-center gap-1">
                        <School className="h-4 w-4" />
                        {event.school.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {event._count.confirmations} confirmations
                      </div>
                    </div>

                    {event.location && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                        <MapPin className="h-4 w-4" />
                        {event.location}
                      </div>
                    )}

                    {event.yearLevels.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm text-gray-500">Year Levels:</span>
                        <div className="flex gap-1">
                          {event.yearLevels.map((level) => (
                            <span key={level} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                              {level}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-4">
                  <div className="text-xs text-gray-500">
                    Created by {event.user.name || event.user.email} on {formatDate(event.createdAt)}
                  </div>
                  <div className="flex items-center gap-2">
                    {!event.confirmed && (
                      <button
                        onClick={() => toggleEventConfirmation(event.id, event.confirmed)}
                        className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                        title="Approve event"
                      >
                        <CheckCircle className="h-3 w-3 inline mr-1" />
                        Approve
                      </button>
                    )}
                    {event.confirmed && (
                      <button
                        onClick={() => toggleEventConfirmation(event.id, event.confirmed)}
                        className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                        title="Mark as pending"
                      >
                        <Clock className="h-3 w-3 inline mr-1" />
                        Mark Pending
                      </button>
                    )}
                    <button
                      onClick={() => router.push(`/events/${event.id}`)}
                      className="p-2 text-gray-400 hover:text-blue-600"
                      title="View event"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteEvent(event.id, event.title)}
                      className="p-2 text-gray-400 hover:text-red-600"
                      title="Delete event"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading events...</p>
          </div>
        )}

        {!loading && events.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {search || categoryFilter || statusFilter 
                ? 'Try adjusting your search criteria.' 
                : 'Get started by creating your first event.'
              }
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/admin/events/create')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Create Event
              </button>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Events</p>
                <p className="text-2xl font-semibold text-gray-900">{events.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Confirmed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {events.filter(e => e.confirmed).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {events.filter(e => !e.confirmed).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Confirmations</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {events.reduce((sum, event) => sum + event._count.confirmations, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 