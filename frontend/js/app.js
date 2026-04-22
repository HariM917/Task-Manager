/* ═══════════════════════════════════════════
   App — Initialization, Event Listeners, State
   ═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

/**
 * Initialize the dashboard application
 */
async function initApp() {
  // 1. Check authentication
  const user = await checkDashboardAuth();
  if (!user) return;

  // 2. Display user info
  displayUserInfo(user);

  // 3. Show dashboard, hide loading
  document.getElementById('loadingScreen').style.display = 'none';
  document.getElementById('dashboardContainer').style.display = 'flex';

  // 4. Load tasks
  await loadTasks();

  // 5. Initialize WebSocket
  initWebSocket();

  // 6. Setup event listeners
  setupEventListeners();
}

/**
 * Check if user is authenticated
 */
async function checkDashboardAuth() {
  try {
    const data = await fetchAPI('/auth/me');
    if (data && data.success) {
      return data.user;
    }
  } catch {
    window.location.href = '/index.html';
  }
  return null;
}

/**
 * Display user info in sidebar
 */
function displayUserInfo(user) {
  document.getElementById('userName').textContent = user.name;
  document.getElementById('userEmail').textContent = user.email;
  document.getElementById('userAvatar').textContent = user.name.charAt(0).toUpperCase();
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  // ── Add Task Buttons ──
  document.getElementById('addTaskBtn').addEventListener('click', openCreateModal);
  document.getElementById('emptyAddBtn')?.addEventListener('click', openCreateModal);

  // ── Task Modal ──
  document.getElementById('modalCloseBtn').addEventListener('click', closeTaskModal);
  document.getElementById('modalCancelBtn').addEventListener('click', closeTaskModal);
  document.getElementById('modalSaveBtn').addEventListener('click', saveTask);
  document.getElementById('taskModal').addEventListener('click', (e) => {
    if (e.target.id === 'taskModal') closeTaskModal();
  });

  // ── Delete Modal ──
  document.getElementById('deleteModalCloseBtn').addEventListener('click', closeDeleteModal);
  document.getElementById('deleteCancelBtn').addEventListener('click', closeDeleteModal);
  document.getElementById('deleteConfirmBtn').addEventListener('click', confirmDeleteTask);
  document.getElementById('deleteModal').addEventListener('click', (e) => {
    if (e.target.id === 'deleteModal') closeDeleteModal();
  });

  // ── Keyboard Shortcuts ──
  document.addEventListener('keydown', (e) => {
    // Escape to close modals
    if (e.key === 'Escape') {
      closeTaskModal();
      closeDeleteModal();
    }
    // Enter to save in task modal
    if (e.key === 'Enter' && e.ctrlKey) {
      const modal = document.getElementById('taskModal');
      if (modal.classList.contains('active')) {
        saveTask();
      }
    }
    // N to create new task (when not in input)
    if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !isInputFocused()) {
      openCreateModal();
    }
  });

  // ── Sidebar Navigation ──
  document.querySelectorAll('.sidebar-link[data-filter]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      currentFilter = link.dataset.filter;

      // Update active state
      document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      loadTasks();
    });
  });

  // ── Priority Filter ──
  document.querySelectorAll('#priorityFilter .filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      currentPriority = chip.dataset.priority;

      // Update active state
      document.querySelectorAll('#priorityFilter .filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      loadTasks();
    });
  });

  // ── Sort Select ──
  document.getElementById('sortSelect').addEventListener('change', (e) => {
    currentSort = e.target.value;
    loadTasks();
  });

  // ── Search ──
  let searchTimeout;
  document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentSearch = e.target.value.trim();
      loadTasks();
    }, 300);
  });

  // ── View Toggle ──
  document.getElementById('listViewBtn').addEventListener('click', () => {
    currentView = 'list';
    document.getElementById('listViewBtn').classList.add('active');
    document.getElementById('kanbanViewBtn').classList.remove('active');
    renderTasks();
  });

  document.getElementById('kanbanViewBtn').addEventListener('click', () => {
    currentView = 'kanban';
    document.getElementById('kanbanViewBtn').classList.add('active');
    document.getElementById('listViewBtn').classList.remove('active');
    renderTasks();
  });

  // ── Logout ──
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
      await fetchAPI('/auth/logout', { method: 'POST' });
    } catch {
      // Server logout failed, but we'll clear locally anyway
    }
    removeAuthToken();
    closeWebSocket();
    window.location.href = '/index.html';
  });

  // ── Mobile Menu ──
  document.getElementById('mobileMenuBtn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('active');
  });

  document.getElementById('sidebarOverlay').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');
  });

  // ── Remove error class on input focus ──
  document.getElementById('taskTitle').addEventListener('focus', () => {
    document.getElementById('taskTitle').classList.remove('error');
  });
}

/**
 * Check if an input/textarea is currently focused
 */
function isInputFocused() {
  const active = document.activeElement;
  return active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT');
}
