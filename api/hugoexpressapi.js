const express = require('express');
const app = express();
const QRCode = require('qrcode');
const postgres = require('postgres');

// 1. Initialize the connection using the Vercel Environment Variable
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

app.get("/", (req, res) => {
    res.send("$HUGO Express API is running.");
});

// 2. THE DYNAMIC DATABASE RESOLVER ENDPOINT
app.get('/01/:upc/21/:hugoHash', async (req, res) => {
    const { upc, hugoHash } = req.params;

    try {
        -- Query the package and join it with its matching brand profile
        const results = await sql`
            SELECT p.*, b.name as brand_name, b.logo_url as brand_logo, b.description as brand_desc
            FROM packages p
            LEFT JOIN brands b ON p.brand_id = b.id
            WHERE p.hugo_hash = ${hugoHash} AND p.upc = ${upc}
        `;

        if (results.length === 0) {
            return res.status(404).send("Package ID not found in $HUGO Ledger.");
        }

        const data = results[0];
        const isBrowser = req.headers['accept']?.includes('text/html');

        if (isBrowser) {
            // BEAUTIFUL DYNAMIC LANDING PAGE FOR SMARTPHONES
            return res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <script src="https://cdn.tailwindcss.com"></script>
                    <title>${data.brand_name || '$HUGO Express'} | Proof of Origin</title>
                </head>
                <body class="bg-gray-900 text-white font-sans min-h-screen flex flex-col items-center p-6">
                    <div class="max-w-md w-full bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700 mt-10">
                        <div class="flex items-center space-x-4 border-b border-gray-700 pb-4 mb-4">
                            ${data.brand_logo ? `<img src="${data.brand_logo}" class="w-12 h-12 rounded-full object-cover">` : '<div class="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center font-bold">H</div>'}
                            <div>
                                <h1 class="text-xl font-bold tracking-wide">${data.brand_name || 'Verified Partner'}</h1>
                                <p class="text-xs text-gray-400">${data.brand_desc || 'Authentic Tracked Item'}</p>
                            </div>
                        </div>

                        <div class="mb-6">
                            <span class="text-xs uppercase tracking-wider text-red-400 font-bold">Product</span>
                            <h2 class="text-2xl font-black text-white mt-1">${data.product_name}</h2>
                            <p class="text-xs text-gray-400 mt-1">UPC: ${data.upc} | Hash: ${data.hugo_hash}</p>
                        </div>

                        <div class="mb-6 p-3 bg-gray-900 rounded-xl flex items-center justify-between border border-gray-700">
                            <span class="text-sm text-gray-400">Current Status:</span>
                            <span class="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold uppercase tracking-wider">${data.status}</span>
                        </div>

                        <div>
                            <span class="text-xs uppercase tracking-wider text-red-400 font-bold block mb-4">Tracking History</span>
                            <div class="space-y-4 relative before:absolute before:bottom-2 before:top-2 before:left-3.5 before:w-0.5 before:bg-gray-700">
                                ${data.history.map((step, idx) => `
                                    <div class="flex items-start space-x-4 relative">
                                        <div class="w-7 h-7 rounded-full ${idx === 0 ? 'bg-red-600 animate-pulse' : 'bg-gray-700'} flex items-center justify-center text-xs z-10 font-bold border-4 border-gray-800">
                                            ✓
                                        </div>
                                        <div>
                                            <h4 class="font-bold text-sm text-white">${step.status}</h4>
                                            <p class="text-xs text-gray-400">${step.location}</p>
                                            <p class="text-[10px] text-gray-500 mt-0.5">${step.date}</p>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `);
        }

        // If it's an API/data request instead of a browser, return raw JSON data
        return res.json(data);

    } catch (err) {
        console.error(err);
        return res.status(500).send("Internal Ledger Error.");
    }
});
