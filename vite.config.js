import { defineConfig } from 'vite';
import { WebSocketServer } from 'ws';
import { setupSyncServer, getLocalIpAddresses } from './server/syncServer.js';

function syncServerPlugin() {
  return {
    name: 'gestureflow-sync-server',
    configureServer(server) {
      // 1. API endpoint for automatic LAN IP discovery
      server.middlewares.use('/api/network-info', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        const ips = getLocalIpAddresses();
        const primaryIp = ips[0]?.ip || 'localhost';
        const port = server.config.server.port || 5173;
        res.end(JSON.stringify({
          primaryIp,
          ips,
          port,
          wsUrl: `ws://${primaryIp}:${port}/ws-sync`,
          controlUrl: `http://${primaryIp}:${port}/?mode=control`,
          displayUrl: `http://${primaryIp}:${port}/?mode=display`
        }));
      });

      // 2. Attach WebSocket server to Vite's HTTP server
      const wss = new WebSocketServer({ noServer: true });
      setupSyncServer(wss);

      server.httpServer.on('upgrade', (req, socket, head) => {
        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        if (url.pathname === '/ws-sync') {
          wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit('connection', ws, req);
          });
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [syncServerPlugin()],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces for LAN devices
    port: 5173,
    open: false,
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  optimizeDeps: {
    include: ['@mediapipe/tasks-vision']
  },
  build: {
    target: 'esnext',
    assetsInlineLimit: 0
  }
});

