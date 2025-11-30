import React, { createContext, useContext, useState, useEffect } from 'react';
import { authLogin, authRegister } from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const raw = localStorage.getItem('minebot_auth');
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (auth) localStorage.setItem('minebot_auth', JSON.stringify(auth));
    else localStorage.removeItem('minebot_auth');
  }, [auth]);

  const login = async (email, password) => {
    const res = await authLogin(email, password);
    setAuth(res);
    return res;
  };
  const register = async (email, username, password) => {
    const res = await authRegister(email, username, password);
    setAuth(res);
    return res;
  };

  const logout = () => setAuth(null);

  return <AuthContext.Provider value={{ auth, token: auth?.token, user: auth?.user, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
