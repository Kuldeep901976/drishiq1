'use client';

import {
    Alert,
    Badge,
    Button,
    Card,
    CardBody,
    Container,
    Input,
    LoadingSpinner,
    Section,
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow
} from '@/components/ui/DrishiqUI';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface NeedyIndividual {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  language: string;
  support_needs: string[];
  urgency_level: string;
  status: string;
  priority_score: number;
  source: string;
  metadata: {
    domain_of_life?: string;
    type_of_challenge?: string;
    specific_issue?: string;
    biggest_challenge?: string;
    invitation_category?: string;
    submitted_at?: string;
  };
  notes?: string;
  created_at: string;
  updated_at: string;
}

export default function NeedySupportPage() {
  const [needyIndividuals, setNeedyIndividuals] = useState<NeedyIndividual[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNeedy, setSelectedNeedy] = useState<string[]>([]);
  const [action, setAction] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchNeedyIndividuals();
  }, [statusFilter]);

  const fetchNeedyIndividuals = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/admin/needy-support?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setNeedyIndividuals(data.needyIndividuals || []);
    } catch (error) {
      console.error('Error fetching needy individuals:', error);
      setAlert({ type: 'error', message: 'Failed to fetch needy individuals' });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async () => {
    if (!action || selectedNeedy.length === 0) return;

    try {
      const response = await fetch('/api/admin/needy-support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          needyIds: selectedNeedy
        })
      });

      if (response.ok) {
        setSelectedNeedy([]);
        setAction('');
        fetchNeedyIndividuals();
        const data = await response.json();
        setAlert({ type: 'success', message: data.message });
      } else {
        const errorData = await response.json();
        setAlert({ type: 'error', message: 'Failed to perform action: ' + (errorData.error || 'Unknown error') });
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      setAlert({ type: 'error', message: 'Error performing bulk action' });
    }
  };

  const handleDeleteNeedy = async (needyId: string) => {
    if (!confirm('Are you sure you want to delete this needy individual? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/needy-support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_delete',
          needyIds: [needyId]
        })
      });

      if (response.ok) {
        fetchNeedyIndividuals();
        setAlert({ type: 'success', message: 'Needy individual deleted successfully' });
      } else {
        const errorData = await response.json();
        setAlert({ type: 'error', message: 'Failed to delete: ' + (errorData.error || 'Unknown error') });
      }
    } catch (error) {
      console.error('Error deleting needy individual:', error);
      setAlert({ type: 'error', message: 'Error deleting needy individual' });
    }
  };

  const filteredNeedyIndividuals = needyIndividuals.filter(needy => {
    const matchesSearch = needy.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         needy.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (needy.phone && needy.phone.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'enrolled': return 'info';
      case 'completed': return 'success';
      case 'inactive': return 'error';
      case 'contacted': return 'warning';
      default: return 'info';
    }
  };

  const getUrgencyBadgeVariant = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'info';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#0B4422] mb-2">Needy Support Management</h1>
            <p className="text-gray-600">Manage individuals who need support and their approval status</p>
          </div>
          <Link href="/admin/dashboard">
            <Button variant="secondary">
              ← Back to Dashboard
            </Button>
          </Link>
        </div>

        {alert && (
          <Alert variant={alert.type === 'success' ? 'success' : 'error'} className="mb-6">
            {alert.message}
          </Alert>
        )}

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4422] focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="enrolled">Enrolled</option>
                  <option value="completed">Completed</option>
                  <option value="inactive">Inactive</option>
                  <option value="contacted">Contacted</option>
                </select>
              </div>
              <div>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4422] focus:border-transparent"
                >
                  <option value="">Select Action</option>
                  <option value="approve">Approve</option>
                  <option value="discard">Discard</option>
                  <option value="bulk_delete">Delete</option>
                </select>
              </div>
                              <div>
                  <Button
                    onClick={handleBulkAction}
                    disabled={!action || selectedNeedy.length === 0}
                    className="w-full"
                  >
                    {action === 'approve' ? 'Approve Selected' :
                     action === 'discard' ? 'Discard Selected' :
                     action === 'bulk_delete' ? 'Delete Selected' : 'Apply Action'}
                  </Button>
                </div>
              </div>
          </CardBody>
        </Card>

        {/* Needy Individuals Table */}
        <Card>
          <CardBody>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedNeedy.length === filteredNeedyIndividuals.length && filteredNeedyIndividuals.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedNeedy(filteredNeedyIndividuals.map(n => n.id));
                        } else {
                          setSelectedNeedy([]);
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Support Needs</TableCell>
                  <TableCell>Challenge Details</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Urgency</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNeedyIndividuals.map((needy) => (
                  <TableRow key={needy.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedNeedy.includes(needy.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedNeedy([...selectedNeedy, needy.id]);
                          } else {
                            setSelectedNeedy(selectedNeedy.filter(id => id !== needy.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{needy.full_name}</div>
                        <div className="text-sm text-gray-500">Priority: {needy.priority_score}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{needy.email}</div>
                        <div className="text-sm text-gray-500">{needy.phone}</div>
                        <div className="text-xs text-gray-400">Lang: {needy.language}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {needy.support_needs?.map((need, index) => (
                          <Badge key={index} variant="info" className="text-xs">
                            {need}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="text-sm">
                          <strong>Domain:</strong> {needy.metadata?.domain_of_life}
                        </div>
                        <div className="text-sm">
                          <strong>Challenge:</strong> {needy.metadata?.type_of_challenge}
                        </div>
                        <div className="text-sm">
                          <strong>Issue:</strong> {needy.metadata?.specific_issue}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {needy.metadata?.biggest_challenge?.substring(0, 100)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(needy.status)}>
                        {needy.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getUrgencyBadgeVariant(needy.urgency_level)}>
                        {needy.urgency_level}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(needy.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => {
                            setSelectedNeedy([needy.id]);
                            setAction('approve');
                            handleBulkAction();
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="warning"
                          onClick={() => {
                            setSelectedNeedy([needy.id]);
                            setAction('discard');
                            handleBulkAction();
                          }}
                        >
                          Discard
                        </Button>
                        <Button
                          size="sm"
                          variant="error"
                          onClick={() => handleDeleteNeedy(needy.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredNeedyIndividuals.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No needy individuals found matching your criteria.
              </div>
            )}
          </CardBody>
        </Card>
      </Section>
    </Container>
  );
} 