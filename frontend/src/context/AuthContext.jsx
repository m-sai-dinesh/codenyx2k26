import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('edu_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('edu_token', data.token);
    localStorage.setItem('edu_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const registerStudent = async (formData) => {
    const { data } = await api.post('/auth/register/student', formData);
    localStorage.setItem('edu_token', data.token);
    localStorage.setItem('edu_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const registerVolunteer = async (formData) => {
    const { data } = await api.post('/auth/register/volunteer', formData);
    localStorage.setItem('edu_token', data.token);
    localStorage.setItem('edu_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('edu_token');
    localStorage.removeItem('edu_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, registerStudent, registerVolunteer }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
