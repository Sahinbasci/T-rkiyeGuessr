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
let authReady: Promise<User>;
const authReadyPromise = new Promise<User>((resolve) => {
  authReady = signInAnonymously(auth).then((cred) => {
    return cred.user;
  }).catch((err) => {
    console.error("[Auth] Anonymous sign-in failed:", err);
    throw err;
  });
  // Eğer zaten giriş yapılmışsa onAuthStateChanged ile yakala
  const unsub = onAuthStateChanged(auth, (user) => {
    if (user) {
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
