import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';

interface AuthContextValue {
  user: User | null;
  idToken: string | null;
  isAuthLoading: boolean;
  signInWithGoogle: () => Promise<{ user: User; token: string } | null>;
  signOutUser: () => Promise<void>;
  getFreshToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  // ID token stored strictly in memory (never localStorage)
  const [idToken, setIdToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          setIdToken(token);
          // Sync authenticated user profile with PostgreSQL users table
          fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        } catch {
          setIdToken(null);
        }
      } else {
        setIdToken(null);
      }
      setIsAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const token = await result.user.getIdToken();
    setUser(result.user);
    setIdToken(token);
    await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { user: result.user, token };
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    setIdToken(null);
  }, []);

  const getFreshToken = useCallback(async () => {
    if (!auth.currentUser) return null;
    try {
      const token = await auth.currentUser.getIdToken();
      setIdToken(token);
      return token;
    } catch {
      return null;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        idToken,
        isAuthLoading,
        signInWithGoogle,
        signOutUser,
        getFreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
