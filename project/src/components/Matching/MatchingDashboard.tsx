import React, { useEffect, useState } from 'react';
import { Search, Heart, Users, Activity, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { Donor, Recipient, MatchResult } from '../../types';
import { apiService } from '../../services/api.service';
import { DonorSelector } from './DonorSelector';
import { MatchResults } from './MatchResults';
import { AllocationModal } from './AllocationModal';

export function MatchingDashboard() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);

  useEffect(() => {
    loadDonors();
  }, []);

  const loadDonors = async () => {
    setLoading(true);
    try {
      const data = await apiService.getDonors();
      const availableDonors = data.filter(d => d.status === 'available');
      setDonors(availableDonors);
    } catch (error) {
      console.error('Error loading donors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDonorSelect = async (donor: Donor) => {
    setSelectedDonor(donor);
    setMatchingLoading(true);
    try {
      const matchResults = await apiService.findMatches(donor.id);
      setMatches(matchResults);
    } catch (error) {
      console.error('Error finding matches:', error);
      setMatches([]);
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleCreateAllocation = (match: MatchResult) => {
    setSelectedMatch(match);
    setShowAllocationModal(true);
  };

  const handleAllocationComplete = () => {
    setShowAllocationModal(false);
    setSelectedMatch(null);
    // Refresh donors list to update status
    loadDonors();
    // Clear current matches
    setMatches([]);
    setSelectedDonor(null);
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
        <h1 className="text-3xl font-bold text-gray-900">Organ Matching</h1>
        <p className="text-gray-600 mt-2">Find compatible recipients for available donors</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Available Donors</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{donors.length}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <Heart className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Selected Donor</p>
              <p className="text-lg font-semibold text-gray-900 mt-2">
                {selectedDonor ? selectedDonor.name : 'None'}
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Potential Matches</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{matches.length}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">High Priority</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {matches.filter(m => m.urgency_level === 'critical').length}
              </p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Donor Selection */}
        <div className="lg:col-span-1">
          <DonorSelector
            donors={donors}
            selectedDonor={selectedDonor}
            onDonorSelect={handleDonorSelect}
            loading={matchingLoading}
          />
        </div>

        {/* Match Results */}
        <div className="lg:col-span-2">
          <MatchResults
            matches={matches}
            selectedDonor={selectedDonor}
            loading={matchingLoading}
            onCreateAllocation={handleCreateAllocation}
          />
        </div>
      </div>

      {/* Allocation Modal */}
      {showAllocationModal && selectedMatch && selectedDonor && (
        <AllocationModal
          donor={selectedDonor}
          match={selectedMatch}
          onClose={() => setShowAllocationModal(false)}
          onComplete={handleAllocationComplete}
        />
      )}
    </div>
  );
}