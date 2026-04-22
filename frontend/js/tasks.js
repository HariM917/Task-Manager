/* ═══════════════════════════════════════════
   Tasks — CRUD, Rendering, Filtering
   ═══════════════════════════════════════════ */

let allTasks = [];
let currentFilter = 'all';
let currentPriority = 'all';
let currentSort = '-createdAt';
let currentSearch = '';
let currentView = 'list';
let editingTaskId = null;

/**
 * Load all tasks from the API
 */
async function loadTasks() {
  try {
    const params = new URLSearchParams();
    if (currentFilter !== 'all') params.set('status', currentFilter);
    if (currentPriority !== 'all') params.set('priority', currentPriority);
    if (currentSort) params.set('sort', currentSort);
    if (currentSearch) params.set('search', currentSearch);

    const queryStr = params.toString();
    const data = await fetchAPI(`/tasks${queryStr ? '?' + queryStr : ''}`);

    if (data && data.success) {
      allTasks = data.tasks;
      renderTasks();
      updateStats();
      updateSidebarCounts();
    }
  } catch (error) {
    console.error('Failed to load tasks:', error);
    showToast('Failed to load tasks', 'error');
  }
}

/**
 * Render tasks based on current view mode
 */
function renderTasks() {
  if (currentView === 'list') {
    renderListView();
  } else {
    renderKanbanView();
  }

  // Show/hide empty state
  const emptyState = document.getElementById('emptyState');
  const listView = document.getElementById('listView');
  const kanbanView = document.getElementById('kanbanView');

  if (allTasks.length === 0 && currentFilter === 'all' && !currentSearch) {
    emptyState.style.display = 'flex';
    listView.style.display = 'none';
    kanbanView.style.display = 'none';
  } else {
    emptyState.style.display = 'none';
    listView.style.display = currentView === 'list' ? 'block' : 'none';
    kanbanView.style.display = currentView === 'kanban' ? 'block' : 'none';
  }
}

/**
 * Render list view
 */
function renderListView() {
  const container = document.getElementById('taskList');
  
  if (allTasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: var(--space-2xl);">
        <div class="empty-state-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></div>
        <h3 class="empty-state-title">No tasks found</h3>
        <p class="empty-state-text">Try adjusting your filters or search query</p>
      </div>
    `;
    return;
  }

  container.innerHTML = allTasks.map((task, index) => createTaskCardHTML(task, index)).join('');
}

/**
 * Render kanban view
 */
function renderKanbanView() {
  const todoTasks = allTasks.filter(t => t.status === 'todo');
  const inProgressTasks = allTasks.filter(t => t.status === 'in-progress');
  const doneTasks = allTasks.filter(t => t.status === 'done');

  document.getElementById('kanbanTodo').innerHTML = 
    todoTasks.map(t => createTaskCardHTML(t)).join('') || 
    '<p style="text-align:center; color: var(--text-muted); padding: var(--space-lg); font-size: var(--font-size-sm);">No tasks</p>';
  
  document.getElementById('kanbanInProgress').innerHTML = 
    inProgressTasks.map(t => createTaskCardHTML(t)).join('') || 
    '<p style="text-align:center; color: var(--text-muted); padding: var(--space-lg); font-size: var(--font-size-sm);">No tasks</p>';
  
  document.getElementById('kanbanDone').innerHTML = 
    doneTasks.map(t => createTaskCardHTML(t)).join('') || 
    '<p style="text-align:center; color: var(--text-muted); padding: var(--space-lg); font-size: var(--font-size-sm);">No tasks</p>';

  // Update kanban counts
  document.getElementById('kanbanCountTodo').textContent = todoTasks.length;
  document.getElementById('kanbanCountInProgress').textContent = inProgressTasks.length;
  document.getElementById('kanbanCountDone').textContent = doneTasks.length;

  // Setup drag and drop
  setupDragAndDrop();
}

/**
 * Create HTML for a task card
 */
function createTaskCardHTML(task, index = 0) {
  const dueInfo = getDueDateInfo(task.dueDate);
  const priorityLabels = { high: 'High', medium: 'Medium', low: 'Low' };
  const statusLabels = { todo: 'To Do', 'in-progress': 'In Progress', done: 'Done' };

  return `
    <div class="task-card" 
         data-id="${task._id}" 
         data-priority="${task.priority}"
         data-status="${task.status}"
         draggable="true"
         style="animation-delay: ${index * 0.05}s">
      <div class="task-card-header">
        <span class="task-card-title ${task.status === 'done' ? 'completed' : ''}">${escapeHTML(task.title)}</span>
        <div class="task-card-actions">
          <button class="btn-icon btn-sm" onclick="openEditModal('${task._id}')" title="Edit" aria-label="Edit task" style="display:flex; align-items:center; justify-content:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
          <button class="btn-icon btn-sm" onclick="openDeleteModal('${task._id}')" title="Delete" aria-label="Delete task" style="display:flex; align-items:center; justify-content:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
        </div>
      </div>
      ${task.description ? `<p class="task-card-description">${escapeHTML(task.description)}</p>` : ''}
      <div class="task-card-meta">
        <span class="badge badge-priority-${task.priority}">${priorityLabels[task.priority]}</span>
        <span class="badge badge-status-${task.status}">${statusLabels[task.status]}</span>
        ${dueInfo ? `<span class="badge badge-due ${dueInfo.overdue ? 'overdue' : ''}">${dueInfo.text}</span>` : ''}
      </div>
    </div>
  `;
}

/**
 * Get due date display info
 */
function getDueDateInfo(dueDate) {
  if (!dueDate) return null;

  const due = new Date(dueDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

  let text;
  if (diffDays < 0) {
    text = `${Math.abs(diffDays)}d overdue`;
  } else if (diffDays === 0) {
    text = 'Due today';
  } else if (diffDays === 1) {
    text = 'Due tomorrow';
  } else if (diffDays <= 7) {
    text = `${diffDays}d left`;
  } else {
    text = `${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }

  return { text, overdue: diffDays < 0 };
}

/**
 * Update stats cards
 */
function updateStats() {
  // Fetch all tasks (unfiltered) for accurate stats
  fetchAPI('/tasks').then(data => {
    if (data && data.success) {
      const tasks = data.tasks;
      const total = tasks.length;
      const todo = tasks.filter(t => t.status === 'todo').length;
      const inProgress = tasks.filter(t => t.status === 'in-progress').length;
      const done = tasks.filter(t => t.status === 'done').length;

      animateNumber('statTotal', total);
      animateNumber('statTodo', todo);
      animateNumber('statInProgress', inProgress);
      animateNumber('statDone', done);
    }
  }).catch(() => {});
}

/**
 * Update sidebar navigation counts
 */
function updateSidebarCounts() {
  fetchAPI('/tasks').then(data => {
    if (data && data.success) {
      const tasks = data.tasks;
      document.getElementById('countAll').textContent = tasks.length;
      document.getElementById('countTodo').textContent = tasks.filter(t => t.status === 'todo').length;
      document.getElementById('countInProgress').textContent = tasks.filter(t => t.status === 'in-progress').length;
      document.getElementById('countDone').textContent = tasks.filter(t => t.status === 'done').length;
    }
  }).catch(() => {});
}

/**
 * Animate number counter
 */
function animateNumber(elementId, target) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const current = parseInt(el.textContent) || 0;
  if (current === target) return;

  const duration = 400;
  const start = performance.now();

  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    el.textContent = Math.round(current + (target - current) * eased);
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

/**
 * Open task modal for creating
 */
function openCreateModal() {
  editingTaskId = null;
  document.getElementById('modalTitle').textContent = 'New Task';
  document.getElementById('modalSaveBtn').textContent = 'Create Task';
  document.getElementById('taskTitle').value = '';
  document.getElementById('taskDescription').value = '';
  document.getElementById('taskStatus').value = 'todo';
  document.getElementById('taskPriority').value = 'medium';
  document.getElementById('taskDueDate').value = '';
  document.getElementById('taskModal').classList.add('active');
  document.getElementById('taskTitle').focus();
}

/**
 * Open task modal for editing
 */
function openEditModal(taskId) {
  const task = allTasks.find(t => t._id === taskId);
  if (!task) return;

  editingTaskId = taskId;
  document.getElementById('modalTitle').textContent = 'Edit Task';
  document.getElementById('modalSaveBtn').textContent = 'Save Changes';
  document.getElementById('taskTitle').value = task.title;
  document.getElementById('taskDescription').value = task.description || '';
  document.getElementById('taskStatus').value = task.status;
  document.getElementById('taskPriority').value = task.priority;
  document.getElementById('taskDueDate').value = task.dueDate ? task.dueDate.split('T')[0] : '';
  document.getElementById('taskModal').classList.add('active');
  document.getElementById('taskTitle').focus();
}

/**
 * Close task modal
 */
function closeTaskModal() {
  document.getElementById('taskModal').classList.remove('active');
  editingTaskId = null;
}

/**
 * Save task (create or update)
 */
async function saveTask() {
  const title = document.getElementById('taskTitle').value.trim();
  const description = document.getElementById('taskDescription').value.trim();
  const status = document.getElementById('taskStatus').value;
  const priority = document.getElementById('taskPriority').value;
  const dueDate = document.getElementById('taskDueDate').value || null;

  if (!title) {
    showToast('Task title is required', 'error');
    document.getElementById('taskTitle').classList.add('error');
    return;
  }

  const btn = document.getElementById('modalSaveBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Saving...';

  try {
    const body = { title, description, status, priority, dueDate };

    if (editingTaskId) {
      // Update
      await fetchAPI(`/tasks/${editingTaskId}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      });
      showToast('Task updated successfully', 'success');
    } else {
      // Create
      await fetchAPI('/tasks', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      showToast('Task created successfully', 'success');
    }

    closeTaskModal();
    await loadTasks();
  } catch (error) {
    showToast(error.message || 'Failed to save task', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = editingTaskId ? 'Save Changes' : 'Create Task';
  }
}

/**
 * Open delete confirmation modal
 */
let deletingTaskId = null;

function openDeleteModal(taskId) {
  const task = allTasks.find(t => t._id === taskId);
  if (!task) return;

  deletingTaskId = taskId;
  document.getElementById('deleteTaskTitle').textContent = task.title;
  document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
  document.getElementById('deleteModal').classList.remove('active');
  deletingTaskId = null;
}

/**
 * Confirm delete task
 */
async function confirmDeleteTask() {
  if (!deletingTaskId) return;

  const btn = document.getElementById('deleteConfirmBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Deleting...';

  try {
    await fetchAPI(`/tasks/${deletingTaskId}`, { method: 'DELETE' });
    showToast('Task deleted', 'success');
    closeDeleteModal();
    await loadTasks();
  } catch (error) {
    showToast(error.message || 'Failed to delete task', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Delete';
  }
}

/**
 * Setup drag-and-drop for kanban
 */
function setupDragAndDrop() {
  const cards = document.querySelectorAll('.task-card[draggable="true"]');
  const columns = document.querySelectorAll('.kanban-tasks');

  cards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', card.dataset.id);
      card.classList.add('dragging');
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      columns.forEach(col => col.classList.remove('drag-over'));
    });
  });

  columns.forEach(column => {
    column.addEventListener('dragover', (e) => {
      e.preventDefault();
      column.classList.add('drag-over');
    });

    column.addEventListener('dragleave', () => {
      column.classList.remove('drag-over');
    });

    column.addEventListener('drop', async (e) => {
      e.preventDefault();
      column.classList.remove('drag-over');

      const taskId = e.dataTransfer.getData('text/plain');
      const newStatus = column.closest('.kanban-column').dataset.status;

      try {
        await fetchAPI(`/tasks/${taskId}`, {
          method: 'PUT',
          body: JSON.stringify({ status: newStatus })
        });
        showToast(`Task moved to ${newStatus.replace('-', ' ')}`, 'info');
        await loadTasks();
      } catch (error) {
        showToast('Failed to update task status', 'error');
      }
    });
  });
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
