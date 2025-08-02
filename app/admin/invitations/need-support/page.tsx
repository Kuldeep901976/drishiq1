'use client';

import { Badge, Button, Card, CardBody, Container, Grid, Section, Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/DrishiqUI';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface NeedSupportInvitation {
  id: string;
  name: string;
  email: string;
  phone?: string;
  language: string;
  location?: string;
  challenge?: string;
  status: string;
  created_at: string;
  credits_allocated?: number;
  supporter_id?: string;
  credit_allocation_date?: string;
}

interface NeedSupportStats {
  total: number;
  pending: number;
  approved: number;
  used: number;
  expired: number;
}

export default function NeedSupportInvitationsPage() {
  const [invitations, setInvitations] = useState<NeedSupportInvitation[]>([]);
  const [stats, setStats] = useState<NeedSupportStats>({
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
    loadNeedSupportInvitations();
  }, []);

  const loadNeedSupportInvitations = async () => {
    try {
      const response = await fetch('/api/admin/invitations/?type=need_support&limit=100');
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations || []);
        
        // Calculate stats
        const stats = {
          total: data.invitations?.length || 0,
          pending: data.invitations?.filter((i: NeedSupportInvitation) => i.status === 'pending').length || 0,
          approved: data.invitations?.filter((i: NeedSupportInvitation) => i.status === 'approved').length || 0,
          used: data.invitations?.filter((i: NeedSupportInvitation) => i.status === 'used').length || 0,
          expired: data.invitations?.filter((i: NeedSupportInvitation) => i.status === 'expired').length || 0
        };
        setStats(stats);
      } else {
        console.error('Failed to load need support invitations:', response.status);
      }
    } catch (error) {
      console.error('Error loading need support invitations:', error);
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
        loadNeedSupportInvitations();
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
        loadNeedSupportInvitations();
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
        loadNeedSupportInvitations();
      }
    } catch (error) {
      console.error('Error rejecting invitation:', error);
    }
  };

  const handleSendMagicLink = async (invitation: NeedSupportInvitation) => {
    try {
      const response = await fetch('/api/magic-link/create-and-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: invitation.email,
          name: invitation.name,
          invitationToken: invitation.id, // Using invitation ID as token
          invitationLink: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invitation.id}`
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
              <h1 className="text-3xl font-bold text-[#0B4422] mb-2">Need Support Invitations</h1>
              <p className="text-gray-600">Manage support requests and credit allocations</p>
            </div>
            <Link href="/admin/invitations">
              <Button variant="secondary">Back to Invitation Dashboard</Button>
            </Link>
          </div>

          {/* Stats Overview */}
          <Grid cols={5} className="mb-8">
            <Card>
              <CardBody className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.total}</div>
                <div className="text-sm text-gray-500">Total Support</div>
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

        {/* Bulk Actions */}
        {selectedInvitations.length > 0 && (
          <Card className="mb-6">
            <CardBody>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {selectedInvitations.length} invitation(s) selected
                </span>
                <div className="flex space-x-2">
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1"
                  >
                    <option value="">Select Action</option>
                    <option value="bulk_approve">Approve Selected</option>
                    <option value="discard">Discard Selected</option>
                  </select>
                  <Button
                    variant="primary"
                    onClick={handleBulkAction}
                    disabled={!action}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Invitations List */}
        <Card>
          <CardBody>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Need Support Invitations List</h2>
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
                        checked={selectedInvitations.length === invitations.length}
                      />
                    </TableCell>
                    <TableCell className="w-40">Name</TableCell>
                    <TableCell className="w-48">Email</TableCell>
                    <TableCell className="w-40">Challenge</TableCell>
                    <TableCell className="w-20">Status</TableCell>
                    <TableCell className="w-24">Credits</TableCell>
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
                      <TableCell className="w-40">
                        <div className="font-medium text-gray-900 truncate">{invitation.name}</div>
                      </TableCell>
                      <TableCell className="w-48">
                        <div className="text-sm text-gray-600 truncate">{invitation.email}</div>
                      </TableCell>
                      <TableCell className="w-40">
                        <div className="text-sm text-gray-900 truncate" title={invitation.challenge || 'No challenge specified'}>
                          {invitation.challenge || 'No challenge specified'}
                        </div>
                      </TableCell>
                      <TableCell className="w-20">
                        <Badge className={getStatusColor(invitation.status)}>
                          {invitation.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-24">
                        {invitation.credits_allocated ? (
                          <span className="text-green-600 font-medium text-sm">
                            {invitation.credits_allocated} credits
                          </span>
                        ) : (
                          <span className="text-gray-500 text-sm">Not allocated</span>
                        )}
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