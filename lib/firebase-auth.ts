"use client";

// Define User type locally to avoid importing firebase/auth at build time
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

let auth: ReturnType<typeof import("firebase/auth").getAuth> | null = null;

const getFirebaseAuth = async () => {
  if (auth) return auth;

  const { getAuth } = await import("firebase/auth");
  const { initializeApp, getApps } = await import("firebase/app");

  const firebaseConfig = {
    apiKey: "AIzaSyBUlU1esFktMUK0TgJIqCww7xkGCqTU3cs",
    authDomain: "dev4com-f68e3.firebaseapp.com",
    projectId: "dev4com-f68e3",
    storageBucket: "dev4com-f68e3.firebasestorage.app",
    messagingSenderId: "634868566361",
    appId: "1:634868566361:web:ea1a3efef52666b455e448",
    measurementId: "G-3D57QJVRBN",
  };

  const app = getApps().length === 0 ? initializeApp(firebaseConfig, "auth-app") : getApps().find(a => a.name === "auth-app") || getApps()[0];
  auth = getAuth(app);
  return auth;
};

// Auth functions
export const loginWithEmail = async (email: string, password: string) => {
  const { signInWithEmailAndPassword } = await import("firebase/auth");
  const authInstance = await getFirebaseAuth();
  return signInWithEmailAndPassword(authInstance, email, password);
};

export const registerWithEmail = async (email: string, password: string) => {
  const { createUserWithEmailAndPassword } = await import("firebase/auth");
  const authInstance = await getFirebaseAuth();
  return createUserWithEmailAndPassword(authInstance, email, password);
};

export const logout = async () => {
  const { signOut } = await import("firebase/auth");
  const authInstance = await getFirebaseAuth();
  return signOut(authInstance);
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  let unsubscribe: (() => void) | null = null;

  (async () => {
    const { onAuthStateChanged } = await import("firebase/auth");
    const authInstance = await getFirebaseAuth();
    unsubscribe = onAuthStateChanged(authInstance, callback);
  })();

  return () => {
    if (unsubscribe) unsubscribe();
  };
};
