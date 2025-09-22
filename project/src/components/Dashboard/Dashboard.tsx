import React, { useEffect, useState } from 'react';
import { Heart, Users, Activity, AlertTriangle, TrendingUp } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { apiService } from '../../services/api.service';

interface DashboardStats {
  total_donors: number;
  total_recipients: number;
  total_allocations: number;
  urgent_recipients: number;
  donors_by_status: {
    available: number;
    allocated: number;
    expired: number;
    declined: number;
  };
  recipients_by_status: {
    active: number;
    transplanted: number;
    removed: number;
    deceased: number;
  };
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await apiService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-gray-500">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of organ matching system</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Donors"
          value={stats.total_donors}
          icon={Heart}
          color="red"
          subtitle={`${stats.donors_by_status.available} available`}
        />
        <StatsCard
          title="Total Recipients"
          value={stats.total_recipients}
          icon={Users}
          color="blue"
          subtitle={`${stats.recipients_by_status.active} active`}
        />
        <StatsCard
          title="Successful Matches"
          value={stats.total_allocations}
          icon={Activity}
          color="green"
          subtitle="All-time allocations"
        />
        <StatsCard
          title="Urgent Cases"
          value={stats.urgent_recipients}
          icon={AlertTriangle}
          color="yellow"
          subtitle="High priority recipients"
        />
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Donor Status Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Donor Status Breakdown</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Available</span>
              </div>
              <span className="font-semibold text-gray-900">{stats.donors_by_status.available}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">Allocated</span>
              </div>
              <span className="font-semibold text-gray-900">{stats.donors_by_status.allocated}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-700">Expired</span>
              </div>
              <span className="font-semibold text-gray-900">{stats.donors_by_status.expired}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span className="text-gray-700">Declined</span>
              </div>
              <span className="font-semibold text-gray-900">{stats.donors_by_status.declined}</span>
            </div>
          </div>
        </div>

        {/* Recipient Status Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recipient Status Breakdown</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">Active (Waiting)</span>
              </div>
              <span className="font-semibold text-gray-900">{stats.recipients_by_status.active}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Transplanted</span>
              </div>
              <span className="font-semibold text-gray-900">{stats.recipients_by_status.transplanted}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-700">Removed</span>
              </div>
              <span className="font-semibold text-gray-900">{stats.recipients_by_status.removed}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span className="text-gray-700">Deceased</span>
              </div>
              <span className="font-semibold text-gray-900">{stats.recipients_by_status.deceased}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <TrendingUp className="h-6 w-6" />
          <h3 className="text-lg font-semibold">System Performance</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm opacity-90">Match Success Rate</p>
            <p className="text-2xl font-bold">
              {stats.total_recipients > 0 
                ? Math.round((stats.recipients_by_status.transplanted / stats.total_recipients) * 100) 
                : 0}%
            </p>
          </div>
          <div>
            <p className="text-sm opacity-90">Available Donors</p>
            <p className="text-2xl font-bold">{stats.donors_by_status.available}</p>
          </div>
          <div>
            <p className="text-sm opacity-90">Waiting Recipients</p>
            <p className="text-2xl font-bold">{stats.recipients_by_status.active}</p>
          </div>
        </div>
      </div>
    </div>
  );
}