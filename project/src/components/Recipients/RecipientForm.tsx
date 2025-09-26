import React, { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { Recipient, BloodType, OrganType, UNOSStatus, Gender } from '../../types';

interface RecipientFormProps {
  recipient?: Recipient;
  onSubmit: (recipient: Omit<Recipient, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const ORGAN_TYPES: OrganType[] = ['kidney', 'liver', 'heart'];
const UNOS_STATUSES: UNOSStatus[] = ['1A', '1B', '2', '3', '4', '7'];

export function RecipientForm({ recipient, onSubmit, onCancel, loading }: RecipientFormProps) {
  const [formData, setFormData] = useState({
    name: recipient?.name || '',
    age: recipient?.age?.toString() || '',
    gender: recipient?.gender || 'male' as Gender,
    blood_type: recipient?.blood_type || 'O+' as BloodType,
    organ_needed: recipient?.organ_needed || 'kidney' as OrganType,
    hla_typing: recipient?.hla_typing || {
      'HLA-A': [],
      'HLA-B': [],
      'HLA-C': [],
      'HLA-DR': [],
      'HLA-DQ': [],
      'HLA-DP': [],
    },
    urgency_score: recipient?.urgency_score?.toString() || '1',
    medical_history: recipient?.medical_history || '',
    height_cm: recipient?.height_cm?.toString() || '',
    weight_kg: recipient?.weight_kg?.toString() || '',
    meld_score: recipient?.meld_score?.toString() || '',
    unos_status: recipient?.unos_status || '',
    location: recipient?.location || '',
  });

  const [hlaInput, setHlaInput] = useState('');
  const [selectedHlaType, setSelectedHlaType] = useState('HLA-A');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      age: Number(formData.age),
      urgency_score: Number(formData.urgency_score),
      height_cm: formData.height_cm ? Number(formData.height_cm) : null,
      weight_kg: formData.weight_kg ? Number(formData.weight_kg) : null,
      meld_score: formData.meld_score ? Number(formData.meld_score) : null,
      unos_status: (formData.unos_status as UNOSStatus) || null,
      status: 'active' as const,
    };

    await onSubmit(submitData);
  };

  const handleOrganChange = (organ: OrganType) => {
    setFormData({
      ...formData,
      organ_needed: organ,
      meld_score: '',
      unos_status: '',
    });
  };

  const addHlaAllele = () => {
    if (hlaInput.trim()) {
      const currentAlleles = formData.hla_typing[selectedHlaType] || [];
      if (!currentAlleles.includes(hlaInput.trim())) {
        setFormData({
          ...formData,
          hla_typing: {
            ...formData.hla_typing,
            [selectedHlaType]: [...currentAlleles, hlaInput.trim()]
          }
        });
      }
      setHlaInput('');
    }
  };

  const removeHlaAllele = (hlaType: string, allele: string) => {
    setFormData({
      ...formData,
      hla_typing: {
        ...formData.hla_typing,
        [hlaType]: formData.hla_typing[hlaType].filter(a => a !== allele)
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {recipient ? 'Edit Recipient' : 'Add New Recipient'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter recipient's full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age *
              </label>
              <input
                type="number"
                required
                min="0"
                max="120"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Age"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender *
              </label>
              <div className="flex items-center space-x-4 pt-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === 'male'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="text-blue-500 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Male</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === 'female'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="text-blue-500 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Female</span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blood Type *
              </label>
              <select
                required
                value={formData.blood_type}
                onChange={(e) => setFormData({ ...formData, blood_type: e.target.value as BloodType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {BLOOD_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organ Needed *
              </label>
              <select
                required
                value={formData.organ_needed}
                onChange={(e) => handleOrganChange(e.target.value as OrganType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {ORGAN_TYPES.map(organ => (
                  <option key={organ} value={organ} className="capitalize">{organ}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Physical Measurements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Height (cm)
              </label>
              <input
                type="number"
                min="50"
                max="250"
                value={formData.height_cm}
                onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Height in centimeters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight (kg)
              </label>
              <input
                type="number"
                min="20"
                max="300"
                value={formData.weight_kg}
                onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Weight in kilograms"
              />
            </div>
          </div>

          {/* Medical Scores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urgency Score (1-10) *
              </label>
              <input
                type="number"
                required
                min="1"
                max="10"
                value={formData.urgency_score}
                onChange={(e) => setFormData({ ...formData, urgency_score: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="1-10"
              />
            </div>

            {formData.organ_needed === 'liver' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  MELD Score (6-40)
                </label>
                <input
                  type="number"
                  min="6"
                  max="40"
                  value={formData.meld_score}
                  onChange={(e) => setFormData({ ...formData, meld_score: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="For liver recipients"
                />
              </div>
            )}

            {(formData.organ_needed === 'heart' || formData.organ_needed === 'liver') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  UNOS Status
                </label>
                <select
                  value={formData.unos_status}
                  onChange={(e) => setFormData({ ...formData, unos_status: e.target.value as UNOSStatus | '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select status</option>
                  {UNOS_STATUSES.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Hospital/City"
            />
          </div>

          {/* HLA Typing */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              HLA Typing
            </label>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <select
                  value={selectedHlaType}
                  onChange={(e) => setSelectedHlaType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.keys(formData.hla_typing).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={hlaInput}
                  onChange={(e) => setHlaInput(e.target.value)}
                  placeholder="Enter allele (e.g., A*01:01)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHlaAllele())}
                />
                <button
                  type="button"
                  onClick={addHlaAllele}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(formData.hla_typing).map(([hlaType, alleles]) => (
                  <div key={hlaType} className="border border-gray-200 rounded-lg p-3">
                    <h4 className="font-medium text-gray-900 mb-2">{hlaType}</h4>
                    <div className="space-y-1">
                      {alleles.map(allele => (
                        <div key={allele} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded">
                          <span className="text-sm text-gray-700">{allele}</span>
                          <button
                            type="button"
                            onClick={() => removeHlaAllele(hlaType, allele)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {alleles.length === 0 && (
                        <p className="text-sm text-gray-400 italic">No alleles added</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medical History
            </label>
            <textarea
              rows={4}
              value={formData.medical_history}
              onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Enter relevant medical history, conditions, medications, etc."
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (recipient ? 'Update Recipient' : 'Add Recipient')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}