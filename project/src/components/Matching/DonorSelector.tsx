import React, { useState } from 'react';
import { Search, Heart, Clock, MapPin } from 'lucide-react';
import { Donor } from '../../types';

interface DonorSelectorProps {
  donors: Donor[];
  selectedDonor: Donor | null;
  onDonorSelect: (donor: Donor) => void;
  loading: boolean;
}

export function DonorSelector({ donors, selectedDonor, onDonorSelect, loading }: DonorSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [bloodTypeFilter, setBloodTypeFilter] = useState('all');

  const filteredDonors = donors.filter(donor => {
    const matchesSearch = donor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         donor.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBloodType = bloodTypeFilter === 'all' || donor.blood_type === bloodTypeFilter;
    return matchesSearch && matchesBloodType;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Donor</h3>
        
        {/* Search and Filters */}
        <div className="space-y-4">
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
      </div>

      <div className="max-h-96 overflow-y-auto">
        {filteredDonors.length === 0 ? (
          <div className="p-6 text-center">
            <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No donors found</h3>
            <p className="text-gray-500">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredDonors.map((donor) => {
              const isSelected = selectedDonor?.id === donor.id;
              
              return (
                <button
                  key={donor.id}
                  onClick={() => onDonorSelect(donor)}
                  disabled={loading}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors disabled:opacity-50 ${
                    isSelected ? 'bg-red-50 border-r-4 border-red-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-900">{donor.name}</h4>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {donor.blood_type}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        Age {donor.age} • {donor.location || 'Location not specified'}
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mb-2">
                        {donor.organs_available.map(organ => (
                          <span key={organ} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 capitalize">
                            {organ}
                          </span>
                        ))}
                      </div>
                      
                      <div className={`flex items-center space-x-1 ${donor.cold_ischemia_time_hours && donor.cold_ischemia_time_hours <= 6 ? 'text-red-600' : 'text-gray-600'}`}>
                        <Clock className="h-3 w-3" />
                        <span className="text-xs font-medium">
                          {donor.cold_ischemia_time_hours ? `${donor.cold_ischemia_time_hours}h ischemia time` : 'Ischemia time not set'}
                        </span>
                      </div>
                    </div>
                    
                    {isSelected && loading && (
                      <div className="ml-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}