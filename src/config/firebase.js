// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCSqrGQy_f-Vv1OU10zptgKXG_Wud50XI0",
  authDomain: "smmtz-1c105.firebaseapp.com",
  projectId: "smmtz-1c105",
  storageBucket: "smmtz-1c105.firebasestorage.app",
  messagingSenderId: "380181705168",
  appId: "1:380181705168:web:e8c7269c8bf7fb9b3609d5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

export default app;
