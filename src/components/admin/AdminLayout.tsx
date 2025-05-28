'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  Users, 
  School, 
  Calendar, 
  Mail, 
  Settings, 
  ChevronDown, 
  ChevronRight,
  Home,
  UserCheck,
  UserX,
  Shield,
  Database,
  FileText,
  TrendingUp,
  MessageSquare,
  Bell,
  Trash2,
  Edit,
  Plus
} from 'lucide-react';
import React from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
  user: any;
}

interface MenuItem {
  title: string;
  href?: string;
  icon: React.ComponentType<any>;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: BarChart3,
  },
  {
    title: 'Users',
    icon: Users,
    children: [
      { title: 'All Users', href: '/admin/users', icon: Users },
      { title: 'Admins', href: '/admin/users/admins', icon: Shield },
      { title: 'Subscriptions', href: '/admin/users/subscriptions', icon: UserCheck },
      { title: 'Banned Users', href: '/admin/users/banned', icon: UserX },
    ],
  },
  {
    title: 'Schools',
    icon: School,
    children: [
      { title: 'All Schools', href: '/admin/schools', icon: School },
      { title: 'School Edits', href: '/admin/schools/edits', icon: Edit },
      { title: 'Add School', href: '/admin/schools/add', icon: Plus },
      { title: 'Import Data', href: '/admin/schools/import', icon: Database },
    ],
  },
  {
    title: 'Events',
    icon: Calendar,
    children: [
      { title: 'All Events', href: '/admin/events', icon: Calendar },
      { title: 'Pending Events', href: '/admin/events/pending', icon: FileText },
      { title: 'Event Analytics', href: '/admin/events/analytics', icon: TrendingUp },
      { title: 'Create Event', href: '/admin/events/create', icon: Plus },
    ],
  },
  {
    title: 'Email System',
    icon: Mail,
    children: [
      { title: 'Email Stats', href: '/admin/email', icon: BarChart3 },
      { title: 'Test Email', href: '/admin/email/test', icon: MessageSquare },
      { title: 'Templates', href: '/admin/email/templates', icon: FileText },
      { title: 'Notifications', href: '/admin/email/notifications', icon: Bell },
    ],
  },
  {
    title: 'System',
    icon: Settings,
    children: [
      { title: 'Settings', href: '/admin/system/settings', icon: Settings },
      { title: 'Logs', href: '/admin/system/logs', icon: FileText },
      { title: 'Maintenance', href: '/admin/system/maintenance', icon: Trash2 },
      { title: 'Database', href: '/admin/system/database', icon: Database },
    ],
  },
];

function MenuItem({ item, level = 0 }: { item: MenuItem; level?: number }) {
  const pathname = usePathname();
  const isActive = item.href === pathname;
  const hasChildren = item.children && item.children.length > 0;
  
  // Check if any child is active to keep parent menu open
  const hasActiveChild = hasChildren && item.children!.some(child => 
    child.href === pathname
  );
  
  const [isOpen, setIsOpen] = useState(hasActiveChild);
  
  // Update isOpen when pathname changes and this item has an active child
  React.useEffect(() => {
    if (hasActiveChild) {
      setIsOpen(true);
    }
  }, [hasActiveChild]);

  const handleClick = () => {
    if (hasChildren) {
      setIsOpen(!isOpen);
    }
  };

  const Icon = item.icon;

  return (
    <div className="mb-1">
      {item.href ? (
        <Link
          href={item.href}
          className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            isActive
              ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-600'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          } ${level > 0 ? 'ml-6 pl-8' : ''}`}
        >
          <Icon className={`mr-3 h-4 w-4 ${level > 0 ? 'h-3 w-3' : ''}`} />
          {item.title}
        </Link>
      ) : (
        <button
          onClick={handleClick}
          className={`flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            hasActiveChild 
              ? 'text-blue-700 bg-blue-50' 
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          } ${level > 0 ? 'ml-6 pl-8' : ''}`}
        >
          <Icon className={`mr-3 h-4 w-4 ${level > 0 ? 'h-3 w-3' : ''}`} />
          <span className="flex-1 text-left">{item.title}</span>
          {hasChildren && (
            <span className="ml-2">
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
            </span>
          )}
        </button>
      )}

      {hasChildren && isOpen && (
        <div className="mt-1 space-y-1">
          {item.children!.map((child, index) => (
            <MenuItem key={index} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminLayout({ children, user }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-center h-16 px-4 bg-blue-600 flex-shrink-0">
          <Link href="/admin" className="flex items-center">
            <School className="h-8 w-8 text-white mr-2" />
            <span className="text-xl font-bold text-white">Admin Panel</span>
          </Link>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {menuItems.map((item, index) => (
            <MenuItem key={index} item={item} />
          ))}
        </nav>

        {/* User Info - Fixed at bottom */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.name?.[0] || user?.email?.[0] || 'A'}
                </span>
              </div>
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-700 truncate">
                {user?.name || 'Admin'}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="mt-3 flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Home className="h-4 w-4 mr-2" />
            Back to App
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        <main className="py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 