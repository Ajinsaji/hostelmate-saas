// Development and PWA fallback config for Firebase Cloud Messaging Service Worker
if (typeof self !== "undefined" && (!self.__FIREBASE_CONFIG__ || !self.__FIREBASE_CONFIG__.projectId)) {
  self.__FIREBASE_CONFIG__ = {
    apiKey: "",
    authDomain: "hostelmate-f0de8.firebaseapp.com",
    projectId: "hostelmate-f0de8",
    storageBucket: "hostelmate-f0de8.firebasestorage.app",
    messagingSenderId: "654995812093",
    appId: "1:654995812093:web:5d2b7c4f4a3e2189",
  };
}
