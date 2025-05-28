'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import { Settings, Cog } from 'lucide-react';
import { useAdminAccess } from '@/lib/admin-hooks';

export default function SystemSettingsPage() {
  const { currentUser, loading } = useAdminAccess();

  if (loading) {
    return (
      <AdminLayout user={currentUser}>
        <div className="p-6">
          <p>Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout user={currentUser}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        </div>

        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Cog className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">System Configuration</h3>
          <p className="text-gray-500">
            This page will provide system-wide configuration options.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
} 