import React, { useState } from 'react';
import { X, AlertTriangle, Calendar, FileText, User, Heart } from 'lucide-react';
import { Donor, MatchResult, Allocation } from '../../types';
import { apiService } from '../../services/api.service';
import { useAuth } from '../../context/AuthContext';

interface AllocationModalProps {
  donor: Donor;
  match: MatchResult;
  onClose: () => void;
  onComplete: () => void;
}

export function AllocationModal({ donor, match, onClose, onComplete }: AllocationModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    transplant_scheduled: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const allocationData: Omit<Allocation, 'id' | 'created_at'> = {
        donor_id: donor.id,
        recipient_id: match.recipient.id,
        organ_type: match.recipient.organ_needed,
        match_score: match.match_score,
        risk_level: match.risk_level,
        risk_percentage: match.risk_percentage,
        urgency_level: match.urgency_level,
        compatibility_factors: match.compatibility_factors,
        allocated_at: new Date().toISOString(),
        transplant_scheduled: formData.transplant_scheduled ? new Date(formData.transplant_scheduled).toISOString() : null,
        status: 'pending',
        notes: formData.notes || null,
        allocated_by: user?.id || null,
      };

      await apiService.createAllocation(allocationData);
      onComplete();
    } catch (error) {
      console.error('Error creating allocation:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getUrgencyColor = (urgencyLevel: string) => {
    switch (urgencyLevel) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'urgent': return 'text-yellow-600 bg-yellow-50';
      case 'routine': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create Allocation</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Match Summary */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <Heart className="h-6 w-6 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">Allocation Summary</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Donor Info */}
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <User className="h-5 w-5 text-gray-500" />
                  <h4 className="font-medium text-gray-900">Donor</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Name:</span> {donor.name}</p>
                  <p><span className="font-medium">Age:</span> {donor.age}</p>
                  <p><span className="font-medium">Blood Type:</span> {donor.blood_type}</p>
                  <p><span className="font-medium">Location:</span> {donor.location || 'Not specified'}</p>
                </div>
              </div>

              {/* Recipient Info */}
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <User className="h-5 w-5 text-gray-500" />
                  <h4 className="font-medium text-gray-900">Recipient</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Name:</span> {match.recipient.name}</p>
                  <p><span className="font-medium">Age:</span> {match.recipient.age}</p>
                  <p><span className="font-medium">Blood Type:</span> {match.recipient.blood_type}</p>
                  <p><span className="font-medium">Organ Needed:</span> {match.recipient.organ_needed}</p>
                  <p><span className="font-medium">Location:</span> {match.recipient.location || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Match Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{match.match_score.toFixed(1)}%</p>
                <p className="text-sm text-gray-600">Match Score</p>
              </div>
              <div className="text-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${getRiskColor(match.risk_level)}`}>
                  {match.risk_level}
                </span>
                <p className="text-sm text-gray-600 mt-1">Risk Level</p>
              </div>
              <div className="text-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${getUrgencyColor(match.urgency_level)}`}>
                  {match.urgency_level}
                </span>
                <p className="text-sm text-gray-600 mt-1">Urgency</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{match.viability_window}h</p>
                <p className="text-sm text-gray-600">Viability Window</p>
              </div>
            </div>
          </div>

          {/* Warning for High Risk */}
          {match.risk_level === 'high' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">High Risk Allocation</h4>
                <p className="text-sm text-red-700 mt-1">
                  This allocation has been classified as high risk ({match.risk_percentage?.toFixed(1)}% risk factor). 
                  Please ensure all medical teams are aware and prepared for potential complications.
                </p>
              </div>
            </div>
          )}

          {/* Allocation Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-2" />
                Scheduled Transplant Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.transplant_scheduled}
                onChange={(e) => setFormData({ ...formData, transplant_scheduled: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                min={new Date().toISOString().slice(0, 16)}
              />
              <p className="text-sm text-gray-500 mt-1">
                Leave empty if transplant will be scheduled later
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4 inline mr-2" />
                Additional Notes
              </label>
              <textarea
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                placeholder="Enter any additional notes, special considerations, or instructions for the medical team..."
              />
            </div>

            {/* Compatibility Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Compatibility Details</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Blood Compatible:</span>
                  <span className={`ml-2 font-medium ${match.compatibility_factors.blood_compatibility ? 'text-green-600' : 'text-red-600'}`}>
                    {match.compatibility_factors.blood_compatibility ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">HLA Match:</span>
                  <span className="ml-2 font-medium text-blue-600">
                    {(match.compatibility_factors.hla_compatibility * 100).toFixed(0)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Age Compatible:</span>
                  <span className={`ml-2 font-medium ${match.compatibility_factors.age_compatibility ? 'text-green-600' : 'text-red-600'}`}>
                    {match.compatibility_factors.age_compatibility ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Size Compatible:</span>
                  <span className={`ml-2 font-medium ${match.compatibility_factors.size_compatibility ? 'text-green-600' : 'text-red-600'}`}>
                    {match.compatibility_factors.size_compatibility ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Urgency Bonus:</span>
                  <span className="ml-2 font-medium text-yellow-600">
                    +{match.compatibility_factors.urgency_bonus}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Time Bonus:</span>
                  <span className="ml-2 font-medium text-purple-600">
                    +{match.compatibility_factors.time_on_list_bonus.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Allocation...' : 'Confirm Allocation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}