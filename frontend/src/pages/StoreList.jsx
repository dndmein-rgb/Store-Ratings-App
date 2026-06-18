import { useEffect, useState } from 'react';
import api from '../api/client';
import StarRating from '../components/StarRating';

export default function StoreList() {
  const [stores, setStores] = useState([]);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingStoreId, setSavingStoreId] = useState(null);

  async function loadStores(overrides = {}) {
    setLoading(true);
    setError('');
    try {
      const effectiveSortBy = overrides.sortBy ?? sortBy;
      const effectiveSortOrder = overrides.sortOrder ?? sortOrder;
      const params = { sortBy: effectiveSortBy, sortOrder: effectiveSortOrder };
      if (name) params.name = name;
      if (address) params.address = address;

      const res = await api.get('/user/stores', { params });
      setStores(res.data.stores);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load stores');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get('/user/stores', { params: { sortBy: 'name', sortOrder: 'asc' } })
      .then((res) => {
        if (active) setStores(res.data.stores);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'Could not load stores');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    loadStores();
  }

  function handleSortByChange(e) {
    const value = e.target.value;
    setSortBy(value);
    loadStores({ sortBy: value });
  }

  function handleSortOrderChange(e) {
    const value = e.target.value;
    setSortOrder(value);
    loadStores({ sortOrder: value });
  }

  async function handleRate(storeId, rating) {
    setSavingStoreId(storeId);
    try {
      await api.post(`/user/stores/${storeId}/rating`, { rating });
      await loadStores();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save your rating');
    } finally {
      setSavingStoreId(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      <div className="flex justify-between items-center mb-4">
        <h1>Stores</h1>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex gap-3 mb-4 flex-wrap items-end">
        <div className="field mb-0 min-w-40">
          <label htmlFor="search-name" className="block text-xs font-medium text-gray-600 mb-1">Store name</label>
          <input id="search-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Search by name" className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
        </div>
        <div className="field mb-0 min-w-40">
          <label htmlFor="search-address" className="block text-xs font-medium text-gray-600 mb-1">Address</label>
          <input id="search-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Search by address" className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
        </div>
        <div className="field mb-0 min-w-40">
          <label htmlFor="sort-by" className="block text-xs font-medium text-gray-600 mb-1">Sort by</label>
          <select id="sort-by" value={sortBy} onChange={handleSortByChange} className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
            <option value="name">Name</option>
            <option value="rating">Overall rating</option>
          </select>
        </div>
        <div className="field mb-0 min-w-40">
          <label htmlFor="sort-order" className="block text-xs font-medium text-gray-600 mb-1">Order</label>
          <select id="sort-order" value={sortOrder} onChange={handleSortOrderChange} className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
        <button type="submit" className="btn btn-secondary">Search</button>
      </form>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p className="text-muted">Loading stores...</p>
      ) : stores.length === 0 ? (
        <div className="empty-state">No stores found.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-auto-fill md:min-w-72">
          {stores.map((store) => (
            <div key={store.id} className="bg-white border border-gray-300 rounded p-4">
              <h3>{store.name}</h3>
              <div className="text-xs text-gray-600 mb-2">{store.address}</div>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                <span>
                  <span className="text-xs text-gray-600">Overall: </span>
                  <StarRating value={store.overallRating} size="sm" />
                </span>
              </div>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                <span className="text-xs text-gray-600">
                  {store.userRating ? 'Your rating' : 'Tap to rate'}
                </span>
                <StarRating
                  value={store.userRating}
                  size="sm"
                  onRate={savingStoreId === store.id ? undefined : (r) => handleRate(store.id, r)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
