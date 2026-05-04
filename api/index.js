const express = require('express');
const app = express();
const QRCode = require('qrcode');

// MOCK LEDGER (Replace with a database like Supabase or MongoDB later)
const trackingLedger = {
    "A1B2C3D4E5F6": {
        upc: "123456789012",
        product: "Artisan Spicy Pickles",
        status: "Delivered",
        history: [
            { status: "Verified Origin", location: "Houston, TX", date: "2026-05-01" },
            { status: "In Transit", location: "Distribution Hub", date: "2026-05-03" },
            { status: "Delivered", location: "Retailer", date: "2026-05-04" }
        ]
    }
};

// THE GS1 RESOLVER ENDPOINT
app.get('/01/:upc/21/:hugoHash', (req, res) => {
    const { upc, hugoHash } = req.params;
    const data = trackingLedger[hugoHash];

    if (!data) return res.status(404).send("Package ID not found in $HUGO Ledger.");

    const isBrowser = req.headers['accept']?.includes('text/html');

    if (isBrowser) {
        // BEAUTIFUL LANDING PAGE FOR SMARTPHONES
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
                <script src="https://cdn.tailwindcss.com"></script>
                <title>$HUGO Express | Proof of Origin</title>
            </head>
            <body class="bg-gray-50 p-6">
                <div class="max-w-md mx-auto bg-white rounded-3xl shadow-2xl border border-green-100 overflow-hidden">
                    <div class="bg-green-700 p-6 text-white text-center">
                        <h1 class="text-2xl font-black italic tracking-tighter">$HUGO EXPRESS</h1>
                        <p class="text-[10px] uppercase tracking-[0.3em] opacity-80">Blockchain Verified Logistics</p>
                    </div>
                    <div class="p-8">
                        <div class="flex justify-between items-center mb-6">
                            <h2 class="text-2xl font-bold text-gray-800">${data.product}</h2>
                            <span class="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-1 rounded-full">SECURE</span>
                        </div>
                        <div class="space-y-6 relative border-l-2 border-green-200 ml-2">
                            ${data.history.map(event => `
                                <div class="relative pl-6">
                                    <div class="absolute -left-[9px] top-1 w-4 h-4 bg-green-600 rounded-full border-2 border-white"></div>
                                    <p class="text-sm font-bold text-gray-700">${event.status}</p>
                                    <p class="text-xs text-gray-400">${event.location} • ${event.date}</p>
                                </div>
                            `).join('')}
                        </div>
                        <div class="mt-8 pt-6 border-t border-gray-100">
                            <p class="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Solana Ledger Hash</p>
                            <p class="text-[10px] font-mono text-gray-500 break-all bg-gray-50 p-2 rounded leading-tight">${hugoHash}x77001HOUSTON_VERIFIED</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `);
    } else {
        // RAW DATA FOR WAREHOUSE SCANNERS
        res.json({ status: "success", product: data.product, current_location: data.history[0].location });
    }
});

// GENERATOR ENDPOINT (For your own use to make labels)
app.get('/api/gen', async (req, res) => {
    const { upc, id } = req.query;
    if(!upc || !id) return res.send("Missing upc or id params.");
    const url = `https://${req.headers.host}/01/${upc}/21/${id}`;
    const qrImage = await QRCode.toDataURL(url);
    res.send(`<body style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif;">
                <h2>$HUGO Express Label</h2>
                <img src="${qrImage}" style="width:300px; border:10px solid white; box-shadow:0 10px 25px rgba(0,0,0,0.1);">
                <p>Link: ${url}</p>
              </body>`);
});

module.exports = app;
