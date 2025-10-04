import React, { useEffect, useState } from 'react';
import { Plus, Search, Heart, Clock, Edit, Trash2, AlertCircle } from 'lucide-react';
import { Donor } from '../../types';
import { apiService } from '../../services/api.service';
import { DonorForm } from './DonorForm';

export function DonorList() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [filteredDonors, setFilteredDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDonor, setEditingDonor] = useState<Donor | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [bloodTypeFilter, setBloodTypeFilter] = useState('all');

  // Real-time viability ticker to force re-render every 30s
  const [viabilityTick, setViabilityTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setViabilityTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    loadDonors();
  }, []);

  useEffect(() => {
    filterDonors();
  }, [donors, searchTerm, statusFilter, bloodTypeFilter]);

  const loadDonors = async () => {
    try {
      const data = await apiService.getDonors();
      setDonors(data);
    } catch (error) {
      console.error('Error loading donors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDonors = () => {
    let filtered = donors;

    if (searchTerm) {
      filtered = filtered.filter(donor =>
        donor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        donor.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(donor => donor.status === statusFilter);
    }

    if (bloodTypeFilter !== 'all') {
      filtered = filtered.filter(donor => donor.blood_type === bloodTypeFilter);
    }

    setFilteredDonors(filtered);
  };

  const handleSubmit = async (donorData: Omit<Donor, 'id' | 'created_at' | 'updated_at'>) => {
    setFormLoading(true);
    try {
      if (editingDonor) {
        await apiService.updateDonor(editingDonor.id, donorData);
      } else {
        await apiService.createDonor(donorData);
      }
      await loadDonors();
      setShowForm(false);
      setEditingDonor(null);
    } catch (error) {
      console.error('Error saving donor:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (donor: Donor) => {
    setEditingDonor(donor);
    setShowForm(true);
  };

  const handleDelete = async (donor: Donor) => {
    if (window.confirm(`Are you sure you want to delete donor "${donor.name}"?`)) {
      try {
        await apiService.deleteDonor(donor.id);
        await loadDonors();
      } catch (error) {
        console.error('Error deleting donor:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'allocated': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'declined': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Helpers to compute remaining viability per donor
  const VIABILITY_DEFAULTS: Record<string, number> = { kidney: 24, heart: 6, liver: 12 };
  const getIschemiaStartAt = (donor: Donor) => {
    const anyDonor = donor as any;
    return anyDonor.ischemia_start_at || anyDonor.updated_at || anyDonor.created_at;
  };
  const computeRemaining = (donor: Donor) => {
    const firstOrgan = donor.organs_available?.[0] as keyof typeof VIABILITY_DEFAULTS | undefined;
    const limit = donor.cold_ischemia_time_hours ?? (firstOrgan ? VIABILITY_DEFAULTS[firstOrgan] : 24);
    const startIso = getIschemiaStartAt(donor);
    if (!startIso) return limit;
    const elapsedHrs = Math.max(0, (Date.now() - new Date(startIso).getTime()) / (1000 * 60 * 60));
    return Math.max(0, Math.round((limit - elapsedHrs) * 10) / 10);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Donors</h1>
          <p className="text-gray-600 mt-2">Manage donor profiles and organ availability</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Donor</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search donors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="allocated">Allocated</option>
              <option value="expired">Expired</option>
              <option value="declined">Declined</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Blood Type</label>
            <select
              value={bloodTypeFilter}
              onChange={(e) => setBloodTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="all">All Blood Types</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{filteredDonors.length}</span> of{' '}
              <span className="font-medium">{donors.length}</span> donors
            </div>
          </div>
        </div>
      </div>

      {/* Donors List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredDonors.length === 0 ? (
          <div className="p-8 text-center">
            <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No donors found</h3>
            <p className="text-gray-500">
              {donors.length === 0 ? 'Get started by adding your first donor.' : 'Try adjusting your filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Donor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Blood Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organs Available
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cold Ischemia Time
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
                {filteredDonors.map((donor) => {
                  // Recompute on each render; viabilityTick triggers periodic refresh
                  void viabilityTick;
                  const citSet = donor.cold_ischemia_time_hours != null;
                  const remaining = computeRemaining(donor);
                  const isExpired = citSet && remaining <= 0;
                  const isNearExpiry = citSet && remaining > 0 && remaining <= 1;

                  return (
                    <tr key={donor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{donor.name}</div>
                          <div className="text-sm text-gray-500">
                            Age {donor.age} • {donor.location || 'Location not specified'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {donor.blood_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {donor.organs_available.map(organ => (
                            <span key={organ} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 capitalize">
                              {organ}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1 text-gray-700">
                          <Clock className="h-4 w-4" />
                          <span className={`text-sm font-medium ${isExpired ? 'text-red-600' : isNearExpiry ? 'text-yellow-600' : ''}`}>
                            {citSet ? (isExpired ? 'Expired' : `${remaining.toFixed(1)} hours`) : 'N/A'}
                          </span>
                          {citSet && (isExpired || isNearExpiry) && (
                            <AlertCircle className={`h-4 w-4 ${isExpired ? 'text-red-500' : 'text-yellow-500'}`} />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(donor.status)}`}>
                          {donor.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(donor)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(donor)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <DonorForm
          donor={editingDonor ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingDonor(null);
          }}
          loading={formLoading}
        />
      )}
    </div>
  );
}