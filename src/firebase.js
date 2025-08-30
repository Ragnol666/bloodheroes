import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCXntwojIfglug_L6JKdtA82I8fJVmbfSI",
  authDomain: "blood-buddy-d1g5ht.firebaseapp.com",
  projectId: "blood-buddy-d1g5ht",
  storageBucket: "blood-buddy-d1g5ht.appspot.com",
  messagingSenderId: "1043411898751",
  appId: "1:1043411898751:web:ac9c12bf90f08b7cf90a4a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);