'use client';

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui/index';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';

interface SessionTemplate {
  id: string;
  name: string;
  type: string;
  duration_minutes: number;
  credit_cost: number;
  description: string;
  is_active: boolean;
  created_at: string;
}

interface UserSession {
  id: string;
  user_id: string;
  title: string;
  session_type: string;
  status: string;
  duration_minutes: number;
  actual_duration_minutes?: number;
  credits_deducted: number;
  credits_refunded: number;
  net_credits: number;
  created_at: string;
  users?: {
    email: string;
    name?: string;
  };
}

interface DailyStats {
  session_date: string;
  session_type: string;
  session_count: number;
  completed_count: number;
  total_credits_used: number;
  avg_duration: number;
}

export default function AdminSessionsPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [templates, setTemplates] = useState<SessionTemplate[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedUser, setSelectedUser] = useState('');
  const [creditAdjustment, setCreditAdjustment] = useState({ amount: 0, reason: '' });

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, [supabase]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch session templates
      const templatesResponse = await fetch('/api/session/templates');
      const templatesData = await templatesResponse.json();
      if (templatesData.success) {
        setTemplates(templatesData.templates);
      }
      
      // Fetch all sessions (admin view)
      const sessionsResponse = await supabase
        .from('user_sessions')
        .select(`
          *,
          users:user_id(email, name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (sessionsResponse.data) {
        setSessions(sessionsResponse.data);
      }
      
      // Fetch analytics
      const analyticsResponse = await fetch('/api/session/analytics');
      const analyticsData = await analyticsResponse.json();
      if (analyticsData.success) {
        setDailyStats(analyticsData.analytics.daily_stats || []);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const adjustCredits = async () => {
    if (!selectedUser || !creditAdjustment.amount || !creditAdjustment.reason) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/session/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_user_id: selectedUser,
          amount: creditAdjustment.amount,
          reason: creditAdjustment.reason,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Credits adjusted successfully');
        setCreditAdjustment({ amount: 0, reason: '' });
        setSelectedUser('');
        fetchData();
      } else {
        alert(data.error || 'Failed to adjust credits');
      }
    } catch (error) {
      console.error('Error adjusting credits:', error);
      alert('Failed to adjust credits');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'scheduled': return 'bg-yellow-500';
      case 'paused': return 'bg-orange-500';
      case 'cancelled': return 'bg-red-500';
      case 'expired': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const totalStats = dailyStats.reduce((acc, stat) => {
    acc.sessions += stat.session_count;
    acc.completed += stat.completed_count;
    acc.credits += stat.total_credits_used;
    return acc;
  }, { sessions: 0, completed: 0, credits: 0 });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Session Administration</h1>
        <p className="text-gray-600 mt-2">Manage sessions, templates, and user credits</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-600">{totalStats.sessions}</div>
            <div className="text-sm text-gray-600">Total Sessions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">{totalStats.completed}</div>
            <div className="text-sm text-gray-600">Completed Sessions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-purple-600">{totalStats.credits}</div>
            <div className="text-sm text-gray-600">Credits Used</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-orange-600">{templates.length}</div>
            <div className="text-sm text-gray-600">Session Templates</div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6">
        {['overview', 'sessions', 'templates', 'credits'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium capitalize ${
              activeTab === tab 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Daily Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Session Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dailyStats.slice(0, 10).map((stat, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm font-medium">
                        {new Date(stat.session_date).toLocaleDateString()}
                      </div>
                      <Badge variant="outline">{stat.session_type}</Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-semibold">{stat.session_count}</div>
                        <div className="text-gray-600">Sessions</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{stat.completed_count}</div>
                        <div className="text-gray-600">Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{stat.total_credits_used}</div>
                        <div className="text-gray-600">Credits</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{Math.round(stat.avg_duration)}min</div>
                        <div className="text-gray-600">Avg Duration</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'sessions' && (
        <Card>
          <CardHeader>
            <CardTitle>All Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(session.status)}>
                        {session.status}
                      </Badge>
                      <div>
                        <h3 className="font-medium">{session.title}</h3>
                        <p className="text-sm text-gray-600">
                          {session.users?.email || session.user_id}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Type:</span> {session.session_type}
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span> {session.duration_minutes}min
                    </div>
                    <div>
                      <span className="font-medium">Credits:</span> {session.net_credits}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span> {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                    </div>
                    <div>
                      <span className="font-medium">User:</span> {session.users?.email?.split('@')[0]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'templates' && (
        <Card>
          <CardHeader>
            <CardTitle>Session Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {templates.map((template) => (
                <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Badge 
                      variant={template.is_active ? "default" : "secondary"}
                    >
                      {template.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <div>
                      <h3 className="font-medium">{template.name}</h3>
                      <p className="text-sm text-gray-600">{template.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm text-right">
                    <div>
                      <div className="font-medium">{template.duration_minutes}min</div>
                      <div className="text-gray-600">Duration</div>
                    </div>
                    <div>
                      <div className="font-medium">{template.credit_cost}</div>
                      <div className="text-gray-600">Credits</div>
                    </div>
                    <div>
                      <div className="font-medium">{template.type}</div>
                      <div className="text-gray-600">Type</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'credits' && (
        <Card>
          <CardHeader>
            <CardTitle>Credit Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold mb-4">Adjust User Credits</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">User ID</label>
                    <input
                      type="text"
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Enter user ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Amount</label>
                    <input
                      type="number"
                      value={creditAdjustment.amount}
                      onChange={(e) => setCreditAdjustment({
                        ...creditAdjustment,
                        amount: parseInt(e.target.value) || 0
                      })}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="+ or - credits"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Reason</label>
                    <input
                      type="text"
                      value={creditAdjustment.reason}
                      onChange={(e) => setCreditAdjustment({
                        ...creditAdjustment,
                        reason: e.target.value
                      })}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Reason for adjustment"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={adjustCredits} className="w-full">
                      Adjust Credits
                    </Button>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Credit Transactions</h3>
                <div className="text-sm text-gray-600">
                  Credit transaction history would be displayed here...
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 