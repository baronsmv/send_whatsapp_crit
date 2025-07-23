const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');
const {Client, LocalAuth, MessageMedia} = require('whatsapp-web.js');

// === Configuración de cliente WhatsApp ===

function createWhatsAppClient() {
    const client = new Client({
        authStrategy: new LocalAuth({dataPath: './sessions'}),
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
    });

    client.on('qr', qr => qrcode.generate(qr, {small: true}));
    client.on('ready', () => console.log('✅ Cliente de WhatsApp listo.'));
    client.initialize();

    return client;
}

// === Utilidades ===

function fileExists(filePath) {
    try {
        return fs.existsSync(filePath);
    } catch {
        return false;
    }
}

// === (Opcional) Apertura forzada de chat usando Puppeteer ===

async function forceOpenChat(client, number) {
    const pupPage = client.pupPage || client._client?.pupPage;
    if (!pupPage) throw new Error("No se pudo acceder a Puppeteer");

    const cleanNumber = number.replace('@c.us', '');
    console.log(`🟡 Forzando apertura de chat con ${cleanNumber}...`);

    await pupPage.evaluate((num) => {
        window.location.href = `https://wa.me/${num}`;
    }, cleanNumber);

    await pupPage.waitForSelector('div[contenteditable="true"]', {timeout: 15000});
    await pupPage.type('div[contenteditable="true"]', '.', {delay: 50});
    await pupPage.keyboard.press('Enter');
    await new Promise((r) => setTimeout(r, 2000));
}

// === Lógica de envío de medios ===

function createSendMediaHandler(client) {
    return async (req, res) => {
        const {number, message, image_path} = req.body;

        if (!number || !message || !image_path) {
            return res.status(400).json({error: 'Faltan datos: number, message o image_path'});
        }

        try {
            const chatId = number;
            const absolutePath = path.join(__dirname, image_path);

            if (!fileExists(absolutePath)) {
                return res.status(404).json({error: `Archivo no encontrado: ${image_path}`});
            }

            let chat;
            try {
                chat = await client.getChatById(chatId);
            } catch {
                console.log(`⚠️ Chat no encontrado para ${number}`);

                // 👇 Descomenta esta línea para forzar apertura de chat automáticamente (NO recomendado)
                // await forceOpenChat(client, number);

                chat = await client.getChatById(chatId);
            }

            const media = MessageMedia.fromFilePath(absolutePath);
            await client.sendMessage(chatId, media, {caption: message});

            return res.status(200).json({status: 'Mensaje enviado con imagen', number});
        } catch (error) {
            console.error(`❌ Error al enviar a ${number}:`, error);
            return res.status(500).json({error: error.toString(), number});
        }
    };
}

// === Inicialización del servidor ===

const app = express();
app.use(cors());
app.use(express.json());

const client = createWhatsAppClient();
const sendMediaHandler = createSendMediaHandler(client);

app.post('/send-media', sendMediaHandler);

app.listen(3000, () => {
    console.log('🚀 Microservicio WhatsApp escuchando en http://localhost:3000');
});
