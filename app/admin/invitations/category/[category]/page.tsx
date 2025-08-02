'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Invitation {
  id: string;
  name: string;
  email: string;
  phone?: string;
  language: string;
  location?: string;
  category: string;
  challenge?: string;
  challenge_description?: string;
  type_of_challenge?: string;
  specific_issue?: string;
  status: string;
  created_at: string;
  token?: string;
  expires_at?: string;
  credits_allocated?: number;
  credits_used?: number;
}

interface CategoryStats {
  total: number;
  pending: number;
  approved: number;
  used: number;
  expired: number;
  creditsAllocated: number;
  creditsUsed: number;
}

const categoryConfig = {
  trial_access: {
    title: 'Trial Access Invitations',
    description: 'Manage trial access requests',
    color: 'blue',
    icon: '🔵'
  },
  need_support: {
    title: 'Need Support Invitations',
    description: 'Manage support requests with challenge details',
    color: 'green',
    icon: '🟢'
  },
  testimonial: {
    title: 'Testimonial Invitations',
    description: 'Manage testimonial requests',
    color: 'purple',
    icon: '🟣'
  }
};

export default function CategoryInvitationsPage() {
  const params = useParams();
  const category = params.category as string;
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [stats, setStats] = useState<CategoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvitations, setSelectedInvitations] = useState<string[]>([]);
  const [action, setAction] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);

  const config = categoryConfig[category as keyof typeof categoryConfig];

  useEffect(() => {
    if (category && config) {
      fetchCategoryData();
    }
  }, [category]);

  const fetchCategoryData = async () => {
    try {
      const [invitationsResponse, statsResponse] = await Promise.all([
        fetch(`/api/admin/invitations/category/${category}`),
        fetch(`/api/admin/invitations/category/${category}/stats`)
      ]);

      if (invitationsResponse.ok) {
        const data = await invitationsResponse.json();
        setInvitations(data.data);
      }

      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching category data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async () => {
    if (!action || selectedInvitations.length === 0) return;

    try {
      const response = await fetch('/api/admin/invitations/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          invitationIds: selectedInvitations,
          category
        })
      });

      if (response.ok) {
        setSelectedInvitations([]);
        setAction('');
        fetchCategoryData();
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const handleAllocateCredits = async (invitationId: string, credits: number, reason: string) => {
    try {
      const response = await fetch('/api/admin/invitations/credits/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, credits, reason })
      });

      if (response.ok) {
        setShowCreditModal(false);
        setSelectedInvitation(null);
        fetchCategoryData();
      }
    } catch (error) {
      console.error('Error allocating credits:', error);
    }
  };

  const filteredInvitations = invitations.filter(invitation => {
    const matchesSearch = invitation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invitation.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (invitation.challenge && invitation.challenge.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || invitation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!config) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Category</h1>
          <p className="text-gray-600">The requested category does not exist.</p>
          <Link href="/admin/invitations" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            ← Back to Invitations
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="p-6">Loading {config.title}...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{config.icon}</span>
            <h1 className="text-3xl font-bold text-gray-900">{config.title}</h1>
          </div>
          <p className="text-gray-600">{config.description}</p>
        </div>
        <div className="flex gap-3">
          <Link 
            href="/admin/invitations"
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Back to Dashboard
          </Link>
          <button
            onClick={() => setShowCreditModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Allocate Credits
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className={`p-2 bg-${config.color}-100 rounded-lg`}>
                <svg className={`w-6 h-6 text-${config.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Credits Allocated</p>
                <p className="text-2xl font-bold text-gray-900">{stats.creditsAllocated}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Credits Used</p>
                <p className="text-2xl font-bold text-gray-900">{stats.creditsUsed}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Search by name, email, or challenge..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border rounded-lg flex-1 min-w-64"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="used">Used</option>
          <option value="expired">Expired</option>
        </select>
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
              <option value="approve">Approve Selected</option>
              <option value="send_magic_link">Send Magic Link</option>
              <option value="allocate_credits">Allocate Credits</option>
              <option value="reject">Reject Selected</option>
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
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedInvitations(filteredInvitations.map(i => i.id));
                    } else {
                      setSelectedInvitations([]);
                    }
                  }}
                  checked={selectedInvitations.length === filteredInvitations.length && filteredInvitations.length > 0}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Info</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Challenge Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInvitations.map((invitation) => (
              <tr key={invitation.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
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
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{invitation.name}</div>
                    <div className="text-sm text-gray-500">{invitation.email}</div>
                    <div className="text-sm text-gray-500">{invitation.phone}</div>
                    <div className="text-xs text-gray-400">
                      {invitation.language} • {invitation.location}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {category === 'need_support' ? (
                    <div className="max-w-xs">
                      <div className="text-sm text-gray-900">
                        <strong>Challenge:</strong> {invitation.challenge_description || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Type:</strong> {invitation.type_of_challenge || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Specific:</strong> {invitation.specific_issue || 'N/A'}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">No challenge details</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    <div>Allocated: {invitation.credits_allocated || 0}</div>
                    <div>Used: {invitation.credits_used || 0}</div>
                    <div className="text-xs text-gray-500">
                      Available: {(invitation.credits_allocated || 0) - (invitation.credits_used || 0)}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    invitation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    invitation.status === 'approved' ? 'bg-green-100 text-green-800' :
                    invitation.status === 'used' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {invitation.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(invitation.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setSelectedInvitation(invitation);
                        setShowCreditModal(true);
                      }}
                      className="text-green-600 hover:text-green-900"
                    >
                      Credits
                    </button>
                    <button className="text-blue-600 hover:text-blue-900">View</button>
                    <button className="text-green-600 hover:text-green-900">Approve</button>
                    <button className="text-red-600 hover:text-red-900">Reject</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredInvitations.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No {config.title.toLowerCase()} found
        </div>
      )}

      {/* Credit Allocation Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Allocate Credits
                {selectedInvitation && (
                  <div className="text-sm text-gray-600 mt-1">
                    for {selectedInvitation.name}
                  </div>
                )}
              </h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleAllocateCredits(
                  selectedInvitation?.id || formData.get('invitationId') as string,
                  parseInt(formData.get('credits') as string),
                  formData.get('reason') as string
                );
              }}>
                {!selectedInvitation && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Invitation ID
                    </label>
                    <input
                      type="text"
                      name="invitationId"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credits to Allocate
                  </label>
                  <input
                    type="number"
                    name="credits"
                    min="1"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason
                  </label>
                  <textarea
                    name="reason"
                    rows={3}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreditModal(false);
                      setSelectedInvitation(null);
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Allocate
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 