/* ═══════════════════════════════════════════
   Auth — Login, Register, Password Toggle
   (Cross-Origin Safe: Bearer Token Auth)
   ═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  // Check if already authenticated
  checkAuth();

  // Form references
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginSection = document.getElementById('loginSection');
  const registerSection = document.getElementById('registerSection');

  // Toggle between Login and Register
  document.getElementById('showRegister').addEventListener('click', (e) => {
    e.preventDefault();
    loginSection.style.display = 'none';
    registerSection.style.display = 'block';
    registerSection.querySelector('.auth-form-container, .auth-form-header')?.classList.add('animate-fadeInUp');
  });

  document.getElementById('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    registerSection.style.display = 'none';
    loginSection.style.display = 'block';
  });

  // Password visibility toggles
  setupPasswordToggle('loginPasswordToggle', 'loginPassword');
  setupPasswordToggle('registerPasswordToggle', 'registerPassword');

  // Login form submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Signing in...';

    try {
      const data = await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (data && data.success) {
        // Save token to localStorage for cross-origin auth
        if (data.token) {
          setAuthToken(data.token);
        }
        showToast(`Welcome back, ${data.user.name}!`, 'success');
        setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 500);
      }
    } catch (error) {
      showToast(error.message || 'Login failed', 'error');
      shakeElement(loginForm);
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Sign In';
    }
  });

  // Register form submission
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('registerBtn');
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;

    if (!name || !email || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Creating account...';

    try {
      const data = await fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      });

      if (data && data.success) {
        // Save token to localStorage for cross-origin auth
        if (data.token) {
          setAuthToken(data.token);
        }
        showToast('Account created successfully!', 'success');
        setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 500);
      }
    } catch (error) {
      showToast(error.message || 'Registration failed', 'error');
      shakeElement(registerForm);
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Create Account';
    }
  });
});

/**
 * Check if user is already logged in → redirect to dashboard
 */
async function checkAuth() {
  // Quick check — if no token, don't even try
  if (!getAuthToken()) return;

  try {
    const data = await fetchAPI('/auth/me');
    if (data && data.success) {
      window.location.href = '/dashboard.html';
    }
  } catch {
    // Not authenticated — clear stale token and stay on login page
    removeAuthToken();
  }
}

/**
 * Toggle password visibility
 */
function setupPasswordToggle(toggleId, inputId) {
  const toggle = document.getElementById(toggleId);
  const input = document.getElementById(inputId);
  if (!toggle || !input) return;

  toggle.addEventListener('click', () => {
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    toggle.textContent = isPassword ? '🙈' : '👁️';
  });
}

/**
 * Shake animation for form errors
 */
function shakeElement(el) {
  el.style.animation = 'none';
  el.offsetHeight; // Trigger reflow
  el.style.animation = 'shake 0.5s ease';
}

// Add shake keyframe
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }
`;
document.head.appendChild(style);
