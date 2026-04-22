/* ═══════════════════════════════════════════
   WebSocket Client — Real-Time Updates
   (Cross-Origin Safe: Token via query param)
   ═══════════════════════════════════════════ */

let ws = null;
let wsReconnectTimer = null;
let wsReconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 3000;

/**
 * Initialize WebSocket connection
 */
function initWebSocket() {
  // Get token from localStorage for WS auth
  const token = getAuthToken();
  if (!token) {
    updateConnectionStatus('disconnected', 'No auth');
    return;
  }

  const wsUrl = `${CONFIG.WS_URL}/ws?token=${token}`;

  try {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('🔌 WebSocket connected');
      wsReconnectAttempts = 0;
      updateConnectionStatus('connected', 'Live');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWSMessage(data);
      } catch (err) {
        console.error('WS message parse error:', err);
      }
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      updateConnectionStatus('disconnected', 'Offline');
      attemptReconnect();
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      updateConnectionStatus('disconnected', 'Error');
    };
  } catch (error) {
    console.error('WebSocket init error:', error);
    updateConnectionStatus('disconnected', 'Failed');
  }
}

/**
 * Handle incoming WebSocket messages
 */
function handleWSMessage(data) {
  switch (data.type) {
    case 'connected':
      console.log('WS:', data.message);
      break;

    case 'task:created':
      if (typeof loadTasks === 'function') {
        loadTasks();
      }
      break;

    case 'task:updated':
      if (typeof loadTasks === 'function') {
        loadTasks();
      }
      break;

    case 'task:deleted':
      if (typeof loadTasks === 'function') {
        loadTasks();
      }
      break;

    default:
      console.log('Unknown WS message type:', data.type);
  }
}

/**
 * Attempt to reconnect WebSocket
 */
function attemptReconnect() {
  if (wsReconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    updateConnectionStatus('disconnected', 'Failed');
    return;
  }

  clearTimeout(wsReconnectTimer);
  wsReconnectTimer = setTimeout(() => {
    wsReconnectAttempts++;
    updateConnectionStatus('disconnected', `Retry ${wsReconnectAttempts}...`);
    initWebSocket();
  }, RECONNECT_DELAY);
}

/**
 * Update connection status indicator in the UI
 */
function updateConnectionStatus(status, text) {
  const el = document.getElementById('connectionStatus');
  const textEl = document.getElementById('connectionText');
  if (el) {
    el.className = `connection-status ${status}`;
  }
  if (textEl) {
    textEl.textContent = text;
  }
}

/**
 * Close WebSocket connection
 */
function closeWebSocket() {
  clearTimeout(wsReconnectTimer);
  if (ws) {
    ws.close();
    ws = null;
  }
}
