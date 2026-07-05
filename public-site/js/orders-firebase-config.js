import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCLTLuVFG36zXOzF1YkrPm2hr4k8hRFwHI",
  authDomain: "enzohajm.firebaseapp.com",
  projectId: "enzohajm",
  storageBucket: "enzohajm.firebasestorage.app",
  messagingSenderId: "788231794322",
  appId: "1:788231794322:web:f2203afd0320954371004b",
  // A Realtime Database URL-je a Firebase Console → Realtime Database
  // oldalon jelenik meg, miután létrehoztad az adatbázist. Írd ide a
  // saját projekted URL-jét (kb. így néz ki):
  // "https://enzohajm-default-rtdb.europe-west1.firebasedatabase.app"
  databaseURL: "https://enzohajm-default-rtdb.europe-west1.firebasedatabase.app"
};

// A rendelések és a menü másolata a Realtime Database-ben tárolódnak —
// ez egy MÁSIK adatbázis-termék, mint a Firestore, ugyanabban a Firebase
// projektben, és a Spark (ingyenes) csomagon is elérhető. A meglévő
// Firestore adatokhoz (categories/products/reviews/settings) ez
// egyáltalán nem nyúl.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const rtdb = getDatabase(app);

