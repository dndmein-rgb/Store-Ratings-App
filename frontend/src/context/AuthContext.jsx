import { createContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (stored && token) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  function login(token, userData) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  async function signup(payload) {
    const res = await api.post('/auth/signup', payload);
    login(res.data.token, res.data.user);
    return res.data;
  }

  async function loginWithCredentials(email, password) {
    const res = await api.post('/auth/login', { email, password });
    login(res.data.token, res.data.user);
    return res.data;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signup, loginWithCredentials }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
