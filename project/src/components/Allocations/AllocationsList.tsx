import React, { useEffect, useState } from 'react';
import { Search, Calendar, User, Heart, Clock, Edit, Trash2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Allocation, Donor, Recipient } from '../../types';
import { apiService } from '../../services/api.service';
import { AllocationDetailsModal } from './AllocationDetailsModal';

type AllocationWithDetails = Allocation & {
  donor: Donor;
  recipient: Recipient;
};

export function AllocationsList() {
  const [allocations, setAllocations] = useState<AllocationWithDetails[]>([]);
  const [filteredAllocations, setFilteredAllocations] = useState<AllocationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [organFilter, setOrganFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [selectedAllocation, setSelectedAllocation] = useState<AllocationWithDetails | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadAllocations();
  }, []);

  useEffect(() => {
    filterAllocations();
  }, [allocations, searchTerm, statusFilter, organFilter, riskFilter]);

  const loadAllocations = async () => {
    try {
      const data = await apiService.getAllocations();
      setAllocations(data);
    } catch (error) {
      console.error('Error loading allocations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAllocations = () => {
    let filtered = allocations;

    if (searchTerm) {
      filtered = filtered.filter(allocation =>
        allocation.donor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        allocation.recipient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        allocation.organ_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(allocation => allocation.status === statusFilter);
    }

    if (organFilter !== 'all') {
      filtered = filtered.filter(allocation => allocation.organ_type === organFilter);
    }

    if (riskFilter !== 'all') {
      filtered = filtered.filter(allocation => allocation.risk_level === riskFilter);
    }

    setFilteredAllocations(filtered);
  };

  const handleViewDetails = (allocation: AllocationWithDetails) => {
    setSelectedAllocation(allocation);
    setShowDetailsModal(true);
  };

  const handleUpdateStatus = async (allocationId: string, newStatus: Allocation['status']) => {
    try {
      await apiService.updateAllocation(allocationId, { status: newStatus });
      await loadAllocations();
    } catch (error) {
      console.error('Error updating allocation status:', error);
    }
  };

  const handleDeleteAllocation = async (allocation: AllocationWithDetails) => {
    if (window.confirm(`Are you sure you want to delete the allocation for ${allocation.recipient.name}?`)) {
      try {
        await apiService.deleteAllocation(allocation.id);
        await loadAllocations();
      } catch (error) {
        console.error('Error deleting allocation:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getUrgencyColor = (urgencyLevel: string) => {
    switch (urgencyLevel) {
      case 'routine': return 'text-green-600 bg-green-50';
      case 'urgent': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
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

  const getTimeUntilTransplant = (scheduledDate: string | null) => {
    if (!scheduledDate) return null;
    
    const now = new Date();
    const scheduled = new Date(scheduledDate);
    const diffMs = scheduled.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 0) return 'Overdue';
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.floor(diffHours / 24)}d`;
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Allocations</h1>
        <p className="text-gray-600 mt-2">Manage organ allocations and transplant scheduling</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Allocations</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{allocations.length}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <Heart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {allocations.filter(a => a.status === 'pending').length}
              </p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {allocations.filter(a => a.status === 'completed').length}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">High Risk</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {allocations.filter(a => a.risk_level === 'high').length}
              </p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search allocations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Organ Type</label>
            <select
              value={organFilter}
              onChange={(e) => setOrganFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Organs</option>
              <option value="kidney">Kidney</option>
              <option value="liver">Liver</option>
              <option value="heart">Heart</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>
          </div>

          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{filteredAllocations.length}</span> of{' '}
              <span className="font-medium">{allocations.length}</span> allocations
            </div>
          </div>
        </div>
      </div>

      {/* Allocations List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredAllocations.length === 0 ? (
          <div className="p-8 text-center">
            <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No allocations found</h3>
            <p className="text-gray-500">
              {allocations.length === 0 ? 'No allocations have been created yet.' : 'Try adjusting your filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Allocation Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Match Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transplant Schedule
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
                {filteredAllocations.map((allocation) => {
                  const timeUntilTransplant = getTimeUntilTransplant(allocation.transplant_scheduled);
                  
                  return (
                    <tr key={allocation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {allocation.donor.name} → {allocation.recipient.name}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                              {allocation.organ_type}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(allocation.allocated_at)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-green-600">
                              {allocation.match_score.toFixed(1)}% match
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs font-medium capitalize ${getRiskColor(allocation.risk_level)}`}>
                              {allocation.risk_level} risk
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getUrgencyColor(allocation.urgency_level)}`}>
                              {allocation.urgency_level}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {allocation.transplant_scheduled ? (
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-900">
                                {formatDate(allocation.transplant_scheduled)}
                              </span>
                            </div>
                            {timeUntilTransplant && (
                              <div className={`text-xs font-medium ${
                                timeUntilTransplant === 'Overdue' ? 'text-red-600' : 
                                timeUntilTransplant.includes('h') ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {timeUntilTransplant === 'Overdue' ? 'Overdue' : `In ${timeUntilTransplant}`}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 italic">Not scheduled</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(allocation.status)}`}>
                            {allocation.status}
                          </span>
                          {allocation.status === 'pending' && (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleUpdateStatus(allocation.id, 'confirmed')}
                                className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(allocation.id, 'cancelled')}
                                className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewDetails(allocation)}
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => handleDeleteAllocation(allocation)}
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

      {/* Details Modal */}
      {showDetailsModal && selectedAllocation && (
        <AllocationDetailsModal
          allocation={{
            ...selectedAllocation,
            donor: selectedAllocation.donor || { name: 'Unknown Donor', age: 0, blood_type: 'O+', location: 'Unknown' },
            recipient: selectedAllocation.recipient || { name: 'Unknown Recipient', age: 0, blood_type: 'O+', organ_needed: 'kidney', urgency_score: 0 },
          }}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedAllocation(null);
          }}
          onUpdate={loadAllocations}
        />
      )}
    </div>
  );
}