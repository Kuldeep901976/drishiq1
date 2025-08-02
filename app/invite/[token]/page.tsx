'use client';

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui/index';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface InvitationDetails {
  id: string;
  email: string;
  role: string;
  message?: string;
  expires_at: string;
  organization: {
    name: string;
    slug: string;
  };
  invited_by: {
    name?: string;
    email: string;
  };
}

export default function InvitationPage({ params }: { params: { token: string } }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, [supabase]);

  useEffect(() => {
    fetchInvitation();
  }, [params.token]);

  const fetchInvitation = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/invite/${params.token}`);
      const data = await response.json();
      
      if (data.success) {
        setInvitation(data.invitation);
      } else {
        setError(data.error || 'Invalid invitation');
      }
    } catch (error) {
      console.error('Error fetching invitation:', error);
      setError('Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleInvitation = async (action: 'accept' | 'decline') => {
    if (!user) {
      // Redirect to sign in if not authenticated
      router.push(`/signin?redirect=/invite/${params.token}`);
      return;
    }

    try {
      setProcessing(true);
      
      const response = await fetch(`/api/invite/${params.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (action === 'accept') {
          // Redirect to the organization dashboard
          router.push('/enterprise');
        } else {
          // Show decline confirmation
          setError('Invitation declined successfully');
        }
      } else {
        setError(data.error || `Failed to ${action} invitation`);
      }
    } catch (error) {
      console.error(`Error ${action}ing invitation:`, error);
      setError(`Failed to ${action} invitation`);
    } finally {
      setProcessing(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-500';
      case 'admin': return 'bg-red-500';
      case 'manager': return 'bg-orange-500';
      case 'member': return 'bg-blue-500';
      case 'viewer': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center py-12">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/enterprise')}>
              Go to Enterprise Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation Not Found</h2>
            <p className="text-gray-600 mb-4">The invitation you're looking for doesn't exist or has expired.</p>
            <Button onClick={() => router.push('/enterprise')}>
              Go to Enterprise Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if invitation is expired
  const isExpired = new Date(invitation.expires_at) < new Date();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="max-w-2xl w-full mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Organization Invitation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Organization Info */}
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {invitation.organization.name}
            </h3>
            <p className="text-gray-600">/{invitation.organization.slug}</p>
          </div>

          {/* Invitation Details */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Invited Email</label>
                <p className="text-gray-900">{invitation.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <Badge className={getRoleColor(invitation.role)}>
                  {invitation.role}
                </Badge>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Invited By</label>
                <p className="text-gray-900">
                  {invitation.invited_by.name || invitation.invited_by.email}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Expires</label>
                <p className={`${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>

          {/* Personal Message */}
          {invitation.message && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Personal Message</h4>
              <p className="text-blue-800">{invitation.message}</p>
            </div>
          )}

          {/* Auth Check */}
          {!user && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">Sign In Required</h4>
              <p className="text-yellow-800 mb-3">
                You need to sign in to accept this invitation.
              </p>
              <Button onClick={() => router.push(`/signin?redirect=/invite/${params.token}`)}>
                Sign In to Continue
              </Button>
            </div>
          )}

          {/* Email Mismatch Warning */}
          {user && user.email !== invitation.email && (
            <div className="bg-orange-50 rounded-lg p-4">
              <h4 className="font-medium text-orange-900 mb-2">Email Mismatch</h4>
              <p className="text-orange-800">
                This invitation was sent to {invitation.email}, but you're signed in as {user.email}.
                You may need to sign in with the correct email address.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {user && !isExpired && (
            <div className="flex space-x-4">
              <Button 
                onClick={() => handleInvitation('accept')}
                disabled={processing || user.email !== invitation.email}
                className="flex-1"
              >
                {processing ? 'Processing...' : 'Accept Invitation'}
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleInvitation('decline')}
                disabled={processing}
                className="flex-1"
              >
                {processing ? 'Processing...' : 'Decline'}
              </Button>
            </div>
          )}

          {/* Expired Message */}
          {isExpired && (
            <div className="text-center">
              <p className="text-red-600 font-medium">This invitation has expired.</p>
              <p className="text-gray-600 text-sm mt-1">
                Please contact the organization administrator for a new invitation.
              </p>
            </div>
          )}

          {/* Back Link */}
          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={() => router.push('/enterprise')}
            >
              Back to Enterprise Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 