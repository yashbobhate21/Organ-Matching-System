import React, { useEffect, useState } from 'react';
import { Plus, Search, Users, Clock, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { Recipient } from '../../types';
import { apiService } from '../../services/api.service';
import { RecipientForm } from './RecipientForm';

export function RecipientList() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [filteredRecipients, setFilteredRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState<Recipient | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [organFilter, setOrganFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');

  useEffect(() => {
    loadRecipients();
  }, []);

  useEffect(() => {
    filterRecipients();
  }, [recipients, searchTerm, statusFilter, organFilter, urgencyFilter]);

  const loadRecipients = async () => {
    try {
      const data = await apiService.getRecipients();
      setRecipients(data);
    } catch (error) {
      console.error('Error loading recipients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRecipients = () => {
    let filtered = recipients;

    if (searchTerm) {
      filtered = filtered.filter(recipient =>
        recipient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipient.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(recipient => recipient.status === statusFilter);
    }

    if (organFilter !== 'all') {
      filtered = filtered.filter(recipient => recipient.organ_needed === organFilter);
    }

    if (urgencyFilter !== 'all') {
      if (urgencyFilter === 'high') {
        filtered = filtered.filter(recipient => recipient.urgency_score >= 7);
      } else if (urgencyFilter === 'medium') {
        filtered = filtered.filter(recipient => recipient.urgency_score >= 4 && recipient.urgency_score < 7);
      } else if (urgencyFilter === 'low') {
        filtered = filtered.filter(recipient => recipient.urgency_score < 4);
      }
    }

    setFilteredRecipients(filtered);
  };

  const handleSubmit = async (recipientData: Omit<Recipient, 'id' | 'created_at' | 'updated_at'>) => {
    setFormLoading(true);
    try {
      if (editingRecipient) {
        await apiService.updateRecipient(editingRecipient.id, recipientData);
      } else {
        await apiService.createRecipient(recipientData);
      }
      await loadRecipients();
      setShowForm(false);
      setEditingRecipient(null);
    } catch (error) {
      console.error('Error saving recipient:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (recipient: Recipient) => {
    setEditingRecipient(recipient);
    setShowForm(true);
  };

  const handleDelete = async (recipient: Recipient) => {
    if (window.confirm(`Are you sure you want to delete recipient "${recipient.name}"?`)) {
      try {
        await apiService.deleteRecipient(recipient.id);
        await loadRecipients();
      } catch (error) {
        console.error('Error deleting recipient:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'transplanted': return 'bg-green-100 text-green-800';
      case 'removed': return 'bg-yellow-100 text-yellow-800';
      case 'deceased': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (score: number) => {
    if (score >= 7) return 'text-red-600';
    if (score >= 4) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUrgencyLabel = (score: number) => {
    if (score >= 7) return 'Critical';
    if (score >= 4) return 'Urgent';
    return 'Routine';
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
          <h1 className="text-3xl font-bold text-gray-900">Recipients</h1>
          <p className="text-gray-600 mt-2">Manage recipient profiles and transplant needs</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Recipient</span>
        </button>
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
                placeholder="Search recipients..."
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
              <option value="active">Active</option>
              <option value="transplanted">Transplanted</option>
              <option value="removed">Removed</option>
              <option value="deceased">Deceased</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Organ Needed</label>
            <select
              value={organFilter}
              onChange={(e) => setOrganFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Organs</option>
              <option value="kidney">Kidney</option>
              <option value="liver">Liver</option>
              <option value="heart">Heart</option>
              <option value="lung">Lung</option>
              <option value="pancreas">Pancreas</option>
              <option value="kidney-pancreas">Kidney-Pancreas</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Urgency</option>
              <option value="high">Critical (7-10)</option>
              <option value="medium">Urgent (4-6)</option>
              <option value="low">Routine (1-3)</option>
            </select>
          </div>

          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{filteredRecipients.length}</span> of{' '}
              <span className="font-medium">{recipients.length}</span> recipients
            </div>
          </div>
        </div>
      </div>

      {/* Recipients List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredRecipients.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recipients found</h3>
            <p className="text-gray-500">
              {recipients.length === 0 ? 'Get started by adding your first recipient.' : 'Try adjusting your filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Blood Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organ Needed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Urgency
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
                {filteredRecipients.map((recipient) => (
                  <tr key={recipient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{recipient.name}</div>
                        <div className="text-sm text-gray-500">
                          Age {recipient.age} • {recipient.location || 'Location not specified'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {recipient.blood_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {recipient.organ_needed}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`flex items-center space-x-1 ${getUrgencyColor(recipient.urgency_score)}`}>
                        {recipient.urgency_score >= 7 && <AlertTriangle className="h-4 w-4" />}
                        <span className="text-sm font-medium">
                          {getUrgencyLabel(recipient.urgency_score)} ({recipient.urgency_score})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(recipient.status)}`}>
                        {recipient.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(recipient)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(recipient)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <RecipientForm
          recipient={editingRecipient ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingRecipient(null);
          }}
          loading={formLoading}
        />
      )}
    </div>
  );
}