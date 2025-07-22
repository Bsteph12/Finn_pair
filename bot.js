const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const path = require('path');
const fs = require('fs');
const pino = require('pino');
const { sendCredsToUser } = require('./utils');

async function connectToWhatsApp(number) {
  const sessionPath = path.resolve(__dirname, 'sessions', number);
  fs.mkdirSync(sessionPath, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
    logger: pino({ level: 'silent' })
  });

  sock.ev.on('creds.update', saveCreds);

  // Exactement comme dans index.js : génération de code de pairage
  if (!sock.authState.creds.registered) {
    try {
      let code = await sock.requestPairingCode(number + "@s.whatsapp.net");
      code = code.match(/.{1,4}/g).join("-");
      console.log("🔗 Code de pairage :", code);
      global.pairCodes[number] = code;
    } catch (err) {
      console.error("❌ Erreur de génération de code :", err);
    }
  }

  sock.ev.on('connection.update', async ({ connection }) => {
    if (connection === 'open') {
      console.log("✅ CONNECTÉ : " + number);
      const credsPath = path.join(sessionPath, 'creds.json');
      const creds = fs.readFileSync(credsPath);
      await sendCredsToUser(sock, number, creds);
    }
  });
}

module.exports = { connectToWhatsApp }; 
