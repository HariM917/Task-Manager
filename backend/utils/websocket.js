const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');

// Store connections mapped by user ID
const userConnections = new Map();

const setupWebSocket = (server) => {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    // Extract token from query string
    const params = url.parse(req.url, true).query;
    const token = params.token;

    if (!token) {
      ws.close(1008, 'Authentication required');
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;

      // Store connection
      if (!userConnections.has(userId)) {
        userConnections.set(userId, new Set());
      }
      userConnections.get(userId).add(ws);

      console.log(`🔌 WebSocket connected: User ${userId}`);

      // Send welcome message
      ws.send(JSON.stringify({ 
        type: 'connected', 
        message: 'Real-time updates active' 
      }));

      // Handle disconnect
      ws.on('close', () => {
        const connections = userConnections.get(userId);
        if (connections) {
          connections.delete(ws);
          if (connections.size === 0) {
            userConnections.delete(userId);
          }
        }
        console.log(`🔌 WebSocket disconnected: User ${userId}`);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      // Ping/pong keepalive
      ws.isAlive = true;
      ws.on('pong', () => { ws.isAlive = true; });
    } catch (error) {
      ws.close(1008, 'Invalid token');
    }
  });

  // Keepalive interval
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => clearInterval(interval));

  return wss;
};

// Broadcast message to all connections for a specific user
const broadcastToUser = (userId, data) => {
  const connections = userConnections.get(userId);
  if (connections) {
    const message = JSON.stringify(data);
    connections.forEach((ws) => {
      if (ws.readyState === 1) { // OPEN
        ws.send(message);
      }
    });
  }
};

module.exports = { setupWebSocket, broadcastToUser };
