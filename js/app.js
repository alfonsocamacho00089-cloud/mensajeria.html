// --- 1. CONFIGURACIÓN Y CONSTANTES ---
const E_RELOJ = 0;    
const E_ENVIADO = 1;  
const E_RECIBIDO = 2; 
const E_LEIDO = 3;    

let protoRoot = null;
const DB_VERSION = 7;
let listenerActivo = null; // Para control de antena

async function cargarProto() {
    if (!protoRoot) protoRoot = await protobuf.load("/superapp.proto");
    return protoRoot;
}

// --- 2. MOTOR DE REGISTRO Y BIOMETRÍA ---
async function ejecutarRegistroCompleto() {
    const nombreInput = document.getElementById('reg-nombre');
    const apellidoInput = document.getElementById('reg-apellido');
    if (!nombreInput || !apellidoInput) return;

    const nombre = nombreInput.value.trim();
    const apellido = apellidoInput.value.trim();
    if (!nombre || !apellido) {
        alert("Por favor, completa tu nombre y apellido.");
        return;
    }

    const huellaOk = await validarHuellaChacalaca(); 
    if (!huellaOk) return;

    const nombreCompleto = `${nombre} ${apellido}`;
    const llaveHuella = "HUELLA_" + btoa(nombreCompleto).substring(0, 10);
    const idExistente = await buscarCuentaPorHuella(llaveHuella);

    let idFinal = idExistente;

    if (idExistente) {
        localStorage.setItem('mi_dropis_id', idExistente);
        mostrarMiQR(idExistente);
        alert(`¡Bienvenido de nuevo ${nombre}!`);
    } else {
        idFinal = await crearCuentaMaestra(nombreCompleto);
        if (idFinal) {
            mostrarMiQR(idFinal);
            alert(`¡Bienvenido ${nombre}! ID creado.`);
        }
    }

    if (idFinal) {
        localStorage.setItem('mi_dropis_id', idFinal);
        mostrarMiQR(idFinal);
        document.getElementById('modal-registro').style.display = 'none';
        alert("¡Registro completado y bloqueado!");
    }
} // <--- AQUÍ FALTABA ESTA LLAVE

async function crearCuentaMaestra(nombreUsuario) {
    const idUnico = await generarDropisID(nombreUsuario);
    const llaveHuella = "HUELLA_" + btoa(nombreUsuario).substring(0, 10); 
    try {
        await Promise.all([
            firebase.database().ref('usuarios/' + idUnico).set({
                nombre: nombreUsuario,
                creado_en: Date.now(),
                estado: "activo"
            }),
            firebase.database().ref('vinculos_biometricos/' + llaveHuella).set(idUnico)
        ]);
        localStorage.setItem('mi_dropis_id', idUnico);
        return idUnico; 
    } catch (error) {
        console.error("Error registro:", error);
        return null; 
    }
}

async function buscarCuentaPorHuella(llave) {
    try {
        const snapshot = await firebase.database().ref('vinculos_biometricos/' + llave).once('value');
        return snapshot.val(); 
    } catch (e) { return null; }
}

async function generarDropisID(nombre) { 
    const msgUint8 = new TextEncoder().encode(nombre + Date.now());
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 12);
}

async function validarHuellaChacalaca() { 
    console.log("Validando biometría...");
    return true; 
}

// --- 3. MOTOR DE MENSAJERÍA SATELITAL ---
function activarAntena() {
    const miID = localStorage.getItem('mi_dropis_id') || 'Pedro Peres';
    if (listenerActivo) listenerActivo.off(); 

    console.log("📡 Antena sintonizada en:", miID);
    listenerActivo = firebase.database().ref('cola_satelital/' + miID);
    
    listenerActivo.on('child_added', async (snapshot) => {
    const data = snapshot.val();
    console.log("📩 Nuevo dato en cola:", data);
    
    try {
        const root = await cargarProto();
        const SuperAppPayload = root.lookupType("SuperAppPayload");
        
        // 1. Decodificar el mensaje que viene de la nube (Base64 -> Buffer -> Objeto)
        const buffer = Uint8Array.from(atob(data.p), c => c.charCodeAt(0));
        const decoded = SuperAppPayload.decode(buffer);

        // 2. Guardar en IndexedDB del receptor
        const msgParaGuardar = {
            id: data.msg_id,
            texto: decoded.chat_text,
            destino: localStorage.getItem('mi_dropis_id'),
            remitente: data.from,
            ts: data.ts,
            enviado: E_RECIBIDO // Marcamos como recibido
        };

        const reqDB = indexedDB.open('DropisDB', DB_VERSION);
        reqDB.onsuccess = (e) => {
            const db = e.target.result;
            const tx = db.transaction('mensajes', 'readwrite');
            tx.objectStore('mensajes').put(msgParaGuardar);
            tx.oncomplete = () => {
                db.close();
                cargarMensajes(); // Refrescar pantalla
                
                // 3. Notificar a la nube que ya lo recibimos para que el emisor vea el doble check
                notificarEstadoAlEmisor(data.from, data.msg_id, E_RECIBIDO);
            };
        };

        // 4. Limpiar la nube (Consumir el mensaje)
        snapshot.ref.remove(); 
        
    } catch (e) {
        console.error("Error en recepción:", e);
    }
});

window.enviarMensajeSatelital = async function() {
    const msgInput = document.getElementById('msg-text');
    const targetInput = document.getElementById('target-id');
    if (!msgInput || !msgInput.value.trim()) return;

    const texto = msgInput.value;
    const targetID = targetInput.value || 'global';
    const miID = localStorage.getItem('mi_dropis_id') || 'Pedro Peres';
    const msgID = "SAT-" + Date.now();

    try {
        const root = await cargarProto();
        const reqDB = indexedDB.open('DropisDB', DB_VERSION);
        reqDB.onsuccess = (e) => {
            const db = e.target.result;
            const tx = db.transaction('mensajes', 'readwrite');
            tx.objectStore('mensajes').add({
                id: msgID, texto, destino: targetID, remitente: miID, ts: Date.now(), enviado: E_RELOJ 
            });
            tx.oncomplete = async () => {
                db.close();
                cargarMensajes(); 
                msgInput.value = ''; 
                try {
                    const SuperAppPayload = root.lookupType("SuperAppPayload");
                    const buffer = SuperAppPayload.encode({ msg_id: msgID, chat_text: texto, is_satellite_priority: true }).finish();
                    const payload = { msg_id: msgID, p: btoa(String.fromCharCode(...buffer)), from: miID, ts: Date.now() };
                    await firebase.database().ref('cola_satelital/' + targetID).push(payload);
                    actualizarEstadoLocal(msgID, E_ENVIADO);
                } catch(err) { console.warn("Pendiente envío:", err); }
            };
        };
    } catch (e) { console.error("Error envío:", e); }
};

function activarRastreoEstados() {
    const miID = localStorage.getItem('mi_dropis_id') || 'Pedro Peres';
    firebase.database().ref(`rastreo/${miID}`).on('child_added', (snapshot) => {
        actualizarEstadoLocal(snapshot.key, snapshot.val().estado);
        snapshot.ref.remove();
    });
}

function notificarEstadoAlEmisor(emisorID, msgID, estado) {
    firebase.database().ref(`rastreo/${emisorID}/${msgID}`).set({ estado });
}

function actualizarEstadoLocal(id, estado) {
    const req = indexedDB.open('DropisDB', DB_VERSION);
    req.onsuccess = e => {
        const db = e.target.result;
        const tx = db.transaction('mensajes', 'readwrite');
        const store = tx.objectStore('mensajes');
        const getReq = store.get(id);
        getReq.onsuccess = () => {
            const data = getReq.result;
            if (data) { data.enviado = estado; store.put(data); }
            tx.oncomplete = () => { db.close(); cargarMensajes(); };
        };
    };
}

// --- 4. UI, QR Y NAVEGACIÓN ---
function mostrarMiQR(idUnico) {
    const contenedor = document.getElementById('contenedor-qr');
    if (!contenedor) return;
    contenedor.innerHTML = '<div id="qrcode-canvas" style="display: flex; justify-content: center; margin-bottom: 10px;"></div>';
    const canvas = document.getElementById("qrcode-canvas");
    if (canvas) {
        new QRCode(canvas, {
            text: `dropisapp://perfil/${idUnico}`,
            width: 180, height: 180,
            colorDark: "#000000", colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }
    const textoID = document.createElement("p");
    textoID.style.cssText = "font-weight: bold; color: #333; margin-top: 10px; font-size: 1.2em; word-break: break-all;";
    textoID.innerText = `ID: ${idUnico}`;
    contenedor.appendChild(textoID);
}

function openTab(tab) {
    const sections = document.querySelectorAll('.calc-section');
    sections.forEach(s => { s.classList.remove('active'); s.style.display = 'none'; });
    const target = document.getElementById(tab === 'inicio' ? 'lista-chats' : tab);
    if (target) {
        target.style.display = (tab === 'chat') ? 'flex' : 'block';
        target.classList.add('active');
        if (tab === 'chat') { window.scrollTo(0, 0); cargarMensajes(); }
    }
}

window.cargarMensajes = function() {
    const box = document.getElementById('chat-box');
    if (!box) return;
    const request = indexedDB.open('DropisDB', DB_VERSION);
    request.onsuccess = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('mensajes')) return;
        const tx = db.transaction('mensajes', 'readonly');
        const store = tx.objectStore('mensajes');
        const getAllReq = store.getAll();
        getAllReq.onsuccess = () => {
            const historial = getAllReq.result.sort((a, b) => a.ts - b.ts);
            const miID = localStorage.getItem('mi_dropis_id') || 'Admin_Dropis';
            box.innerHTML = ''; 
            historial.forEach(msg => {
                const div = document.createElement('div');
                const esMio = (msg.remitente === miID); 
                div.className = `msg-burbuja ${esMio ? 'msg-derecha' : 'msg-izquierda'}`;
                let icono = '';
                if (esMio) {
                    if (msg.enviado === E_RELOJ) icono = ' 🕒';
                    else if (msg.enviado === E_ENVIADO) icono = ' ✓';
                    else if (msg.enviado === E_RECIBIDO) icono = ' ✓✓';
                    else if (msg.enviado === E_LEIDO) icono = ' <span style="color:#34b7f1">✓✓</span>';
                }
                div.innerHTML = `<span>${msg.texto}</span><br><small style="font-size:10px; opacity:0.7">${icono}</small>`;
                box.appendChild(div);
            });
            setTimeout(() => { box.scrollTop = box.scrollHeight; }, 50);
        };
    };
};

async function sincronizarTokenDispositivo() {
    try {
        const miID = localStorage.getItem('mi_dropis_id');
        if (!miID) return;
        const token = await messaging.getToken({ vapidKey: 'TU_VAPID_KEY_AQUI' });
        if (token) {
            await firebase.database().ref(`tokens_dispositivos/${miID}`).set({
                token: token, plataforma: 'web', ultima_sincro: Date.now()
            });
        }
    } catch (e) { console.warn("Token no disponible"); }
}

window.onload = () => {
    activarAntena();
    activarRastreoEstados();
    cargarMensajes(); 
};
