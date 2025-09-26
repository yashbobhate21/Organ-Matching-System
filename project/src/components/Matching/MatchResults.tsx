import React from 'react';
import { Users, AlertTriangle, Clock, Activity, CheckCircle, XCircle, Heart } from 'lucide-react';
import { Donor, MatchResult } from '../../types';

interface MatchResultsProps {
  matches: MatchResult[];
  selectedDonor: Donor | null;
  loading: boolean;
  onCreateAllocation: (match: MatchResult) => void;
}

export function MatchResults({ matches, selectedDonor, loading, onCreateAllocation }: MatchResultsProps) {
  const getUrgencyColor = (urgencyLevel: string) => {
    switch (urgencyLevel) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'urgent': return 'text-yellow-600 bg-yellow-50';
      case 'routine': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!selectedDonor) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Donor</h3>
          <p className="text-gray-500">Choose a donor from the list to find compatible recipients.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Finding Matches</h3>
          <p className="text-gray-500">Analyzing compatibility for {selectedDonor.name}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Matches for {selectedDonor.name}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {matches.length} compatible recipient{matches.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {selectedDonor.blood_type}
            </span>
            <div className="flex space-x-1">
              {selectedDonor.organs_available.map(organ => (
                <span key={organ} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                  {organ}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {matches.length === 0 ? (
          <div className="p-8 text-center">
            <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Compatible Matches</h3>
            <p className="text-gray-500">
              No recipients found that are compatible with this donor's available organs.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {matches.map((match, index) => (
              <div key={match.recipient.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{match.recipient.name}</h4>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(match.urgency_level)}`}>
                        {match.urgency_level === 'critical' && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {match.urgency_level.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-3">
                      Age {match.recipient.age} • {match.recipient.location || 'Location not specified'}
                    </div>

                    {/* Match Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Match Score</p>
                        <p className={`text-lg font-bold ${getMatchScoreColor(match.match_score)}`}>
                          {match.match_score.toFixed(1)}%
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Risk Level</p>
                        <p className={`text-sm font-semibold capitalize ${getRiskColor(match.risk_level)}`}>
                          {match.risk_level}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Cold Ischemia Time</p>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">
                            {match.cold_ischemia_time}
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Organ</p>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                          {match.recipient.organ_needed}
                        </span>
                      </div>
                    </div>

                    {/* Compatibility Factors */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                      <div className="flex items-center space-x-2">
                        {match.compatibility_factors.blood_compatibility ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-xs text-gray-600">Blood Compatible</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4 text-blue-500" />
                        <span className="text-xs text-gray-600">
                          HLA: {(match.compatibility_factors.hla_compatibility * 100).toFixed(0)}%
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {match.compatibility_factors.age_compatibility ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-xs text-gray-600">Age Compatible</span>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4">
                    <button
                      onClick={() => onCreateAllocation(match)}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                    >
                      Allocate
                    </button>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <span>Urgency Score: {match.recipient.urgency_score}/10</span>
                    <span>Risk: {match.risk_percentage?.toFixed(1)}%</span>
                    <span>Time Bonus: +{match.compatibility_factors.time_on_list_bonus.toFixed(1)}</span>
                    <span>Urgency Bonus: +{match.compatibility_factors.urgency_bonus}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}