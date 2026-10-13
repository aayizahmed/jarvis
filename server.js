/**
 * GestureFlow — Standalone Node.js LAN Sync & Static Production Server
 * Can be run via `node server.js` or `npm run serve:all`
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import { setupSyncServer, getLocalIpAddresses } from './server/syncServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5173;
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.task': 'application/octet-stream',
  '.webp': 'image/webp'
};

const server = http.createServer((req, res) => {
  // 1. API endpoint for automatic LAN discovery
  if (req.url === '/api/network-info') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    const ips = getLocalIpAddresses();
    const primaryIp = ips[0]?.ip || 'localhost';
    res.end(JSON.stringify({
      primaryIp,
      ips,
      port: PORT,
      wsUrl: `ws://${primaryIp}:${PORT}/ws-sync`,
      controlUrl: `http://${primaryIp}:${PORT}/?mode=control`,
      displayUrl: `http://${primaryIp}:${PORT}/?mode=display`
    }));
    return;
  }

  // 2. Static file serving from dist/ (if built) or public fallback
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '/control' || reqPath === '/display') {
    reqPath = '/index.html';
  }

  let filePath = path.join(DIST_DIR, reqPath);
  if (!fs.existsSync(filePath)) {
    // Fallback to root or index.html for SPA routes
    filePath = path.join(DIST_DIR, 'index.html');
  }

  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': mime,
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin'
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('GestureFlow build not found. Please run `npm run build` first.');
  }
});

// 3. Attach WebSocket server to HTTP server
const wss = new WebSocketServer({ noServer: true });
setupSyncServer(wss);

server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/ws-sync') {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIpAddresses();
  const primaryIp = ips[0]?.ip || 'localhost';
  console.log('\n============================================================');
  console.log('⚡ GESTUREFLOW DUAL-DEVICE SYSTEM RUNNING');
  console.log('============================================================');
  console.log(`💻 Control Station (Laptop):   http://localhost:${PORT}/?mode=control`);
  console.log(`📽️  Projection Display (LAN):   http://${primaryIp}:${PORT}/?mode=display`);
  console.log(`📡 WebSocket Endpoint:         ws://${primaryIp}:${PORT}/ws-sync`);
  console.log('============================================================\n');
});
