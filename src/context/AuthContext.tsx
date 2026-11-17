import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import type { User } from 'firebase/auth';

interface AuthContextValue {
  user: User | null;
  idToken: string | null;
  isAuthLoading: boolean;
  signInWithGoogle: () => Promise<{ user: User; token: string } | null>;
  signOutUser: () => Promise<void>;
  getFreshToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const loadFirebaseModules = () =>
  Promise.all([import('firebase/auth'), import('../lib/firebase')]);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  // ID token stored strictly in memory (never localStorage)
  const [idToken, setIdToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const authUnsubRef = useRef<(() => void) | null>(null);

  const ensureAuthListener = useCallback(async () => {
    if (authUnsubRef.current) return;
    setIsAuthLoading(true);
    try {
      const [{ onAuthStateChanged }, { auth }] = await loadFirebaseModules();
      if (authUnsubRef.current) return;
      authUnsubRef.current = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
          try {
            const token = await currentUser.getIdToken();
            setIdToken(token);
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
    } catch {
      setIsAuthLoading(false);
    }
  }, []);

  // Only initialize Firebase Auth SDK on startup if an admin session is active or URL requests admin
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    try {
      const hasAdminContext =
        Boolean(localStorage.getItem('noblewatch_admin_token')) ||
        window.location.hash.toLowerCase().includes('admin') ||
        window.location.search.toLowerCase().includes('admin');
      if (hasAdminContext) {
        timer = setTimeout(() => {
          ensureAuthListener();
        }, 50);
      }
    } catch {
      // ignore storage access issues
    }
    return () => {
      if (timer) clearTimeout(timer);
      if (authUnsubRef.current) {
        authUnsubRef.current();
        authUnsubRef.current = null;
      }
    };
  }, [ensureAuthListener]);

  const signInWithGoogle = useCallback(async () => {
    await ensureAuthListener();
    const [{ signInWithPopup }, { auth, googleAuthProvider }] = await loadFirebaseModules();
    const result = await signInWithPopup(auth, googleAuthProvider);
    const token = await result.user.getIdToken();
    setUser(result.user);
    setIdToken(token);
    await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { user: result.user, token };
  }, [ensureAuthListener]);

  const signOutUser = useCallback(async () => {
    const [{ signOut }, { auth }] = await loadFirebaseModules();
    await signOut(auth);
    setUser(null);
    setIdToken(null);
  }, []);

  const getFreshToken = useCallback(async () => {
    try {
      const [, { auth }] = await loadFirebaseModules();
      if (!auth.currentUser) return null;
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
