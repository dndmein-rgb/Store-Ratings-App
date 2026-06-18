import { useEffect, useState } from 'react';
import api from '../api/client';
import SortableHeader from '../components/SortableHeader';
import StarRating from '../components/StarRating';

export default function AdminStores() {
  const [stores, setStores] = useState([]);
  const [filters, setFilters] = useState({ name: '', email: '', address: '' });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);

    async function run() {
      try {
        const params = { sortBy, sortOrder };
        Object.entries(filters).forEach(([k, v]) => {
          if (v) params[k] = v;
        });
        const res = await api.get('/admin/stores', { params });
        if (!active) return;
        setStores(res.data.stores);
        setError('');
      } catch (err) {
        if (!active) return;
        setError(err.response?.data?.message || 'Could not load stores');
      } finally {
        if (active) setLoading(false);
      }
    }

    run();
    return () => {
      active = false;
    };
  }, [filters, sortBy, sortOrder, reloadToken]);

  function handleSort(field) {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      <div className="flex justify-between items-center mb-4">
        <h1>Stores</h1>
        <button className="btn" onClick={() => setShowAddModal(true)}>Add store</button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap items-end">
        <div className="field mb-0 min-w-40">
          <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
          <input value={filters.name} onChange={(e) => setFilters({ ...filters, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
        </div>
        <div className="field mb-0 min-w-40">
          <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
          <input value={filters.email} onChange={(e) => setFilters({ ...filters, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
        </div>
        <div className="field mb-0 min-w-40">
          <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
          <input value={filters.address} onChange={(e) => setFilters({ ...filters, address: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p className="text-muted">Loading stores...</p>
      ) : stores.length === 0 ? (
        <div className="empty-state">No stores found.</div>
      ) : (
        <div className="bg-white border border-gray-300 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <SortableHeader field="name" label="Name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                <SortableHeader field="email" label="Email" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                <SortableHeader field="address" label="Address" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                <SortableHeader field="rating" label="Rating" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {stores.map((s) => (
                <tr key={s.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-3">{s.name}</td>
                  <td className="p-3">{s.email}</td>
                  <td className="p-3">{s.address}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <StarRating value={Math.round(s.rating)} size="sm" />
                      <span className="text-muted text-xs">
                        {s.rating > 0 ? s.rating.toFixed(1) : 'No ratings'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <AddStoreModal
          onClose={() => setShowAddModal(false)}
          onCreated={() => {
            setShowAddModal(false);
            setReloadToken((t) => t + 1);
          }}
        />
      )}
    </div>
  );
}

function AddStoreModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', address: '', ownerId: '' });
  const [owners, setOwners] = useState([]);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/admin/store-owners').then((res) => setOwners(res.data.owners)).catch(() => {});
  }, []);

  function validate() {
    const errs = {};
    if (!form.name || form.name.trim().length < 20 || form.name.trim().length > 60) {
      errs.name = 'Name must be between 20 and 60 characters';
    }
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Please enter a valid email address';
    }
    if (!form.address || form.address.length > 400) {
      errs.address = 'Address is required and must not exceed 400 characters';
    }
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      await api.post('/admin/stores', {
        ...form,
        ownerId: form.ownerId ? Number(form.ownerId) : null,
      });
      onCreated();
    } catch (err) {
      if (err.response?.data?.errors) {
        const serverErrors = {};
        err.response.data.errors.forEach((e) => {
          serverErrors[e.field] = e.message;
        });
        setErrors(serverErrors);
      } else {
        setServerError(err.response?.data?.message || 'Could not create store');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-35 flex items-center justify-center p-5 z-50" onClick={onClose}>
      <div className="bg-white rounded p-6 max-w-lg w-full max-h-screen overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2>Add store</h2>
          <button className="btn-link" onClick={onClose}>Close</button>
        </div>

        {serverError && <div className="alert alert-error">{serverError}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Store name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
            {errors.name && <div className="field-error">{errors.name}</div>}
          </div>
          <div className="field">
            <label>Email</label>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            {errors.email && <div className="field-error">{errors.email}</div>}
          </div>
          <div className="field">
            <label>Address</label>
            <textarea rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            {errors.address && <div className="field-error">{errors.address}</div>}
          </div>
          <div className="field">
            <label>Owner (optional)</label>
            <select value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })}>
              <option value="">No owner assigned</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>{o.name} ({o.email})</option>
              ))}
            </select>
            <div className="field-hint">Only users with the Store Owner role appear here.</div>
          </div>

          <button type="submit" className="btn w-full" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create store'}
          </button>
        </form>
      </div>
    </div>
  );
}
