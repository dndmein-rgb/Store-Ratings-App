import { useEffect, useState } from 'react';
import api from '../api/client';
import StarRating from '../components/StarRating';

export default function OwnerDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/store-owner/dashboard')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load your dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="max-w-5xl mx-auto px-5 py-8"><p className="text-muted">Loading...</p></div>;

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-5 py-8">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      <h1>{data.store.name}</h1>
      <p className="text-muted">Here's how customers are rating your store.</p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white border border-gray-300 rounded p-5">
          <div className="text-2xl font-bold text-gray-900">{data.averageRating.toFixed(1)}</div>
          <div className="text-xs text-gray-600 mt-1">Average rating</div>
          <div className="mt-2"><StarRating value={Math.round(data.averageRating)} size="sm" /></div>
        </div>
        <div className="bg-white border border-gray-300 rounded p-5">
          <div className="text-2xl font-bold text-gray-900">{data.ratingCount}</div>
          <div className="text-xs text-gray-600 mt-1">Total ratings submitted</div>
        </div>
      </div>

      <h2>Customers who rated your store</h2>

      {data.raters.length === 0 ? (
        <div className="empty-state">No ratings submitted yet.</div>
      ) : (
        <div className="bg-white border border-gray-300 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-3 font-semibold text-gray-700 text-xs">Name</th>
                <th className="text-left p-3 font-semibold text-gray-700 text-xs">Email</th>
                <th className="text-left p-3 font-semibold text-gray-700 text-xs">Rating</th>
              </tr>
            </thead>
            <tbody>
              {data.raters.map((r) => (
                <tr key={r.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-3">{r.name}</td>
                  <td className="p-3">{r.email}</td>
                  <td className="p-3"><StarRating value={r.rating} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
