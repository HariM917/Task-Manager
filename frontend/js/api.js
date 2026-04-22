/* ═══════════════════════════════════════════
   API Wrapper — Centralized Fetch Logic
   (Cross-Origin Safe: Bearer Token Auth)
   ═══════════════════════════════════════════ */

/**
 * Get the saved auth token from localStorage.
 */
function getAuthToken() {
  return localStorage.getItem('taskflow_token');
}

/**
 * Save auth token to localStorage.
 */
function setAuthToken(token) {
  localStorage.setItem('taskflow_token', token);
}

/**
 * Remove auth token from localStorage.
 */
function removeAuthToken() {
  localStorage.removeItem('taskflow_token');
}

/**
 * Make an authenticated API request.
 * Uses Bearer token from localStorage for cross-origin compatibility.
 */
async function fetchAPI(url, options = {}) {
  const token = getAuthToken();

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  // Add Authorization header if token exists
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for empty bodies
  if (!options.body) {
    delete config.headers['Content-Type'];
  }

  try {
    const response = await fetch(`${CONFIG.API_URL}/api${url}`, config);

    // Handle 401 — redirect to login
    if (response.status === 401) {
      removeAuthToken();
      if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
        window.location.href = '/index.html';
        return null;
      }
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to server. Please check your connection.');
    }
    throw error;
  }
}

/**
 * Show a toast notification
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `<span>${icons[type] || icons.info}</span> ${message}`;
  
  container.appendChild(toast);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
