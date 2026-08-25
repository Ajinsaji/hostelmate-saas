// Development and PWA fallback config for Firebase Cloud Messaging Service Worker
if (typeof self !== "undefined" && !self.__FIREBASE_CONFIG__) {
  self.__FIREBASE_CONFIG__ = {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
  };
}
