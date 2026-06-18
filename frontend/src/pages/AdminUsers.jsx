import { useEffect, useState } from 'react';
import api from '../api/client';
import SortableHeader from '../components/SortableHeader';

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\;'/]).{8,16}$/;

function roleBadgeClass(role) {
  const baseClass = 'inline-block px-2 py-1 rounded text-xs font-medium';
  if (role === 'ADMIN') return `${baseClass} bg-red-100 text-red-900`;
  if (role === 'STORE_OWNER') return `${baseClass} bg-blue-100 text-blue-900`;
  return `${baseClass} bg-green-100 text-green-900`;
}

function roleLabel(role) {
  if (role === 'STORE_OWNER') return 'Store Owner';
  if (role === 'ADMIN') return 'Admin';
  return 'User';
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ name: '', email: '', address: '', role: '' });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
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
        const res = await api.get('/admin/users', { params });
        if (!active) return;
        setUsers(res.data.users);
        setError('');
      } catch (err) {
        if (!active) return;
        setError(err.response?.data?.message || 'Could not load users');
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

  async function viewUser(id) {
    try {
      const res = await api.get(`/admin/users/${id}`);
      setSelectedUser(res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load user details');
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      <div className="flex justify-between items-center mb-4">
        <h1>Users</h1>
        <button className="btn" onClick={() => setShowAddModal(true)}>Add user</button>
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
        <div className="field mb-0 min-w-40">
          <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
          <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
            <option value="">All</option>
            <option value="ADMIN">Admin</option>
            <option value="USER">User</option>
            <option value="STORE_OWNER">Store Owner</option>
          </select>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p className="text-muted">Loading users...</p>
      ) : users.length === 0 ? (
        <div className="empty-state">No users found.</div>
      ) : (
        <div className="bg-white border border-gray-300 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <SortableHeader field="name" label="Name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                <SortableHeader field="email" label="Email" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                <SortableHeader field="address" label="Address" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                <SortableHeader field="role" label="Role" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                <th className="text-left p-3 font-semibold text-gray-700 text-xs"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-3">{u.name}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{u.address}</td>
                  <td className="p-3"><span className={roleBadgeClass(u.role)}>{roleLabel(u.role)}</span></td>
                  <td className="p-3">
                    <button className="btn-link" onClick={() => viewUser(u.id)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onCreated={() => {
            setShowAddModal(false);
            setReloadToken((t) => t + 1);
          }}
        />
      )}

      {selectedUser && (
        <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  );
}

function AddUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', address: '', password: '', role: 'USER' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    if (!PASSWORD_REGEX.test(form.password)) {
      errs.password = '8-16 characters, one uppercase letter, one special character';
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
      await api.post('/admin/users', form);
      onCreated();
    } catch (err) {
      if (err.response?.data?.errors) {
        const serverErrors = {};
        err.response.data.errors.forEach((e) => {
          serverErrors[e.field] = e.message;
        });
        setErrors(serverErrors);
      } else {
        setServerError(err.response?.data?.message || 'Could not create user');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-35 flex items-center justify-center p-5 z-50">
      <div className="bg-white rounded p-6 max-w-lg w-full max-h-screen overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2>Add user</h2>
          <button className="btn-link" onClick={onClose}>Close</button>
        </div>

        {serverError && <div className="alert alert-error">{serverError}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Name</label>
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
            <label>Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            {errors.password && <div className="field-error">{errors.password}</div>}
          </div>
          <div className="field">
            <label>Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
              <option value="STORE_OWNER">Store Owner</option>
            </select>
          </div>

          <button type="submit" className="btn w-full" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create user'}
          </button>
        </form>
      </div>
    </div>
  );
}

function UserDetailModal({ user, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-35 flex items-center justify-center p-5 z-50" onClick={onClose}>
      <div className="bg-white rounded p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2>{user.name}</h2>
          <button className="btn-link" onClick={onClose}>Close</button>
        </div>

        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Address:</strong> {user.address}</p>
        <p><strong>Role:</strong> <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-900">{roleLabel(user.role)}</span></p>
        {user.role === 'STORE_OWNER' && (
          <p><strong>Store rating:</strong> {user.rating !== null ? user.rating.toFixed(1) : 'No ratings yet'}</p>
        )}
      </div>
    </div>
  );
}
