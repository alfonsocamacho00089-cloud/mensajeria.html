const firebaseConfig = {
    apiKey: "AIzaSyCaUyhX2iBMl4A5xeKeu_4SeE6HClp4V1s",
    authDomain: "real-market-elite-2025.firebaseapp.com",
    projectId: "real-market-elite-2025",
    databaseURL: "https://real-market-elite-2025-default-rtdb.firebaseio.com",
    storageBucket: "real-market-elite-2025.appspot.com",
    messagingSenderId: "226489002778",
    appId: "1:226489002778:web:6722d21a9e78b33b5b1aa3"
};

// Inicializar Firebase en el hilo principal
firebase.initializeApp(firebaseConfig);

// Hacer globales las instancias para que el resto de archivos las usen
const db = firebase.database();
const messaging = firebase.messaging();
