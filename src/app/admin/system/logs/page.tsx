'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { FileText, Activity } from 'lucide-react';

export default function SystemLogsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);

  return (
    <AdminLayout user={currentUser}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
        </div>

        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">System Activity Logs</h3>
          <p className="text-gray-500">
            This page will show system logs and activity monitoring.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
} 