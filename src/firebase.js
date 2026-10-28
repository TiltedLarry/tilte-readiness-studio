// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, serverTimestamp } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDRdQJkZY96XJFsyv6PJkavJ4gLTv4kU5Y",
  authDomain: "ecrs-7e480.firebaseapp.com",
  projectId: "ecrs-7e480",
  storageBucket: "ecrs-7e480.firebasestorage.app",
  messagingSenderId: "457378670058",
  appId: "1:457378670058:web:4dbf02968e3305d4947e93",
  measurementId: "G-35LBCBR1CG",
};

export const APP_ID = "tilte-email-readiness-studio";
export const SUPER_ADMIN_EMAIL = "larry.moyo@tilte.cx";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export { serverTimestamp };