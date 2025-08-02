'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Testimonial {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar: string;
  rating: number;
  category: string;
  story: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  showOnLanding: boolean;
  featured: boolean;
  verified: boolean;
  location?: string;
  age?: string;
  sessionCount?: number;
  creditExtended?: boolean;
}

export default function AdminTestimonialsPage() {
  const router = useRouter();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const categories = [
    'Mental Space Gained',
    'Productivity',
    'Growth',
    'Motivation',
    'Emotional Relief',
    'Transformation',
    'Perspective Shifted',
    'Action Unlocked',
    'Energy Reclaimed',
    'Voice Found',
    'Purpose Found',
    'Others'
  ];

  // Mock data - replace with actual API call
  useEffect(() => {
    const loadTestimonials = async () => {
      try {
        const mockTestimonials: Testimonial[] = [
          {
            id: '1',
            name: 'Sarah Chen',
            email: 'sarah.chen@email.com',
            phone: '+1-555-0123',
            role: 'Marketing Director',
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
            rating: 5,
            category: 'Mental Space Gained',
            story: 'DrishiQ helped me create mental space I never knew I needed. As a marketing director juggling multiple campaigns, I was constantly overwhelmed. Through structured reflection, I learned to identify what truly mattered and let go of unnecessary stress.',
            date: '2025-01-15',
            status: 'approved',
            showOnLanding: true,
            featured: true,
            verified: true,
            location: 'San Francisco, CA',
            age: '32',
            sessionCount: 8,
            creditExtended: true
          },
          {
            id: '2',
            name: 'Michael Rodriguez',
            email: 'michael.r@email.com',
            phone: '+1-555-0456',
            role: 'Software Engineer',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
            rating: 5,
            category: 'Productivity',
            story: 'Instead of giving me advice, DrishiQ helped me explore my own thoughts systematically. I was stuck in analysis paralysis when choosing between job offers. The structured approach helped me identify my core values.',
            date: '2025-01-10',
            status: 'approved',
            showOnLanding: true,
            featured: true,
            verified: true,
            location: 'Austin, TX',
            age: '28',
            sessionCount: 12,
            creditExtended: true
          },
          {
            id: '3',
            name: 'Priya Patel',
            email: 'priya.patel@email.com',
            phone: '+1-555-0789',
            role: 'Healthcare Worker',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
            rating: 5,
            category: 'Transformation',
            story: 'The cause-based matching is incredible. I feel like I\'m part of something bigger when I support others through DrishiQ. It\'s not just about me anymore - it\'s about creating positive change.',
            date: '2025-01-08',
            status: 'approved',
            showOnLanding: false,
            featured: false,
            verified: true,
            location: 'New York, NY',
            age: '35',
            sessionCount: 15,
            creditExtended: true
          },
          {
            id: '4',
            name: 'David Kim',
            email: 'david.kim@email.com',
            phone: '+1-555-0321',
            role: 'Entrepreneur',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            rating: 5,
            category: 'Action Unlocked',
            story: 'DrishiQ helped me clarify my business decisions when I was at a crossroads. The structured approach to thinking through complex financial choices unlocked the action I needed.',
            date: '2025-01-05',
            status: 'pending',
            showOnLanding: false,
            featured: false,
            verified: false,
            location: 'Seattle, WA',
            age: '29',
            sessionCount: 6,
            creditExtended: false
          },
          {
            id: '5',
            name: 'Emma Thompson',
            email: 'emma.t@email.com',
            phone: '+1-555-0654',
            role: 'Teacher',
            avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
            rating: 5,
            category: 'Emotional Relief',
            story: 'I was struggling with work-life balance and DrishiQ helped me understand my own boundaries better. The reflective questions made me realize what truly mattered to me.',
            date: '2025-01-03',
            status: 'rejected',
            showOnLanding: false,
            featured: false,
            verified: false,
            location: 'Portland, OR',
            age: '31',
            sessionCount: 10,
            creditExtended: false
          }
        ];

        setTestimonials(mockTestimonials);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading testimonials:', error);
        setIsLoading(false);
      }
    };

    loadTestimonials();
  }, []);

  const filteredTestimonials = testimonials.filter(testimonial => {
    const matchesStatus = selectedStatus === 'all' || testimonial.status === selectedStatus;
    const matchesSearch = testimonial.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         testimonial.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         testimonial.story.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleStatusChange = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      // Mock API call
      console.log(`Updating testimonial ${id} status to ${newStatus}`);
      
      // If testimonial is approved, extend 1 credit to the user
      if (newStatus === 'approved') {
        const testimonial = testimonials.find(t => t.id === id);
        if (testimonial && !testimonial.creditExtended) {
          try {
            // Extend credit to user
            await extendUserCredit(testimonial.email, 1);
            
            // Update testimonial status and mark credit as extended
            setTestimonials(prev => prev.map(t => 
              t.id === id ? { ...t, status: newStatus, creditExtended: true } : t
            ));
            
            alert(`Testimonial approved! 1 credit has been extended to ${testimonial.name} (${testimonial.email})`);
          } catch (creditError) {
            alert(`Testimonial approved but failed to extend credit: ${creditError}`);
            // Still update the status even if credit extension fails
            setTestimonials(prev => prev.map(t => 
              t.id === id ? { ...t, status: newStatus } : t
            ));
          }
        } else {
          // Update status only (credit already extended or testimonial not found)
          setTestimonials(prev => prev.map(t => 
            t.id === id ? { ...t, status: newStatus } : t
          ));
          alert(`Testimonial ${newStatus} successfully!`);
        }
      } else {
        // For rejected testimonials, just update status
        setTestimonials(prev => prev.map(t => 
          t.id === id ? { ...t, status: newStatus } : t
        ));
        alert(`Testimonial ${newStatus} successfully!`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status. Please try again.');
    }
  };

  const handleLandingPageToggle = async (id: string) => {
    try {
      // Mock API call
      console.log(`Toggling landing page for testimonial ${id}`);
      
      setTestimonials(prev => prev.map(t => 
        t.id === id ? { ...t, showOnLanding: !t.showOnLanding } : t
      ));
      
      alert('Landing page setting updated!');
    } catch (error) {
      console.error('Error updating landing page setting:', error);
      alert('Error updating setting. Please try again.');
    }
  };

  const handleFeaturedToggle = async (id: string) => {
    try {
      // Mock API call
      console.log(`Toggling featured for testimonial ${id}`);
      
      setTestimonials(prev => prev.map(t => 
        t.id === id ? { ...t, featured: !t.featured } : t
      ));
      
      alert('Featured setting updated!');
    } catch (error) {
      console.error('Error updating featured setting:', error);
      alert('Error updating setting. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial? This action cannot be undone.')) {
      return;
    }

    try {
      // Mock API call
      console.log(`Deleting testimonial ${id}`);
      
      setTestimonials(prev => prev.filter(t => t.id !== id));
      alert('Testimonial deleted successfully!');
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      alert('Error deleting testimonial. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Mental Space Gained': 'bg-blue-100 text-blue-800',
      'Productivity': 'bg-green-100 text-green-800',
      'Growth': 'bg-purple-100 text-purple-800',
      'Motivation': 'bg-orange-100 text-orange-800',
      'Emotional Relief': 'bg-pink-100 text-pink-800',
      'Transformation': 'bg-indigo-100 text-indigo-800',
      'Perspective Shifted': 'bg-teal-100 text-teal-800',
      'Action Unlocked': 'bg-red-100 text-red-800',
      'Energy Reclaimed': 'bg-yellow-100 text-yellow-800',
      'Voice Found': 'bg-emerald-100 text-emerald-800',
      'Purpose Found': 'bg-cyan-100 text-cyan-800',
      'Others': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const extendUserCredit = async (email: string, amount: number) => {
    try {
      // Mock API call to extend user credit
      // In production, this would call your backend API
      console.log(`API Call: Extending ${amount} credit to user ${email}`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { success: true, message: `Successfully extended ${amount} credit to ${email}` };
    } catch (error) {
      console.error('Error extending credit:', error);
      throw new Error('Failed to extend credit');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Testimonials Management
          </h1>
          <p className="text-gray-600">
            Manage user testimonials, approve submissions, and control which stories appear on the landing page.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">Total Testimonials</h3>
            <p className="text-3xl font-bold text-[#0B4422]">{testimonials.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">Pending Approval</h3>
            <p className="text-3xl font-bold text-yellow-600">{testimonials.filter(t => t.status === 'pending').length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">On Landing Page</h3>
            <p className="text-3xl font-bold text-green-600">{testimonials.filter(t => t.showOnLanding).length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">Featured Stories</h3>
            <p className="text-3xl font-bold text-purple-600">{testimonials.filter(t => t.featured).length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name, email, or story content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0B4422]"
              />
            </div>
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0B4422]"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Testimonials List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B4422] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading testimonials...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credit Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Settings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTestimonials.map((testimonial) => (
                    <tr key={testimonial.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <Image
                              className="h-12 w-12 rounded-full object-cover"
                              src={testimonial.avatar}
                              alt={testimonial.name}
                              width={48}
                              height={48}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {testimonial.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {testimonial.role}
                            </div>
                            <div className="text-xs text-gray-400">
                              {testimonial.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(testimonial.category)}`}>
                          {testimonial.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(testimonial.status)}`}>
                          {testimonial.status.charAt(0).toUpperCase() + testimonial.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${testimonial.creditExtended ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {testimonial.creditExtended ? 'Extended' : 'Not Extended'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={testimonial.showOnLanding}
                              onChange={() => handleLandingPageToggle(testimonial.id)}
                              className="mr-2"
                            />
                            <span className="text-xs">Landing Page</span>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={testimonial.featured}
                              onChange={() => handleFeaturedToggle(testimonial.id)}
                              className="mr-2"
                            />
                            <span className="text-xs">Featured</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {testimonial.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(testimonial.id, 'approved')}
                                className="text-green-600 hover:text-green-900 text-xs"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleStatusChange(testimonial.id, 'rejected')}
                                className="text-red-600 hover:text-red-900 text-xs"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(testimonial.id)}
                            className="text-red-600 hover:text-red-900 text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredTestimonials.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-500">No testimonials found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
} 