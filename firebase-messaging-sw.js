// firebase-messaging-sw.js
// ==========================================
// 1. IMPORTACIONES
// ==========================================
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');
importScripts('./protobuf.min.js'); 

// ==========================================
// 2. CONFIGURACIÓN
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyCaUyhX2iBMl4A5xeKeu_4SeE6HClp4V1s",
    authDomain: "real-market-elite-2025.firebaseapp.com",
    projectId: "real-market-elite-2025",
    messagingSenderId: "226489002778",
    appId: "1:226489002778:web:6722d21a9e78b33b5b1aa3"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();
const DB_NAME = 'DropisDB';
const DB_VERSION = 7; 

// ==========================================
// 3. NOTIFICACIONES EN SEGUNDO PLANO
// ==========================================
messaging.onBackgroundMessage((payload) => {
    console.log('☁️ Mensaje en background:', payload);
    const notificationTitle = payload.notification?.title || "DropisApp";
    const notificationOptions = {
        body: payload.notification?.body || "Nuevo mensaje",
        icon: './logo.png',
        badge: './placa.png',
        tag: payload.data?.senderId || 'mensaje-nuevo', // Dinámico para evitar spam
        renotify: true,
        // --- LO QUE AGREGO PARA EL FUTURO (SIN TOCAR LO ANTERIOR) ---
        data: {
            url: '/index.html' // O la ruta de tu chat
        },
        actions: [
            { action: 'abrir', title: '💬 VER CHAT' },
            { action: 'cerrar', title: '❌ CERRAR' }
        ]
    };
    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// ==========================================
// 4. LÓGICA DE DATOS (DIFUSIÓN A LA PANTALLA)
// ==========================================
function difundirMensaje(texto, remitente) {
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({
                type: 'NUEVO_MENSAJE_SATELITAL',
                texto: texto,
                nombre: remitente
            });
        });
    });
}

// Escuchar eventos PUSH directos
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        difundirMensaje(data.notification?.body, data.notification?.title);
    }
});

// ==========================================
// 5. MOTOR DE BASE DE DATOS LOCAL
// ==========================================
async function guardarEnLocal(storeName, data) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('mensajes')) {
                db.createObjectStore('mensajes', { keyPath: 'id' });
            }
        };
        request.onsuccess = (e) => {
            const db = e.target.result;
            const tx = db.transaction(storeName, 'readwrite');
            tx.objectStore(storeName).put(data);
            tx.oncomplete = () => { db.close(); resolve(); };
        };
        request.onerror = (e) => reject(e.target.error);
    });
}

// ==========================================
// 6. GESTIÓN DE CLIC EN NOTIFICACIÓN (NUEVO)
// ==========================================
self.addEventListener('notificationclick', (event) => {
    event.notification.close(); // Cerramos la notificación al tocarla

    if (event.action === 'cerrar') return;

    // Abrir la App o enfocarla si ya está abierta
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            if (clientList.length > 0) {
                return clientList[0].focus();
            }
            return clients.openWindow(event.notification.data.url);
        })
    );
});
// Este bloque es el que activa el botón de "Instalar" en Chrome
self.addEventListener('fetch', (event) => {
    // No necesita hacer nada complejo, solo estar presente
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});
