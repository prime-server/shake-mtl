import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

// Admin emails — these always get admin role regardless of UID
const ADMIN_EMAILS = ['shakemtl@gmail.com'];

interface AuthState {
  user: User | null;
  role: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setUser(fbUser);
        try {
          // Check by UID first
          const snap = await getDoc(doc(db, 'users', fbUser.uid));
          if (snap.exists()) {
            setRole(snap.data().role ?? 'customer');
          } else if (fbUser.email && ADMIN_EMAILS.includes(fbUser.email.toLowerCase())) {
            // Admin email signed in with different provider — create/update doc
            await setDoc(doc(db, 'users', fbUser.uid), {
              email: fbUser.email,
              role: 'admin',
              createdAt: new Date().toISOString(),
            });
            setRole('admin');
          } else {
            setRole('customer');
          }
        } catch {
          setRole('customer');
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', cred.user.uid), {
      email: cred.user.email,
      role: 'customer',
      createdAt: new Date().toISOString(),
    });
    setRole('customer');
  };

  const signInWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    if (!snap.exists()) {
      const isAdmin = cred.user.email && ADMIN_EMAILS.includes(cred.user.email.toLowerCase());
      const newRole = isAdmin ? 'admin' : 'customer';
      await setDoc(doc(db, 'users', cred.user.uid), {
        email: cred.user.email,
        role: newRole,
        createdAt: new Date().toISOString(),
      });
      setRole(newRole);
    } else {
      setRole(snap.data().role ?? 'customer');
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
