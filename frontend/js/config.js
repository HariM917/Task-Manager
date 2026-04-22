/* ═══════════════════════════════════════════
   Config — Environment-Aware API URL
   ═══════════════════════════════════════════ */

/**
 * Automatically detect the correct API URL:
 * - In development (localhost): use same origin
 * - In production (Vercel): use the Render backend URL
 * 
 * ⚠️  IMPORTANT: After deploying backend to Render,
 *     replace the RENDER_BACKEND_URL below with your actual Render URL.
 *     Example: https://taskflow-api.onrender.com
 */
const RENDER_BACKEND_URL = 'https://YOUR-BACKEND.onrender.com';

const CONFIG = (() => {
  const isLocalhost = window.location.hostname === 'localhost' 
    || window.location.hostname === '127.0.0.1';

  const API_URL = isLocalhost ? '' : RENDER_BACKEND_URL;

  const WS_URL = isLocalhost
    ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
    : RENDER_BACKEND_URL.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');

  return Object.freeze({
    API_URL,
    WS_URL,
    IS_PRODUCTION: !isLocalhost
  });
})();
