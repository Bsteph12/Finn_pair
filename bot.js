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
    logger: pino({ level: 'silent' }),
    browser: ['Ubuntu', 'Chrome', '1.0.0'],
  });

  sock.ev.on('creds.update', saveCreds);

  try {
    const rawCode = await sock.requestPairingCode(number + "@s.whatsapp.net");
    const code = rawCode.match(/.{1,4}/g).join("-");
    console.log("🔗 Code de pairage :", code);
    global.pairCodes[number] = code;
  } catch (err) {
    console.error("❌ requestPairingCode erreur :", err);
    return;
  }

  sock.ev.on('connection.update', async (upd) => {
    const { connection } = upd;
    if (connection === 'open') {
      console.log("✅ CONNECTÉ pour", number);
      const creds = fs.readFileSync(path.join(sessionPath, 'creds.json'));
      await sendCredsToUser(sock, number, creds);
    }
  });
}

module.exports = { connectToWhatsApp };
