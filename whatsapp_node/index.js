// === Dependencias ===
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode');
const {Client, LocalAuth, MessageMedia} = require('whatsapp-web.js');

// === Variables Globales ===
let client;
let lastQR = null;
const SESSION_DIR = path.join(__dirname, 'sessions');
const CLIENT_ID = 'session';
const SESSION_PATH = path.join(SESSION_DIR, CLIENT_ID);

// === Funciones Auxiliares ===
const fileExists = (filePath) => fs.existsSync(filePath);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// === Inicializar Cliente WhatsApp ===
function createWhatsAppClient() {
    const newClient = new Client({
        authStrategy: new LocalAuth({dataPath: './sessions'}),
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
    });

    newClient.on('qr', qr => {
        lastQR = qr;
        console.log('🧾 QR actualizado');
    });

    newClient.on('ready', () => {
        console.log('✅ Cliente de WhatsApp listo.');
        lastQR = null;
    });

    newClient.initialize();
    return newClient;
}

// === Forzar apertura de chat (uso avanzado) ===
async function forceOpenChat(client, number) {
    try {
        const pupPage = client.pupPage || client._client?.pupPage;
        if (!pupPage) return false;

        const cleanNumber = number.replace('@c.us', '');
        await pupPage.goto(`https://wa.me/${cleanNumber}`, {
            waitUntil: 'domcontentloaded', timeout: 15000
        });

        await pupPage.waitForSelector('a[href*="web.whatsapp.com"]', {timeout: 10000});
        await pupPage.click('a[href*="web.whatsapp.com"]');

        await pupPage.waitForNavigation({waitUntil: 'networkidle2', timeout: 15000});
        await pupPage.waitForSelector('div[contenteditable="true"]', {timeout: 15000});

        await pupPage.type('div[contenteditable="true"]', '.', {delay: 50});
        await pupPage.keyboard.press('Enter');

        await delay(2000);
        console.log(`✅ Chat forzado con ${cleanNumber}`);
        return true;

    } catch (error) {
        console.error(`❌ Error forzando chat con ${number}:`, error.message || error);
        return false;
    }
}

// === Lógica de envío de medios ===
function createSendMediaHandler(client) {
    return async (req, res) => {
        const {number, message, image_path} = req.body;

        if (!number || !message || !image_path) {
            return res.status(400).json({error: 'Faltan datos: number, message o image_path'});
        }

        const chatId = number;
        const absolutePath = path.resolve(__dirname, image_path);

        if (!fileExists(absolutePath)) {
            return res.status(404).json({error: `Archivo no encontrado: ${image_path}`});
        }

        try {
            let chat;
            try {
                chat = await client.getChatById(chatId);
            } catch {
                const opened = await forceOpenChat(client, chatId);
                if (!opened) throw new Error('No se pudo abrir el chat automáticamente');
                chat = await client.getChatById(chatId);
            }

            const media = MessageMedia.fromFilePath(absolutePath);
            await client.sendMessage(chatId, media, {caption: message});

            console.log(`📤 Enviado a ${number}`);
            return res.status(200).json({status: 'Mensaje enviado', number});

        } catch (error) {
            console.error(`❌ Error al enviar a ${number}:`, error);
            return res.status(500).json({error: error.message, number});
        }
    };
}

// === Express App ===
const app = express();
app.use(cors());
app.use(express.json());

// === Inicializar Cliente y Handlers ===
client = createWhatsAppClient();
app.post('/send-media', createSendMediaHandler(client));

// === Endpoint: Reset limpio ===
app.post('/reset-clean', async (_req, res) => {
    try {
        console.log('🔄 Reiniciando cliente WhatsApp...');

        await client.destroy();

        if (fileExists(SESSION_PATH)) {
            fs.rmSync(SESSION_PATH, {recursive: true, force: true});
            console.log('🗑️ Sesión eliminada');
        }

        client = createWhatsAppClient();
        return res.json({status: 'Reinicio iniciado'});

    } catch (error) {
        console.error('❌ Error en /reset-clean:', error);
        return res.status(500).json({error: 'No se pudo reiniciar sesión'});
    }
});

// === Endpoint: Obtener QR ===
app.get('/qr', async (_req, res) => {
    if (!lastQR) return res.json({qr: null});

    try {
        const dataUrl = await qrcode.toDataURL(lastQR);
        return res.json({qr: dataUrl});
    } catch (error) {
        console.error('❌ Error generando QR base64:', error);
        return res.status(500).json({error: 'No se pudo generar el QR'});
    }
});

// === Iniciar Servidor ===
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Microservicio WhatsApp corriendo en http://localhost:${PORT}`);
});
