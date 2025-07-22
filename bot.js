const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const path = require('path');
const fs = require('fs');
const P = require('pino');
const { sendCredsToUser } = require('./utils');

async function connectToWhatsApp(number) {
    const sessionFolder = path.resolve(__dirname, 'sessions', number);
    fs.mkdirSync(sessionFolder, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: P({ level: 'silent' }),
        browser: ['Pairing Site', 'Chrome', '1.0.0'],
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            global.qrCodes[number] = qr;
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error = new Boom(lastDisconnect?.error))?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) connectToWhatsApp(number);
        } else if (connection === 'open') {
            console.log('✅ CONNECTED: ' + number);
            const credsPath = path.join(sessionFolder, 'creds.json');
            const creds = fs.readFileSync(credsPath);
            await sendCredsToUser(sock, number, creds);
        }
    });
}

module.exports = { connectToWhatsApp };
