"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User,
  onAuthChange,
  loginWithEmail,
  registerWithEmail,
  logout as firebaseLogout,
} from "@/lib/firebase-auth";
import { migrateDataToUser } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  migrateData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    await loginWithEmail(email, password);
  };

  const register = async (email: string, password: string) => {
    const userCredential = await registerWithEmail(email, password);
    // After registration, migrate existing data to this user
    if (userCredential.user) {
      await migrateDataToUser(userCredential.user.uid);
    }
  };

  const logout = async () => {
    await firebaseLogout();
  };

  const migrateData = async () => {
    if (user) {
      await migrateDataToUser(user.uid);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, migrateData }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
