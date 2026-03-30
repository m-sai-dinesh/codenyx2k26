import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('edu_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  // Verify token on mount and sync user from server
  useEffect(() => {
    const token = localStorage.getItem('edu_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.get('/auth/me')
      .then(({ data }) => {
        localStorage.setItem('edu_user', JSON.stringify(data.user));
        setUser(data.user);
      })
      .catch(() => {
        localStorage.removeItem('edu_token');
        localStorage.removeItem('edu_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('edu_token', data.token);
      localStorage.setItem('edu_user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  // Used by OAuthSuccess to store session after Google redirect
  const loginWithToken = useCallback(async (token) => {
    localStorage.setItem('edu_token', token);
    const { data } = await api.get('/auth/me');
    localStorage.setItem('edu_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const registerStudent = async (formData) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register/student', formData);
      localStorage.setItem('edu_token', data.token);
      localStorage.setItem('edu_user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const registerVolunteer = async (formData) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register/volunteer', formData);
      localStorage.setItem('edu_token', data.token);
      localStorage.setItem('edu_user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('edu_token');
    localStorage.removeItem('edu_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithToken, logout, registerStudent, registerVolunteer }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
