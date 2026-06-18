import { useEffect, useState } from 'react';
import api from '../api/client';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/dashboard')
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load dashboard'));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      <h1>Dashboard</h1>

      {error && <div className="alert alert-error">{error}</div>}

      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-6 md:grid-cols-1">
          <div className="bg-white border border-gray-300 rounded p-5">
            <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
            <div className="text-xs text-gray-600 mt-1">Total users</div>
          </div>
          <div className="bg-white border border-gray-300 rounded p-5">
            <div className="text-2xl font-bold text-gray-900">{stats.totalStores}</div>
            <div className="text-xs text-gray-600 mt-1">Total stores</div>
          </div>
          <div className="bg-white border border-gray-300 rounded p-5">
            <div className="text-2xl font-bold text-gray-900">{stats.totalRatings}</div>
            <div className="text-xs text-gray-600 mt-1">Ratings submitted</div>
          </div>
        </div>
      )}
    </div>
  );
}
