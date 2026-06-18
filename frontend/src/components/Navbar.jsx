import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  if (!user) return null;

  return (
    <header className="bg-white border-b border-gray-300">
      <div className="max-w-5xl mx-auto px-5 h-14 flex items-center gap-7">
        <Link to="/" className="font-bold text-base text-gray-900 hover:no-underline">Store Ratings</Link>

        <nav className="flex gap-5 flex-1">
          {user.role === 'ADMIN' && (
            <>
              <Link to="/admin" className="text-gray-700 text-sm hover:text-amber-700 hover:no-underline">Dashboard</Link>
              <Link to="/admin/users" className="text-gray-700 text-sm hover:text-amber-700 hover:no-underline">Users</Link>
              <Link to="/admin/stores" className="text-gray-700 text-sm hover:text-amber-700 hover:no-underline">Stores</Link>
            </>
          )}

          {user.role === 'USER' && (
            <>
              <Link to="/stores" className="text-gray-700 text-sm hover:text-amber-700 hover:no-underline">Stores</Link>
              <Link to="/account" className="text-gray-700 text-sm hover:text-amber-700 hover:no-underline">Account</Link>
            </>
          )}

          {user.role === 'STORE_OWNER' && (
            <Link to="/owner" className="text-gray-700 text-sm hover:text-amber-700 hover:no-underline">Dashboard</Link>
          )}
        </nav>

        <div className="flex items-center gap-4 text-sm text-gray-700">
          <span className="font-medium text-gray-900">{user.name}</span>
          <button onClick={handleLogout} className="btn-link">Log out</button>
        </div>
      </div>
    </header>
  );
}
