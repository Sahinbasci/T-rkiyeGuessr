import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, onValue, update, remove, push, onDisconnect, runTransaction, serverTimestamp } from "firebase/database";
import { getAuth, signInAnonymously, onAuthStateChanged, type User } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// Anonymous Auth: Uygulama başladığında otomatik giriş yap
const authReadyPromise = new Promise<User>((resolve, reject) => {
  // Timeout: if auth doesn't resolve in 15s, reject to prevent infinite hang
  const timeout = setTimeout(() => {
    reject(new Error("[Auth] Anonymous sign-in timed out after 15s"));
  }, 15000);

  signInAnonymously(auth).catch(() => {
    // signInAnonymously failed — onAuthStateChanged may still resolve if cached
  });

  const unsub = onAuthStateChanged(auth, (user) => {
    if (user) {
      clearTimeout(timeout);
      resolve(user);
      unsub();
    }
  });
});

/**
 * Auth UID'yi al — auth hazır olana kadar bekler
 */
export async function getAuthUid(): Promise<string> {
  const user = await authReadyPromise;
  return user.uid;
}

/**
 * Senkron auth UID — sadece auth hazır olduktan sonra kullan
 */
export function getAuthUidSync(): string | null {
  return auth.currentUser?.uid || null;
}

export { database, ref, set, get, onValue, update, remove, push, onDisconnect, runTransaction, serverTimestamp, auth };
