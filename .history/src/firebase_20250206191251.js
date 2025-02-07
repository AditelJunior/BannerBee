// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAc35spEewmTbbzaxA8cjxXuPpGeudZFCw",
  authDomain: "html-banner-builder.firebaseapp.com",
  projectId: "html-banner-builder",
  storageBucket: "html-banner-builder-496c8.firebasestorage.app",
  messagingSenderId: "492837481669",
  appId: "1:492837481669:web:7272e8a487fbe4948594ac",
  measurementId: "G-LT4J761QE1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
const analytics = getAnalytics(app);