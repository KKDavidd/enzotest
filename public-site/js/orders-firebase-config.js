import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCLTLuVFG36zXOzF1YkrPm2hr4k8hRFwHI",
  authDomain: "enzohajm.firebaseapp.com",
  projectId: "enzohajm",
  storageBucket: "enzohajm.firebasestorage.app",
  messagingSenderId: "788231794322",
  appId: "1:788231794322:web:f2203afd0320954371004b",
  databaseURL: "https://enzohajm-default-rtdb.europe-west1.firebasedatabase.app"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const rtdb = getDatabase(app);

