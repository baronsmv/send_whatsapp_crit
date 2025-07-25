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
    try {
        const pupPage = client.pupPage || client._client?.pupPage;
        if (!pupPage) {
            console.warn('⚠️ No se pudo acceder a Puppeteer para forzar apertura de chat.');
            return false;
        }

        const cleanNumber = number.replace('@c.us', '');
        console.log(`🟡 Forzando apertura de chat con ${cleanNumber}...`);

        await pupPage.goto(`https://wa.me/${cleanNumber}`, {waitUntil: 'domcontentloaded', timeout: 15000});

        await pupPage.waitForSelector('a[href*="web.whatsapp.com"]', {timeout: 10000});
        await pupPage.click('a[href*="web.whatsapp.com"]');

        await pupPage.waitForNavigation({waitUntil: 'networkidle2', timeout: 15000});

        // Espera el input para escribir mensaje
        await pupPage.waitForSelector('div[contenteditable="true"]', {timeout: 15000});

        // Escribe y envía un mensaje trivial para abrir la sesión
        await pupPage.type('div[contenteditable="true"]', '.', {delay: 50});
        await pupPage.keyboard.press('Enter');

        // Espera un poco para que todo quede estable
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log(`✅ Chat forzado abierto para ${cleanNumber}.`);
        return true;

    } catch (error) {
        console.error(`❌ Error forzando apertura de chat con ${number}:`, error.message || error);
        // NO lanzar error para que el proceso principal no muera
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

                // Forzar apertura de chat automáticamente (Riesgoso)
                try {
                    let chat = await client.getChatById(number);
                    if (!chat) {
                        console.warn(`⚠️ Chat no encontrado para ${number}`);
                        const opened = await forceOpenChat(client, number);
                        if (!opened) {
                            throw new Error('No se pudo abrir chat forzado');
                        }
                        chat = await client.getChatById(number);
                    }
                    await client.sendMessage(chat.id._serialized, media, {caption: message});
                    console.log(`✅ Mensaje enviado a ${number}`);
                } catch (error) {
                    console.error(`❌ Error enviando a ${number}:`, error.message || error);
                }

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
