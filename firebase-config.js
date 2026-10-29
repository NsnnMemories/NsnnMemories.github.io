// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCB99mxUZTUPBMi1oSgr-as-fF0QXVjY3A",
  authDomain: "nsnnmemories.firebaseapp.com",
  projectId: "nsnnmemories",
  storageBucket: "nsnnmemories.firebasestorage.app",
  messagingSenderId: "492844487150",
  appId: "1:492844487150:web:ceaa05f7c9190764857eff",
  measurementId: "G-YPHQ2BG8V0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);