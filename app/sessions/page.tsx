import SessionDashboard from '@/components/SessionDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sessions - DrishiQ',
  description: 'Manage your sessions and track your progress with DrishiQ',
};

export default function SessionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SessionDashboard />
    </div>
  );
} 