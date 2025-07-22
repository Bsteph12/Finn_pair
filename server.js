const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { connectToWhatsApp } = require('./bot');

global.qrCodes = {};

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.render('index', { qr: null, number: null });
});

app.post('/pair', async (req, res) => {
    const number = req.body.number;
    if (!number) return res.send('❌ Numéro requis !');

    await connectToWhatsApp(number);
    setTimeout(() => {
        const qr = global.qrCodes[number] || null;
        res.render('index', { qr, number });
    }, 2000);
});

app.listen(port, () => console.log(`🌐 Serveur lancé sur http://localhost:${port}`));
