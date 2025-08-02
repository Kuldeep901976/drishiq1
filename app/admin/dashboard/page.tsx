'use client';

import {
    Button,
    Card,
    CardBody,
    Container,
    Grid,
    LoadingSpinner,
    Section
} from '@/components/ui/DrishiqUI';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface DashboardStats {
  total_support_credits: number;
  allocated_credits: number;
  used_credits: number;
  needy_individuals: number;
  pending_requests: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  status: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load overview stats
      const overviewResponse = await fetch('/api/admin/dashboard?action=overview');
      if (overviewResponse.ok) {
        const overviewData = await overviewResponse.json();
        if (overviewData.success) {
          const data = overviewData.data;
          setStats({
            total_support_credits: data.needySupport.totalSupportCredits,
            allocated_credits: data.needySupport.totalSupportCredits,
            used_credits: data.needySupport.usedSupportCredits,
            needy_individuals: data.needySupport.totalNeedy,
            pending_requests: data.needySupport.pendingRequests
          });
        }
      }

      // Load recent activity
      const activityResponse = await fetch('/api/admin/dashboard?action=recent-activity');
      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        if (activityData.success) {
          setRecentActivity(activityData.data || []);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Section>
          <LoadingSpinner />
        </Section>
      </Container>
    );
  }

  return (
    <Container>
      <Section>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#0B4422] mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage all aspects of the DrishiQ platform</p>
        </div>

        {/* Stats Overview */}
        <Grid cols={3} className="drishiq-mb-lg">
          <Card>
            <CardBody className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats?.needy_individuals || 0}</div>
              <div className="text-sm text-gray-500">Needy Individuals</div>
              <div className="text-xs text-gray-400">{stats?.pending_requests || 0} requests</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats?.total_support_credits || 0}</div>
              <div className="text-sm text-gray-500">Support Credits</div>
              <div className="text-xs text-gray-400">{stats?.used_credits || 0} used</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <div className="text-2xl font-bold text-blue-600">0</div>
              <div className="text-sm text-gray-500">Total Users</div>
              <div className="text-xs text-gray-400">0 active</div>
            </CardBody>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid cols={3} className="drishiq-mb-lg">
          <Card>
            <CardBody className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Invitation Management</h3>
              <p className="text-sm text-gray-600 mb-4">Manage and approve invitation requests</p>
              <Link href="/admin/invitations">
                <Button variant="primary" className="w-full">
                  Manage Invitations
                </Button>
              </Link>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Needy Support</h3>
              <p className="text-sm text-gray-600 mb-4">Manage support requests and credit allocation</p>
              <Link href="/admin/needy-support">
                <Button variant="primary" className="w-full">
                  Manage Support
                </Button>
              </Link>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Audit Logs</h3>
              <p className="text-sm text-gray-600 mb-4">Track all administrative actions and changes</p>
              <Link href="/admin/audit-logs">
                <Button variant="primary" className="w-full">
                  View Logs
                </Button>
              </Link>
            </CardBody>
          </Card>
        </Grid>

        {/* Additional Management Options */}
        <Grid cols={4} className="drishiq-mb-lg">
          <Card>
            <CardBody className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Stories</h4>
              <Link href="/admin/stories">
                <Button variant="secondary" size="sm" className="w-full">
                  Manage
                </Button>
              </Link>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Payments</h4>
              <Link href="/admin/payments">
                <Button variant="secondary" size="sm" className="w-full">
                  Manage
                </Button>
              </Link>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Analytics</h4>
              <Link href="/admin/analytics">
                <Button variant="secondary" size="sm" className="w-full">
                  View
                </Button>
              </Link>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Blog</h4>
              <Link href="/admin/blog-management">
                <Button variant="secondary" size="sm" className="w-full">
                  Manage
                </Button>
              </Link>
            </CardBody>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.status === 'pending' ? 'bg-yellow-400' :
                      activity.status === 'approved' ? 'bg-green-400' :
                      activity.status === 'rejected' ? 'bg-red-400' :
                      'bg-gray-400'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleDateString()} • {activity.type}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No recent activity</p>
              )}
            </div>
          </CardBody>
        </Card>
      </Section>
    </Container>
  );
} 