'use client';

// Header and Footer components will be added here
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface AdminStats {
  totalInvitations: number;
  pendingInvitations: number;
  approvedInvitations: number;
  totalStories: number;
  pendingStories: number;
  approvedStories: number;
  totalUsers: number;
  activeUsers: number;
  todaySignups: number;
  todayInvitations: number;
}

interface AdminUser {
  isAdmin: boolean;
  role?: string;
  permissions?: string[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalInvitations: 0,
    pendingInvitations: 0,
    approvedInvitations: 0,
    totalStories: 0,
    pendingStories: 0,
    approvedStories: 0,
    activeUsers: 0,
    todaySignups: 0,
    todayInvitations: 0
  });
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  const checkAdminAccess = useCallback(async () => {
    try {
      if (!supabase) {
        setError('Database service unavailable');
        setLoading(false);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/signin');
        return;
      }

      // Check if user is admin by trying to access admin data
      const response = await fetch('/api/admin/stats');
      
      if (response.status === 403) {
        setError('You do not have admin access');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load admin data');
      }

      const result = await response.json();
      setStats(result.data);
      setAdminUser({ isAdmin: true });
      setLoading(false);
    } catch (error) {
      logger.error('Failed to check admin access');
      setError('Failed to load admin dashboard');
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAdminAccess();
  }, [checkAdminAccess]);

  const StatCard = ({ title, value, subtitle, color = 'bg-blue-500' }: {
    title: string;
    value: number;
    subtitle?: string;
    color?: string;
  }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-l-blue-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center`}>
          <span className="text-white text-xl font-bold">{value.toString().charAt(0)}</span>
        </div>
      </div>
    </div>
  );

  const QuickActionCard = ({ title, description, href, color = 'bg-green-500' }: {
    title: string;
    description: string;
    href: string;
    color?: string;
  }) => (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
         onClick={() => router.push(href)}>
      <div className="flex items-center space-x-4">
        <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center`}>
          <span className="text-white text-xl">⚡</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header will be added here */}
        <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
          </div>
        </main>
        {/* Footer will be added here */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header will be added here */}
        <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md mx-auto">
              <p className="font-bold">Access Denied</p>
              <p className="text-sm">{error}</p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              Go to Dashboard
            </button>
          </div>
        </main>
        {/* Footer will be added here */}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header will be added here */}
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Welcome to DrishiQ Admin Panel. Manage invitations, stories, and users.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Invitations" 
            value={stats?.totalInvitations || 0}
            subtitle={`${stats?.pendingInvitations || 0} pending`}
            color="bg-blue-500"
          />
          <StatCard 
            title="Total Stories" 
            value={stats?.totalStories || 0}
            subtitle={`${stats?.pendingStories || 0} pending review`}
            color="bg-green-500"
          />
          <StatCard 
            title="Total Users" 
            value={stats?.totalUsers || 0}
            subtitle={`${stats?.activeUsers || 0} active`}
            color="bg-purple-500"
          />
          <StatCard 
            title="Today's Activity" 
            value={stats?.todaySignups || 0}
            subtitle={`${stats?.todayInvitations || 0} new invitations`}
            color="bg-orange-500"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <QuickActionCard
              title="Manage Invitations"
              description="Review and approve invitation requests"
              href="/admin/invitations"
              color="bg-blue-500"
            />
            <QuickActionCard
              title="Review Stories"
              description="Moderate and publish user stories"
              href="/admin/stories"
              color="bg-green-500"
            />
            <QuickActionCard
              title="Pricing Management"
              description="Set regional rates and credit packages"
              href="/admin/pricing"
              color="bg-yellow-500"
            />
            <QuickActionCard
              title="Manage Users"
              description="View and manage user accounts"
              href="/admin/users"
              color="bg-purple-500"
            />
            <QuickActionCard
              title="System Settings"
              description="Configure platform settings"
              href="/admin/settings"
              color="bg-orange-500"
            />
            <QuickActionCard
              title="Admin Logs"
              description="View admin activity logs"
              href="/admin/logs"
              color="bg-red-500"
            />
            <QuickActionCard
              title="Analytics"
              description="View detailed analytics"
              href="/admin/analytics"
              color="bg-indigo-500"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">📧</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">New invitation requests</p>
                <p className="text-xs text-gray-500">{stats?.pendingInvitations || 0} pending review</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">📝</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Story submissions</p>
                <p className="text-xs text-gray-500">{stats?.pendingStories || 0} waiting for review</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">👥</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">User registrations</p>
                <p className="text-xs text-gray-500">{stats?.todaySignups || 0} new users today</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer will be added here */}
    </div>
  );
} 