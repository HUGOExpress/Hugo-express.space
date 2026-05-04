# $HUGO Express

Blockchain-verified logistics tracking system with QR codes and real-time product tracking.

## Features

- 🏷️ QR code label generation
- 📦 Real-time tracking status
- 📱 Beautiful mobile-first UI
- 🔗 GS1 URI compliance
- 🤖 Warehouse scanner support (JSON API)

## Quick Start

```bash
npm install
npm run dev
```

## API Endpoints

### Generate QR Label
```
GET /api/gen?upc=123456789012&id=A1B2C3D4E5F6
```

### Track Package
```
GET /01/123456789012/21/A1B2C3D4E5F6
```

Visit in browser for beautiful UI, or use as JSON API from warehouse scanners.

## Deployment

Deployed on Vercel. Push to main to auto-deploy.
