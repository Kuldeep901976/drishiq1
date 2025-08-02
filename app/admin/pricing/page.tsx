'use client';

import Footer from '@/components/Footer';
import Header from '@/components/HeaderUpdated';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface PricingRate {
  id?: string;
  region_code: string;
  country_name: string;
  currency_code: string;
  currency_symbol: string;
  package_type: 'free' | 'seed' | 'growth' | 'support' | 'enterprise';
  base_price: number;
  discounted_price: number;
  credits: number;
  validity_days: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface PackageType {
  value: string;
  label: string;
  description: string;
  defaultCredits: number;
  defaultValidity: number;
}

const PACKAGE_TYPES: PackageType[] = [
  {
    value: 'free',
    label: 'Free',
    description: 'Basic free tier with limited credits',
    defaultCredits: 1,
    defaultValidity: 30
  },
  {
    value: 'seed',
    label: 'Seed',
    description: 'Starter package for new users',
    defaultCredits: 1,
    defaultValidity: 60
  },
  {
    value: 'growth',
    label: 'Growth',
    description: 'Growth package for active users',
    defaultCredits: 10,
    defaultValidity: 90
  },
  {
    value: 'support',
    label: 'Support',
    description: 'Support package with priority features',
    defaultCredits: 25,
    defaultValidity: 120
  },
  {
    value: 'enterprise',
    label: 'Enterprise',
    description: 'Enterprise package for large organizations',
    defaultCredits: 100,
    defaultValidity: 365
  }
];

const COMMON_REGIONS = [
  { code: 'US', name: 'United States', currency: 'USD', symbol: '$' },
  { code: 'CA', name: 'Canada', currency: 'CAD', symbol: 'C$' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', symbol: '£' },
  { code: 'EU', name: 'European Union', currency: 'EUR', symbol: '€' },
  { code: 'AU', name: 'Australia', currency: 'AUD', symbol: 'A$' },
  { code: 'IN', name: 'India', currency: 'INR', symbol: '₹' },
  { code: 'JP', name: 'Japan', currency: 'JPY', symbol: '¥' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', symbol: 'S$' },
  { code: 'BR', name: 'Brazil', currency: 'BRL', symbol: 'R$' },
  { code: 'MX', name: 'Mexico', currency: 'MXN', symbol: '$' }
];

export default function AdminPricing() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rates, setRates] = useState<PricingRate[]>([]);
  const [editingRate, setEditingRate] = useState<PricingRate | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('');

  const checkAdminAccess = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/signin');
        return;
      }

      const response = await fetch('/api/admin/stats');
      
      if (response.status === 403) {
        setError('You do not have admin access');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load admin data');
      }

      setLoading(false);
    } catch (error) {
      logger.error('Failed to check admin access');
      setError('Failed to load admin dashboard');
      setLoading(false);
    }
  }, [router]);

  const loadPricingRates = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/pricing');
      if (response.ok) {
        const data = await response.json();
        setRates(data.rates || []);
      } else {
        setError('Failed to load pricing rates');
      }
    } catch (error) {
      setError('Failed to load pricing rates');
    }
  }, []);

  useEffect(() => {
    checkAdminAccess();
  }, [checkAdminAccess]);

  useEffect(() => {
    if (!loading && !error) {
      loadPricingRates();
    }
  }, [loading, error, loadPricingRates]);

  const handleSaveRate = async (rate: PricingRate) => {
    try {
      const response = await fetch('/api/admin/pricing', {
        method: rate.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rate)
      });

      if (response.ok) {
        setEditingRate(null);
        setShowAddForm(false);
        loadPricingRates();
      } else {
        setError('Failed to save pricing rate');
      }
    } catch (error) {
      setError('Failed to save pricing rate');
    }
  };

  const handleDeleteRate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pricing rate?')) return;

    try {
      const response = await fetch(`/api/admin/pricing/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadPricingRates();
      } else {
        setError('Failed to delete pricing rate');
      }
    } catch (error) {
      setError('Failed to delete pricing rate');
    }
  };

  const handleToggleActive = async (rate: PricingRate) => {
    try {
      const response = await fetch('/api/admin/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rate, is_active: !rate.is_active })
      });

      if (response.ok) {
        loadPricingRates();
      } else {
        setError('Failed to update pricing rate');
      }
    } catch (error) {
      setError('Failed to update pricing rate');
    }
  };

  const getPackageInfo = (packageType: string) => {
    return PACKAGE_TYPES.find(p => p.value === packageType);
  };

  const getRegionInfo = (regionCode: string) => {
    return COMMON_REGIONS.find(r => r.code === regionCode);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading pricing management...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md mx-auto">
              <p className="font-bold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              Back to Admin
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pricing Management</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage regional pricing rates, currencies, and credit packages.
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              Add New Rate
            </button>
          </div>
        </div>

        {/* Package Types Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Package Types</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {PACKAGE_TYPES.map((pkg) => (
              <div key={pkg.value} className="bg-white rounded-lg shadow p-4 border-l-4 border-l-blue-500">
                <h3 className="font-semibold text-gray-900">{pkg.label}</h3>
                <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                <div className="mt-2 text-xs text-gray-500">
                  <p>Credits: {pkg.defaultCredits}</p>
                  <p>Validity: {pkg.defaultValidity} days</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Rates Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Regional Pricing Rates</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Region
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Package
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Base Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discounted Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Validity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rates.map((rate) => (
                  <tr key={rate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {getRegionInfo(rate.region_code)?.name || rate.country_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {rate.region_code} • {rate.currency_code} ({rate.currency_symbol})
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {getPackageInfo(rate.package_type)?.label || rate.package_type}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getPackageInfo(rate.package_type)?.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rate.currency_symbol}{rate.base_price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rate.currency_symbol}{rate.discounted_price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rate.credits}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rate.validity_days} days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        rate.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {rate.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingRate(rate)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(rate)}
                          className={`${
                            rate.is_active 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {rate.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => rate.id && handleDeleteRate(rate.id)}
                          className="text-red-600 hover:text-red-900"
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

        {/* Add/Edit Form Modal */}
        {(showAddForm || editingRate) && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingRate ? 'Edit Pricing Rate' : 'Add New Pricing Rate'}
                </h3>
                
                <PricingForm
                  rate={editingRate}
                  onSave={handleSaveRate}
                  onCancel={() => {
                    setEditingRate(null);
                    setShowAddForm(false);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}

// Pricing Form Component
function PricingForm({ 
  rate, 
  onSave, 
  onCancel 
}: { 
  rate: PricingRate | null; 
  onSave: (rate: PricingRate) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState<PricingRate>({
    region_code: '',
    country_name: '',
    currency_code: '',
    currency_symbol: '',
    package_type: 'free',
    base_price: 0,
    discounted_price: 0,
    credits: 1,
    validity_days: 30,
    is_active: true,
    ...rate
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleRegionChange = (regionCode: string) => {
    const region = COMMON_REGIONS.find(r => r.code === regionCode);
    if (region) {
      setFormData(prev => ({
        ...prev,
        region_code: region.code,
        country_name: region.name,
        currency_code: region.currency,
        currency_symbol: region.symbol
      }));
    }
  };

  const handlePackageChange = (packageType: string) => {
    const pkg = PACKAGE_TYPES.find(p => p.value === packageType);
    if (pkg) {
      setFormData(prev => ({
        ...prev,
        package_type: packageType as any,
        credits: pkg.defaultCredits,
        validity_days: pkg.defaultValidity
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Region</label>
        <select
          value={formData.region_code}
          onChange={(e) => handleRegionChange(e.target.value)}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="">Select Region</option>
          {COMMON_REGIONS.map((region) => (
            <option key={region.code} value={region.code}>
              {region.name} ({region.code})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Package Type</label>
        <select
          value={formData.package_type}
          onChange={(e) => handlePackageChange(e.target.value)}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          required
        >
          {PACKAGE_TYPES.map((pkg) => (
            <option key={pkg.value} value={pkg.value}>
              {pkg.label} - {pkg.description}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Base Price</label>
          <input
            type="number"
            step="0.01"
            value={formData.base_price}
            onChange={(e) => setFormData(prev => ({ ...prev, base_price: parseFloat(e.target.value) || 0 }))}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Discounted Price</label>
          <input
            type="number"
            step="0.01"
            value={formData.discounted_price}
            onChange={(e) => setFormData(prev => ({ ...prev, discounted_price: parseFloat(e.target.value) || 0 }))}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Credits</label>
          <input
            type="number"
            value={formData.credits}
            onChange={(e) => setFormData(prev => ({ ...prev, credits: parseInt(e.target.value) || 0 }))}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Validity (days)</label>
          <input
            type="number"
            value={formData.validity_days}
            onChange={(e) => setFormData(prev => ({ ...prev, validity_days: parseInt(e.target.value) || 0 }))}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          checked={formData.is_active}
          onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label className="ml-2 block text-sm text-gray-900">Active</label>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          {rate ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
} 