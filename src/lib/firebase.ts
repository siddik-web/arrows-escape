import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// @ts-ignore
const firebaseConfigRaw = typeof __firebase_config !== "undefined" ? __firebase_config : "{}";
let firebaseConfig = {};
try {
  firebaseConfig = JSON.parse(firebaseConfigRaw);
} catch (error) {
  console.warn("Unable to parse Firebase config:", error);
}

// @ts-ignore
const hasFirebaseConfig = firebaseConfig && typeof firebaseConfig.apiKey === "string" && firebaseConfig.apiKey.length > 0;

export const app = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

// @ts-ignore
export const appId = typeof __app_id !== "undefined" ? __app_id : "arrows-escape";
