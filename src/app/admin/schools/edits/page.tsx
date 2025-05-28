'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { Edit, School, Check, X, Eye, Clock, User } from 'lucide-react';

interface SchoolEdit {
  id: string;
  schoolId: string;
  userId: string;
  field: string;
  oldValue?: string;
  newValue: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string;
    email: string;
  };
  school: {
    name: string;
    suburb?: string;
    state?: string;
  };
}

export default function SchoolEditsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [edits, setEdits] = useState<SchoolEdit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const router = useRouter();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadSchoolEdits();
    }
  }, [currentUser, filter]);

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

  const loadSchoolEdits = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'ALL') params.append('status', filter);
      
      const response = await fetch(`/api/admin/schools/edits?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEdits(data.edits || []);
      } else {
        console.error('Failed to load school edits');
        setEdits([]);
      }
    } catch (error) {
      console.error('Error loading school edits:', error);
      setEdits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditAction = async (editId: string, action: 'APPROVED' | 'REJECTED', reason?: string) => {
    try {
      const response = await fetch(`/api/admin/schools/edits/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action, reason }),
      });

      if (response.ok) {
        loadSchoolEdits();
      } else {
        alert(`Failed to ${action.toLowerCase()} edit request`);
      }
    } catch (error) {
      console.error(`Error ${action.toLowerCase()} edit:`, error);
      alert(`Failed to ${action.toLowerCase()} edit request`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'APPROVED': return <Check className="h-4 w-4" />;
      case 'REJECTED': return <X className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  return (
    <AdminLayout user={currentUser}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Edit className="h-6 w-6 text-orange-600" />
            <h1 className="text-2xl font-bold text-gray-900">School Edit Requests</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {edits.length} {filter === 'ALL' ? 'total' : filter.toLowerCase()} requests
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex gap-2">
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'ALL' ? 'All Requests' : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Edit Requests */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading edit requests...</p>
          </div>
        ) : edits.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <School className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'PENDING' ? 'No Pending Edit Requests' : `No ${filter.charAt(0) + filter.slice(1).toLowerCase()} Requests`}
            </h3>
            <p className="text-gray-500">
              {filter === 'PENDING' 
                ? 'All school edit requests have been reviewed.'
                : `There are no ${filter.toLowerCase()} school edit requests.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {edits.map((edit) => (
              <div key={edit.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {edit.school.name}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(edit.status)}`}>
                          {getStatusIcon(edit.status)}
                          {edit.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {edit.user.name} ({edit.user.email})
                        </div>
                        <div>
                          Submitted {new Date(edit.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Changes Preview */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Proposed Changes:</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex">
                            <span className="font-medium text-gray-700 w-20 capitalize">{edit.field}:</span>
                            <div className="flex-1">
                              {edit.oldValue && (
                                <div className="text-red-600 line-through">{edit.oldValue}</div>
                              )}
                              <div className="text-green-600">{edit.newValue}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {edit.reason && (
                        <div className="bg-blue-50 rounded-lg p-3 mb-4">
                          <h4 className="text-sm font-medium text-blue-900 mb-1">Reason for Edit:</h4>
                          <p className="text-sm text-blue-800">{edit.reason}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {edit.status === 'PENDING' && (
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleEditAction(edit.id, 'REJECTED')}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </button>
                      <button
                        onClick={() => handleEditAction(edit.id, 'APPROVED')}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Approve
                      </button>
                    </div>
                  )}

                  {edit.status !== 'PENDING' && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500">
                        {edit.status === 'APPROVED' ? 'Approved' : 'Rejected'} on {new Date(edit.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {edits.filter(e => e.status === 'PENDING').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Check className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Approved</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {edits.filter(e => e.status === 'APPROVED').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <X className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Rejected</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {edits.filter(e => e.status === 'REJECTED').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Edit className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Requests</p>
                <p className="text-2xl font-semibold text-gray-900">{edits.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 