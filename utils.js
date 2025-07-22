const fs = require('fs');

async function sendCredsToUser(sock, number, credsBuffer) {
    try {
        await sock.sendMessage(number + "@s.whatsapp.net", {
            document: credsBuffer,
            fileName: "creds.json",
            mimetype: "application/json",
            caption: "🤖 Voici votre fichier de session WhatsApp. Merci !"
        });
    } catch (err) {
        console.error("❌ Erreur d'envoi du creds.json:", err);
    }
}

module.exports = { sendCredsToUser };
