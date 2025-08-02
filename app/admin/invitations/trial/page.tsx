'use client';

import { Badge, Button, Card, CardBody, Container, Grid, Section, Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/DrishiqUI';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface TrialInvitation {
  id: string;
  name: string;
  email: string;
  phone?: string;
  language: string;
  location?: string;
  challenge?: string;
  status: string;
  created_at: string;
  token?: string;
  expires_at?: string;
}

interface TrialStats {
  total: number;
  pending: number;
  approved: number;
  used: number;
  expired: number;
}

export default function TrialInvitationsPage() {
  const [invitations, setInvitations] = useState<TrialInvitation[]>([]);
  const [stats, setStats] = useState<TrialStats>({
    total: 0,
    pending: 0,
    approved: 0,
    used: 0,
    expired: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedInvitations, setSelectedInvitations] = useState<string[]>([]);
  const [action, setAction] = useState<string>('');

  useEffect(() => {
    loadTrialInvitations();
  }, []);

  const loadTrialInvitations = async () => {
    try {
      const response = await fetch('/api/admin/invitations/?type=trial&limit=100');
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations || []);
        
        // Calculate stats
        const stats = {
          total: data.invitations?.length || 0,
          pending: data.invitations?.filter((i: TrialInvitation) => i.status === 'pending').length || 0,
          approved: data.invitations?.filter((i: TrialInvitation) => i.status === 'approved').length || 0,
          used: data.invitations?.filter((i: TrialInvitation) => i.status === 'used').length || 0,
          expired: data.invitations?.filter((i: TrialInvitation) => i.status === 'expired').length || 0
        };
        setStats(stats);
      } else {
        console.error('Failed to load trial invitations:', response.status);
      }
    } catch (error) {
      console.error('Error loading trial invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async () => {
    if (!action || selectedInvitations.length === 0) return;

    try {
      const response = await fetch('/api/admin/invitations/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action === 'bulk_approve' ? 'bulk_approve' : 'discard',
          requestIds: selectedInvitations
        })
      });

      if (response.ok) {
        setSelectedInvitations([]);
        setAction('');
        loadTrialInvitations();
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const handleApprove = async (invitationId: string) => {
    try {
      const response = await fetch('/api/admin/invitations/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          requestId: invitationId
        })
      });

      if (response.ok) {
        loadTrialInvitations();
      } else {
        console.error('Failed to approve invitation:', response.status);
      }
    } catch (error) {
      console.error('Error approving invitation:', error);
    }
  };

  const handleReject = async (invitationId: string) => {
    try {
      const response = await fetch('/api/admin/invitations/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          requestId: invitationId,
          reason: 'Rejected by admin'
        })
      });

      if (response.ok) {
        loadTrialInvitations();
      } else {
        console.error('Failed to reject invitation:', response.status);
      }
    } catch (error) {
      console.error('Error rejecting invitation:', error);
    }
  };

  const handleSendMagicLink = async (invitation: TrialInvitation) => {
    try {
      const response = await fetch('/api/magic-link/create-and-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: invitation.email,
          name: invitation.name,
          invitationToken: invitation.token,
          invitationLink: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invitation.token}`
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        alert('Magic link sent successfully');
      } else {
        alert(result.error || 'Failed to send magic link');
      }
    } catch (error) {
      alert('Error sending magic link');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'used': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Container>
        <Section>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B4422]"></div>
          </div>
        </Section>
      </Container>
    );
  }

  return (
    <Container>
      <Section>
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-[#0B4422] mb-2">Trial Invitations</h1>
              <p className="text-gray-600">Manage trial invitation requests and approvals</p>
            </div>
            <Link href="/admin/invitations">
              <Button variant="secondary">Back to Invitation Dashboard</Button>
            </Link>
          </div>

          {/* Stats Overview */}
          <Grid cols={5} className="mb-8">
            <Card>
              <CardBody className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.total}</div>
                <div className="text-sm text-gray-500">Total Trial</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-sm text-gray-500">Pending</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                <div className="text-sm text-gray-500">Approved</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.used}</div>
                <div className="text-sm text-gray-500">Used</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
                <div className="text-sm text-gray-500">Expired</div>
              </CardBody>
            </Card>
          </Grid>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardBody>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Trial Invitation Statistics</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pending</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{stats.pending}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Approved</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${stats.total > 0 ? (stats.approved / stats.total) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{stats.approved}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Used</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${stats.total > 0 ? (stats.used / stats.total) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{stats.used}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Expired</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${stats.total > 0 ? (stats.expired / stats.total) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{stats.expired}</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Pie Chart */}
          <div>
            <Card>
              <CardBody>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">Pending</span>
                    </div>
                    <span className="text-sm font-medium">{stats.pending}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">Approved</span>
                    </div>
                    <span className="text-sm font-medium">{stats.approved}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">Used</span>
                    </div>
                    <span className="text-sm font-medium">{stats.used}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">Expired</span>
                    </div>
                    <span className="text-sm font-medium">{stats.expired}</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedInvitations.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-4">
              <span>{selectedInvitations.length} invitation(s) selected</span>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="px-3 py-1 border rounded"
              >
                <option value="">Select action...</option>
                <option value="bulk_approve">Approve Selected</option>
                <option value="discard">Discard Selected</option>
              </select>
              <button
                onClick={handleBulkAction}
                disabled={!action}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Apply
              </button>
              <button
                onClick={() => setSelectedInvitations([])}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Invitations Table */}
        <Card>
          <CardBody>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Trial Invitations List</h2>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell className="w-12">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedInvitations(invitations.map(i => i.id));
                          } else {
                            setSelectedInvitations([]);
                          }
                        }}
                        checked={selectedInvitations.length === invitations.length && invitations.length > 0}
                      />
                    </TableCell>
                    <TableCell className="w-48">Name & Email</TableCell>
                    <TableCell className="w-32">Phone</TableCell>
                    <TableCell className="w-48">Challenge</TableCell>
                    <TableCell className="w-24">Status</TableCell>
                    <TableCell className="w-24">Created</TableCell>
                    <TableCell className="w-32">Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedInvitations.includes(invitation.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedInvitations([...selectedInvitations, invitation.id]);
                            } else {
                              setSelectedInvitations(selectedInvitations.filter(id => id !== invitation.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="w-48">
                        <div>
                          <div className="font-medium text-gray-900 truncate">{invitation.name}</div>
                          <div className="text-sm text-gray-500 truncate">{invitation.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="w-32">
                        <div className="text-sm text-gray-600 truncate">
                          {invitation.phone || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="w-48">
                        <div className="text-sm text-gray-900 truncate" title={invitation.challenge || 'No challenge specified'}>
                          {invitation.challenge || 'No challenge specified'}
                        </div>
                      </TableCell>
                      <TableCell className="w-24">
                        <Badge variant={invitation.status === 'pending' ? 'warning' : 
                                       invitation.status === 'approved' ? 'success' : 
                                       invitation.status === 'used' ? 'info' : 'error'}>
                          {invitation.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-24">
                        <div className="text-sm text-gray-600">
                          {new Date(invitation.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="w-32">
                        <div className="flex flex-col space-y-1">
                          {invitation.status === 'pending' && (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleApprove(invitation.id)}
                                className="text-xs px-2 py-1"
                              >
                                Approve
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleReject(invitation.id)}
                                className="text-xs px-2 py-1"
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {invitation.status === 'approved' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleSendMagicLink(invitation)}
                              className="text-xs px-2 py-1"
                            >
                              Send Link
                            </Button>
                          )}
                          {invitation.status === 'used' && (
                            <span className="text-xs text-gray-500">Used</span>
                          )}
                          {invitation.status === 'expired' && (
                            <span className="text-xs text-gray-500">Expired</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardBody>
        </Card>
      </Section>
    </Container>
  );
} 