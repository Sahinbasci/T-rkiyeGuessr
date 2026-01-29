import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, onValue, update, remove, push } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyChX9qroh1RAeAwTScCXZPwnyowbz8xADo",
  authDomain: "turkiye-guessr.firebaseapp.com",
  projectId: "turkiye-guessr",
  storageBucket: "turkiye-guessr.firebasestorage.app",
  messagingSenderId: "966819551700",
  appId: "1:966819551700:web:154b41a874e8127df1de41",
  databaseURL: "https://turkiye-guessr-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, set, get, onValue, update, remove, push };
