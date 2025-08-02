'use client';

import { useEffect, useState } from 'react';

export default function TestInvitationsPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testAPI();
  }, []);

  const testAPI = async () => {
    try {
      console.log('Testing API...');
      
      // Test stats API
      const statsResponse = await fetch('/api/admin/invitations/stats');
      console.log('Stats response status:', statsResponse.status);
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('Stats data:', statsData);
        setData(statsData);
      } else {
        const errorText = await statsResponse.text();
        console.error('Stats API error:', errorText);
        setError(`Stats API Error: ${statsResponse.status} - ${errorText}`);
      }

      // Test invitations API
      const invitationsResponse = await fetch('/api/admin/invitations?type=trial&limit=5');
      console.log('Invitations response status:', invitationsResponse.status);
      
      if (invitationsResponse.ok) {
        const invitationsData = await invitationsResponse.json();
        console.log('Invitations data:', invitationsData);
      } else {
        const errorText = await invitationsResponse.text();
        console.error('Invitations API error:', errorText);
        setError(prev => prev + `\nInvitations API Error: ${invitationsResponse.status} - ${errorText}`);
      }

    } catch (err) {
      console.error('Test error:', err);
      setError(`Test Error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Testing Invitation APIs</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Invitation API Test Results</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {data && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <strong>Success!</strong> Data received from API
          <pre className="mt-2 text-sm">{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}

      <div className="mt-4">
        <button 
          onClick={testAPI}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test Again
        </button>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Test URLs:</h2>
        <ul className="space-y-2">
          <li><a href="/admin/invitations" className="text-blue-600 hover:underline">Main Invitation Dashboard</a></li>
          <li><a href="/admin/invitations/trial" className="text-blue-600 hover:underline">Trial Invitations</a></li>
                          <li><a href="/admin/invitations/support-in-need" className="text-blue-600 hover:underline">Need Support</a></li>
          <li><a href="/admin/invitations/testimonials" className="text-blue-600 hover:underline">Testimonials</a></li>
          <li><a href="/admin/invitations/bulk-uploaded" className="text-blue-600 hover:underline">Bulk Uploaded</a></li>
        </ul>
      </div>
    </div>
  );
} 