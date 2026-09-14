// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getUserRole } from '../services/userService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('STAFF'); // Mặc định là STAFF
  const [loading, setLoading] = useState(true);

  const fetchRole = async (currentUser) => {
    if (currentUser) {
      const userRole = await getUserRole(currentUser.uid, currentUser.email);
      setRole(userRole);
    } else {
      setRole('STAFF');
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchRole(currentUser);
      } else {
        setRole('STAFF');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshRole = async () => {
    if (user) {
      await fetchRole(user);
    }
  };

  const isAdmin = role === 'ADMIN';
  const isStaff = role === 'STAFF';

  return (
    <AuthContext.Provider value={{ user, role, isAdmin, isStaff, loading, refreshRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
