import React, { useState } from 'react';
import { X, Calendar, User, Heart, Activity, AlertTriangle, Clock, FileText, Edit2, Save } from 'lucide-react';
import { Allocation, Donor, Recipient } from '../../types';
import { apiService } from '../../services/api.service';

type AllocationWithDetails = Allocation & {
  donor: Donor;
  recipient: Recipient;
};

interface AllocationDetailsModalProps {
  allocation: AllocationWithDetails;
  onClose: () => void;
  onUpdate: () => void;
}

export function AllocationDetailsModal({ allocation, onClose, onUpdate }: AllocationDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    transplant_scheduled: allocation.transplant_scheduled 
      ? new Date(allocation.transplant_scheduled).toISOString().slice(0, 16) 
      : '',
    notes: allocation.notes || '',
    status: allocation.status,
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const updateData = {
        ...formData,
        transplant_scheduled: formData.transplant_scheduled 
          ? new Date(formData.transplant_scheduled).toISOString() 
          : null,
      };
      
      await apiService.updateAllocation(allocation.id, updateData);
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating allocation:', error);
    } finally {
      setLoading(false);
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
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Heart className="h-6 w-6 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900">Allocation Details</h2>
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                <Edit2 className="h-4 w-4" />
                <span>Edit</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? 'Saving...' : 'Save'}</span>
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Allocation Overview */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{allocation.match_score.toFixed(1)}%</p>
                <p className="text-sm text-gray-600">Match Score</p>
              </div>
              <div className="text-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${getRiskColor(allocation.risk_level)}`}>
                  {allocation.risk_level}
                </span>
                <p className="text-sm text-gray-600 mt-1">Risk Level</p>
              </div>
              <div className="text-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${getUrgencyColor(allocation.urgency_level)}`}>
                  {allocation.urgency_level}
                </span>
                <p className="text-sm text-gray-600 mt-1">Urgency</p>
              </div>
              <div className="text-center">
                {isEditing ? (
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Allocation['status'] })}
                    className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                ) : (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(allocation.status)}`}>
                    {allocation.status}
                  </span>
                )}
                <p className="text-sm text-gray-600 mt-1">Status</p>
              </div>
            </div>
          </div>

          {/* Donor and Recipient Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Donor Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <User className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900">Donor Information</h3>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium text-gray-900">{allocation.donor.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Age</p>
                    <p className="font-medium text-gray-900">{allocation.donor.age}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Blood Type</p>
                    <p className="font-medium text-gray-900">{allocation.donor.blood_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium text-gray-900">{allocation.donor.location || 'Not specified'}</p>
                  </div>
                </div>
                {allocation.donor.height_cm && allocation.donor.weight_kg && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Height</p>
                      <p className="font-medium text-gray-900">{allocation.donor.height_cm} cm</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Weight</p>
                      <p className="font-medium text-gray-900">{allocation.donor.weight_kg} kg</p>
                    </div>
                  </div>
                )}
                {allocation.donor.cause_of_death && (
                  <div>
                    <p className="text-sm text-gray-500">Cause of Death</p>
                    <p className="font-medium text-gray-900">{allocation.donor.cause_of_death}</p>
                  </div>
                )}
                {allocation.donor.medical_history && (
                  <div>
                    <p className="text-sm text-gray-500">Medical History</p>
                    <p className="font-medium text-gray-900">{allocation.donor.medical_history}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recipient Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <User className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900">Recipient Information</h3>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium text-gray-900">{allocation.recipient.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Age</p>
                    <p className="font-medium text-gray-900">{allocation.recipient.age}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Blood Type</p>
                    <p className="font-medium text-gray-900">{allocation.recipient.blood_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Organ Needed</p>
                    <p className="font-medium text-gray-900 capitalize">{allocation.recipient.organ_needed}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {allocation.recipient.height_cm && (
                    <div>
                      <p className="text-sm text-gray-500">Height</p>
                      <p className="font-medium text-gray-900">{allocation.recipient.height_cm} cm</p>
                    </div>
                  )}
                  {allocation.recipient.weight_kg && (
                    <div>
                      <p className="text-sm text-gray-500">Weight</p>
                      <p className="font-medium text-gray-900">{allocation.recipient.weight_kg} kg</p>
                    </div>
                  )}
                </div>
                {allocation.recipient.medical_history && (
                  <div>
                    <p className="text-sm text-gray-500">Medical History</p>
                    <p className="font-medium text-gray-900">{allocation.recipient.medical_history}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Compatibility Analysis */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Activity className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900">Compatibility Analysis</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                  allocation.compatibility_factors.blood_compatibility ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {allocation.compatibility_factors.blood_compatibility ? (
                    <span className="text-green-600 font-bold">✓</span>
                  ) : (
                    <span className="text-red-600 font-bold">✗</span>
                  )}
                </div>
                <p className="text-xs text-gray-600">Blood Compatible</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 font-bold text-xs">
                    {Math.round(allocation.compatibility_factors.hla_compatibility * 100)}%
                  </span>
                </div>
                <p className="text-xs text-gray-600">HLA Match</p>
              </div>
              
              <div className="text-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                  allocation.compatibility_factors.age_compatibility ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {allocation.compatibility_factors.age_compatibility ? (
                    <span className="text-green-600 font-bold">✓</span>
                  ) : (
                    <span className="text-red-600 font-bold">✗</span>
                  )}
                </div>
                <p className="text-xs text-gray-600">Age Compatible</p>
              </div>
              
              <div className="text-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                  allocation.compatibility_factors.size_compatibility ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {allocation.compatibility_factors.size_compatibility ? (
                    <span className="text-green-600 font-bold">✓</span>
                  ) : (
                    <span className="text-red-600 font-bold">✗</span>
                  )}
                </div>
                <p className="text-xs text-gray-600">Size Compatible</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-2">
                  <span className="text-yellow-600 font-bold text-xs">
                    +{allocation.compatibility_factors.urgency_bonus}
                  </span>
                </div>
                <p className="text-xs text-gray-600">Urgency Bonus</p>
              </div>
              
            </div>
          </div>

          {/* Scheduling and Notes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Transplant Scheduling */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900">Transplant Schedule</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Allocated At</p>
                  <p className="font-medium text-gray-900">{formatDate(allocation.allocated_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Scheduled Transplant</p>
                  {isEditing ? (
                    <input
                      type="datetime-local"
                      value={formData.transplant_scheduled}
                      onChange={(e) => setFormData({ ...formData, transplant_scheduled: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="font-medium text-gray-900">
                      {allocation.transplant_scheduled 
                        ? formatDate(allocation.transplant_scheduled)
                        : 'Not scheduled'
                      }
                    </p>
                  )}
                </div>
                {allocation.risk_percentage && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">
                        Risk Assessment: {allocation.risk_percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
              </div>
              {isEditing ? (
                <textarea
                  rows={6}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Add notes about this allocation..."
                />
              ) : (
                <div className="min-h-[120px]">
                  {allocation.notes ? (
                    <p className="text-gray-700 whitespace-pre-wrap">{allocation.notes}</p>
                  ) : (
                    <p className="text-gray-500 italic">No notes added</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Clock className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900">Timeline</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Allocation Created</p>
                  <p className="text-sm text-gray-500">{formatDate(allocation.allocated_at)}</p>
                </div>
              </div>
              {allocation.transplant_scheduled && (
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Transplant Scheduled</p>
                    <p className="text-sm text-gray-500">{formatDate(allocation.transplant_scheduled)}</p>
                  </div>
                </div>
              )}
              {allocation.status === 'completed' && (
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Transplant Completed</p>
                    <p className="text-sm text-gray-500">Successfully completed</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}