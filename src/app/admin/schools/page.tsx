'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { School, Search, MapPin, Users, Calendar, Edit, Trash2 } from 'lucide-react';

interface School {
  id: string;
  name: string;
  acara_id: string;
  address?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  phone?: string;
  email?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    events: number;
    children: number;
  };
}

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const router = useRouter();

  const australianStates = [
    'NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'
  ];

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadSchools();
    }
  }, [currentUser, search, selectedState]);

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

  const loadSchools = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedState) params.append('state', selectedState);
      params.append('limit', '50');

      const response = await fetch(`/api/schools/search?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setSchools(data.schools || []);
      } else {
        console.error('Failed to load schools:', response.status, await response.text());
        setSchools([]);
      }
    } catch (error) {
      console.error('Error loading schools:', error);
      setSchools([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteSchool = async (schoolId: string, schoolName: string) => {
    if (!confirm(`Are you sure you want to delete "${schoolName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/schools/${schoolId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadSchools();
      } else if (response.status === 403) {
        alert('You do not have permission to delete schools. Admin access required.');
        router.push('/dashboard');
      } else {
        alert('Failed to delete school. It may have associated events or children.');
      }
    } catch (error) {
      console.error('Error deleting school:', error);
      alert('Failed to delete school.');
    }
  };

  return (
    <AdminLayout user={currentUser}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <School className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Schools Management</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {schools.length} schools
            </span>
            <button
              onClick={() => router.push('/admin/schools/add')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add School
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search schools by name, city, or postcode..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All States</option>
              {australianStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Schools Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {schools.map((school) => (
            <div key={school.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {school.name}
                    </h3>
                    
                    {(school.suburb || school.state) && (
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        {[school.suburb, school.state].filter(Boolean).join(', ')}
                        {school.postcode && ` ${school.postcode}`}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {school._count.events} events
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {school._count.children} children
                      </div>
                    </div>


                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    Added {new Date(school.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/admin/schools/${school.id}/edit`)}
                      className="p-2 text-gray-400 hover:text-blue-600"
                      title="Edit school"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteSchool(school.id, school.name)}
                      className="p-2 text-gray-400 hover:text-red-600"
                      title="Delete school"
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
            <p className="text-gray-500">Loading schools...</p>
          </div>
        )}

        {!loading && schools.length === 0 && (
          <div className="text-center py-12">
            <School className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No schools found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {search || selectedState 
                ? 'Try adjusting your search criteria.' 
                : 'Get started by adding your first school.'
              }
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/admin/schools/add')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add School
              </button>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <School className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Schools</p>
                <p className="text-2xl font-semibold text-gray-900">{schools.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Events</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {schools.reduce((sum, school) => sum + school._count.events, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Children</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {schools.reduce((sum, school) => sum + school._count.children, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">States Covered</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {new Set(schools.map(s => s.state).filter(Boolean)).size}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 