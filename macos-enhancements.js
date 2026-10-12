/**
 * MACOS-ENHANCEMENTS.JS — Core macOS Window Manager, Tabs, Dock, Mission Control & Router
 * Single Source of Truth architecture with 60fps GPU-accelerated WAAPI/CSS physics.
 */

export const WINDOW_METADATA = {
  home: { title: 'Home', symbol: 'icon-house', color: '#0284c7', gradient: 'linear-gradient(135deg, #0284c7, #0369a1)' },
  resume: { title: 'Resume', symbol: 'icon-doc-text', color: '#475569', gradient: 'linear-gradient(135deg, #475569, #334155)' },
  services: { title: 'Services', symbol: 'icon-briefcase', color: '#2563eb', gradient: 'linear-gradient(135deg, #2563eb, #1d4ed8)' },
  projects: { title: 'Projects', symbol: 'icon-folder', color: '#0ea5e9', gradient: 'linear-gradient(135deg, #0ea5e9, #0284c7)' },
  certificates: { title: 'Certificates', symbol: 'icon-rosette', color: '#059669', gradient: 'linear-gradient(135deg, #059669, #047857)' },
  education: { title: 'Education', symbol: 'icon-graduationcap', color: '#d97706', gradient: 'linear-gradient(135deg, #d97706, #b45309)' },
  skills: { title: 'Skills', symbol: 'icon-cpu', color: '#38bdf8', gradient: 'linear-gradient(135deg, #0284c7, #2563eb)' },
  contact: { title: 'Contact', symbol: 'icon-envelope', color: '#6366f1', gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)' },
  website: { title: 'Website: mmsingh.me', symbol: 'icon-globe', color: '#06b6d4', gradient: 'linear-gradient(135deg, #06b6d4, #0d9488)', tooltip: 'Website: mmsingh.me' },
  terminal: { title: 'Terminal', symbol: 'icon-terminal', color: '#38bdf8', gradient: 'linear-gradient(135deg, #1e1e24, #121217)' }
};

export const ALL_WINDOW_IDS = Object.keys(WINDOW_METADATA);

class WindowManager {
  constructor() {
    this.state = {
      openWindows: ['home'],
      activeId: 'home',
      minimized: {},
      theme: 'dark'
    };

    this.isTransitioning = false;
    this.activeTransitionTimer = null;
    this.isMissionControlOpen = false;
    this.draggedTabId = null;

    // DOM references
    this.tablistEl = document.getElementById('macos-tablist');
    this.windowStageEl = document.getElementById('window-stage');
    this.dockEl = document.getElementById('macos-dock');
    this.missionControlEl = document.getElementById('mission-control-overlay');
    this.mcGridEl = document.getElementById('mc-windows-grid');
    this.themeToggleBtn = document.getElementById('theme-toggle');
    this.missionControlBtn = document.getElementById('btn-mission-control');
    this.clockEl = document.getElementById('system-clock');
    this.backBtn = document.getElementById('btn-history-back');
    this.forwardBtn = document.getElementById('btn-history-forward');
  }

  init() {
    this.loadState();
    this.initTheme();
    this.initClock();
    this.renderTabs();
    this.updateDockState();
    this.bindWindowControls();
    this.bindDockEvents();
    this.bindTabEvents();
    this.bindKeyboardShortcuts();
    this.bindTouchAndWheelGestures();
    this.bindRouter();
    this.bindMissionControl();
    this.bindVisibilityChange();

    // Deep link or initial activation
    const initialHash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    if (initialHash && ALL_WINDOW_IDS.includes(initialHash)) {
      this.openWindow(initialHash, false);
    } else {
      this.activateWindow(this.state.activeId, 'none');
    }
  }

  /* ------------------------------------------------------------------------
     State & Persistence
     ------------------------------------------------------------------------ */
  loadState() {
    try {
      const saved = localStorage.getItem('macos_portfolio_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.openWindows) && parsed.openWindows.includes('home')) {
          this.state.openWindows = parsed.openWindows.filter((id) => ALL_WINDOW_IDS.includes(id));
        }
        if (parsed.activeId && ALL_WINDOW_IDS.includes(parsed.activeId)) {
          this.state.activeId = parsed.activeId;
        }
      }
    } catch {
      // Fallback to default state
    }

    if (!this.state.openWindows.includes('home')) {
      this.state.openWindows.unshift('home');
    }
    if (!this.state.openWindows.includes(this.state.activeId)) {
      this.state.activeId = 'home';
    }
  }

  saveState() {
    try {
      localStorage.setItem(
        'macos_portfolio_state',
        JSON.stringify({
          openWindows: this.state.openWindows,
          activeId: this.state.activeId
        })
      );
    } catch {
      // Ignore storage errors
    }
  }

  /* ------------------------------------------------------------------------
     Theme Management (Zero-FOUC, persists, system preference)
     ------------------------------------------------------------------------ */
  initTheme() {
    const savedTheme = localStorage.getItem('macos_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.state.theme = savedTheme || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', this.state.theme);

    if (this.themeToggleBtn) {
      this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('macos_theme')) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  toggleTheme() {
    const nextTheme = this.state.theme === 'dark' ? 'light' : 'dark';
    this.setTheme(nextTheme);
  }

  setTheme(theme) {
    this.state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('macos_theme', theme);
  }

  /* ------------------------------------------------------------------------
     System Clock
     ------------------------------------------------------------------------ */
  initClock() {
    if (!this.clockEl) return;
    const update = () => {
      const now = new Date();
      this.clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    update();
    setInterval(update, 10000);
  }

  /* ------------------------------------------------------------------------
     Window Navigation & Lifecycle
     ------------------------------------------------------------------------ */
  openWindow(id, updateHash = true) {
    if (!ALL_WINDOW_IDS.includes(id)) return;

    // If window is minimized, restore it
    if (this.state.minimized[id]) {
      this.restoreWindow(id);
      return;
    }

    // Add to openWindows if not present
    if (!this.state.openWindows.includes(id)) {
      this.state.openWindows.push(id);
      this.renderTabs();
      this.updateDockState();
    }

    this.activateWindow(id, 'auto', updateHash);
  }

  activateWindow(id, direction = 'auto', updateHash = true) {
    if (!ALL_WINDOW_IDS.includes(id)) return;
    if (this.state.activeId === id && !this.isTransitioning) return;

    // Interrupt any mid-flight transition cleanly
    if (this.activeTransitionTimer) {
      clearTimeout(this.activeTransitionTimer);
      this.activeTransitionTimer = null;
    }

    const prevId = this.state.activeId;
    const prevWin = document.getElementById(`win-${prevId}`);
    const nextWin = document.getElementById(`win-${id}`);

    if (!nextWin) return;

    // Clear animations across all windows for clean interruptibility
    document.querySelectorAll('.macos-window').forEach((w) => {
      w.classList.remove('slide-out-left', 'slide-out-right', 'slide-in-left', 'slide-in-right', 'is-animating');
    });

    // Determine direction for carousel slide
    if (direction === 'auto') {
      const prevIdx = this.state.openWindows.indexOf(prevId);
      const nextIdx = this.state.openWindows.indexOf(id);
      direction = nextIdx >= prevIdx ? 'next' : 'prev';
    }

    this.isTransitioning = true;
    this.state.activeId = id;
    this.saveState();

    // Update Browser Tab Selection
    this.highlightActiveTab(id);
    this.updateDockState();

    // Check prefers-reduced-motion
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prevWin && prevWin !== nextWin && !reducedMotion && direction !== 'none') {
      const outClass = direction === 'next' ? 'slide-out-left' : 'slide-out-right';
      const inClass = direction === 'next' ? 'slide-in-right' : 'slide-in-left';

      prevWin.classList.remove('active');
      prevWin.classList.add(outClass, 'is-animating');
      prevWin.setAttribute('aria-hidden', 'true');
      prevWin.setAttribute('tabindex', '-1');

      nextWin.classList.add('active', inClass, 'is-animating');
      nextWin.setAttribute('aria-hidden', 'false');
      nextWin.setAttribute('tabindex', '0');

      this.activeTransitionTimer = setTimeout(() => {
        prevWin.classList.remove(outClass, 'is-animating');
        nextWin.classList.remove(inClass, 'is-animating');
        this.isTransitioning = false;
        this.activeTransitionTimer = null;
        nextWin.focus({ preventScroll: true });
      }, 320);
    } else {
      // Immediate switch or initial
      document.querySelectorAll('.macos-window').forEach((w) => {
        w.classList.remove('active');
        w.setAttribute('aria-hidden', 'true');
        w.setAttribute('tabindex', '-1');
      });

      nextWin.classList.add('active');
      nextWin.setAttribute('aria-hidden', 'false');
      nextWin.setAttribute('tabindex', '0');
      this.isTransitioning = false;
      nextWin.focus({ preventScroll: true });
    }

    if (updateHash) {
      window.history.replaceState(null, '', `#/${id}`);
    }

    window.dispatchEvent(new CustomEvent('windowActivated', { detail: { id, windowId: id, prevId } }));
  }

  closeWindow(id) {
    if (id === 'home') {
      // Home tab protected: cannot be closed
      this.activateWindow('home');
      return;
    }

    const idx = this.state.openWindows.indexOf(id);
    if (idx === -1) return;

    const winEl = document.getElementById(`win-${id}`);
    const wasActive = this.state.activeId === id;

    // Animate window close
    if (winEl) {
      winEl.classList.add('window-closing');
      setTimeout(() => {
        winEl.classList.remove('active', 'window-closing');
        winEl.setAttribute('aria-hidden', 'true');
      }, 240);
    }

    // Remove from open list
    this.state.openWindows.splice(idx, 1);
    delete this.state.minimized[id];

    // If closing active tab, activate nearest neighbor
    if (wasActive) {
      const nextActiveIdx = Math.min(idx, this.state.openWindows.length - 1);
      const nextActiveId = this.state.openWindows[nextActiveIdx] || 'home';
      this.activateWindow(nextActiveId, 'prev');
    }

    this.renderTabs();
    this.updateDockState();
    this.saveState();
  }

  minimizeWindow(id) {
    const winEl = document.getElementById(`win-${id}`);
    if (!winEl) return;

    this.state.minimized[id] = true;
    winEl.classList.add('genie-minimizing');

    setTimeout(() => {
      winEl.classList.remove('active', 'genie-minimizing');
      winEl.setAttribute('aria-hidden', 'true');

      // Switch to next available window
      const openRemaining = this.state.openWindows.filter((wId) => !this.state.minimized[wId]);
      if (openRemaining.length > 0) {
        this.activateWindow(openRemaining[0], 'next');
      } else {
        this.openWindow('home');
      }
      this.updateDockState();
    }, 380);
  }

  restoreWindow(id) {
    const winEl = document.getElementById(`win-${id}`);
    if (!winEl) return;

    delete this.state.minimized[id];
    winEl.classList.add('active', 'genie-restoring');
    winEl.setAttribute('aria-hidden', 'false');

    setTimeout(() => {
      winEl.classList.remove('genie-restoring');
      this.activateWindow(id, 'auto');
    }, 380);
  }

  toggleZoom(id) {
    const winEl = document.getElementById(`win-${id}`);
    if (winEl) {
      winEl.classList.toggle('is-maximized');
    }
  }

  /* ------------------------------------------------------------------------
     Browser Tab Bar Manager
     ------------------------------------------------------------------------ */
  renderTabs() {
    if (!this.tablistEl) return;
    this.tablistEl.innerHTML = '';

    this.state.openWindows.forEach((id) => {
      const meta = WINDOW_METADATA[id] || { title: id, icon: 'fa-solid fa-window-maximize' };
      const isActive = id === this.state.activeId;

      const tab = document.createElement('div');
      tab.className = `macos-tab ${isActive ? 'active' : ''}`;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('id', `tab-${id}`);
      tab.setAttribute('aria-controls', `win-${id}`);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      tab.setAttribute('data-tab-id', id);
      tab.setAttribute('draggable', 'true');

      tab.innerHTML = `
        <svg class="tab-sf-icon" width="14" height="14" aria-hidden="true"><use href="#${meta.symbol || 'icon-house'}"></use></svg>
        <span class="tab-title">${meta.title}</span>
        ${
          id !== 'home'
            ? `<button class="tab-close" data-tab-close="${id}" aria-label="Close ${meta.title} tab"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`
            : ''
        }
      `;

      this.tablistEl.appendChild(tab);
    });

    this.scrollActiveTabIntoView();
  }

  highlightActiveTab(id) {
    document.querySelectorAll('.macos-tab').forEach((tab) => {
      const tabId = tab.getAttribute('data-tab-id');
      const isActive = tabId === id;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    this.scrollActiveTabIntoView();
  }

  scrollActiveTabIntoView() {
    const activeTab = this.tablistEl?.querySelector('.macos-tab.active');
    if (activeTab) {
      activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }

  bindTabEvents() {
    if (!this.tablistEl) return;

    // Click to select tab or close tab
    this.tablistEl.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('[data-tab-close]');
      if (closeBtn) {
        e.stopPropagation();
        const idToClose = closeBtn.getAttribute('data-tab-close');
        this.closeWindow(idToClose);
        return;
      }

      const tab = e.target.closest('.macos-tab');
      if (tab) {
        const id = tab.getAttribute('data-tab-id');
        if (id) this.activateWindow(id, 'auto');
      }
    });

    // Middle click to close tab
    this.tablistEl.addEventListener('auxclick', (e) => {
      if (e.button === 1) {
        // Middle click
        const tab = e.target.closest('.macos-tab');
        if (tab) {
          const id = tab.getAttribute('data-tab-id');
          if (id && id !== 'home') {
            e.preventDefault();
            this.closeWindow(id);
          }
        }
      }
    });

    // Drag-to-reorder tabs
    this.tablistEl.addEventListener('dragstart', (e) => {
      const tab = e.target.closest('.macos-tab');
      if (tab) {
        this.draggedTabId = tab.getAttribute('data-tab-id');
        tab.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
      }
    });

    this.tablistEl.addEventListener('dragend', (e) => {
      const tab = e.target.closest('.macos-tab');
      if (tab) tab.classList.remove('is-dragging');
      this.draggedTabId = null;
    });

    this.tablistEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });

    this.tablistEl.addEventListener('drop', (e) => {
      e.preventDefault();
      const targetTab = e.target.closest('.macos-tab');
      if (targetTab && this.draggedTabId) {
        const targetId = targetTab.getAttribute('data-tab-id');
        if (targetId && targetId !== this.draggedTabId) {
          const fromIdx = this.state.openWindows.indexOf(this.draggedTabId);
          const toIdx = this.state.openWindows.indexOf(targetId);
          if (fromIdx !== -1 && toIdx !== -1) {
            this.state.openWindows.splice(fromIdx, 1);
            this.state.openWindows.splice(toIdx, 0, this.draggedTabId);
            this.renderTabs();
            this.saveState();
          }
        }
      }
    });
  }

  /* ------------------------------------------------------------------------
     Floating Glass Dock
     ------------------------------------------------------------------------ */
  bindDockEvents() {
    if (!this.dockEl) return;

    this.dockEl.addEventListener('click', (e) => {
      const dockBtn = e.target.closest('.dock-item[data-window-id]');
      if (dockBtn) {
        const id = dockBtn.getAttribute('data-window-id');
        if (id) this.openWindow(id);
      }
    });
  }

  updateDockState() {
    if (!this.dockEl) return;
    this.dockEl.querySelectorAll('.dock-item[data-window-id]').forEach((btn) => {
      const id = btn.getAttribute('data-window-id');
      const isOpen = this.state.openWindows.includes(id) && !this.state.minimized[id];
      const isActive = this.state.activeId === id && isOpen;

      btn.classList.toggle('has-window', isOpen);
      btn.classList.toggle('active', isActive);
    });
  }

  /* ------------------------------------------------------------------------
     Window Titlebar Controls (Traffic Lights)
     ------------------------------------------------------------------------ */
  bindWindowControls() {
    document.querySelectorAll('.macos-window').forEach((win) => {
      const winId = win.getAttribute('data-window-id');

      win.addEventListener('click', (e) => {
        const trafficBtn = e.target.closest('.traffic-dot');
        if (!trafficBtn) return;

        const action = trafficBtn.getAttribute('data-action');
        if (action === 'close') {
          this.closeWindow(winId);
        } else if (action === 'minimize') {
          this.minimizeWindow(winId);
        } else if (action === 'zoom') {
          this.toggleZoom(winId);
        }
      });
    });

    // Delegated data-open-window clicks (e.g., hero buttons, quick stats)
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-open-window]');
      if (trigger) {
        e.preventDefault();
        const targetId = trigger.getAttribute('data-open-window');
        if (targetId) this.openWindow(targetId);
      }
    });

    // History steppers
    this.backBtn?.addEventListener('click', () => this.cycleTab(-1));
    this.forwardBtn?.addEventListener('click', () => this.cycleTab(1));
  }

  /* ------------------------------------------------------------------------
     Mission Control Overlay
     ------------------------------------------------------------------------ */
  bindMissionControl() {
    this.missionControlBtn?.addEventListener('click', () => this.toggleMissionControl());

    this.missionControlEl?.addEventListener('click', (e) => {
      if (e.target.classList.contains('mc-backdrop') || e.target.closest('.mc-header')) {
        this.closeMissionControl();
        return;
      }

      // Handle close button on hover
      const closeBtn = e.target.closest('.mc-card-close');
      if (closeBtn) {
        e.stopPropagation();
        const id = closeBtn.getAttribute('data-close-mc');
        if (id) {
          this.closeWindow(id, e);
          const card = closeBtn.closest('.mc-window-card');
          card?.remove();
        }
        return;
      }

      const card = e.target.closest('.mc-window-card');
      if (card) {
        const id = card.getAttribute('data-mc-id');
        if (id) {
          this.closeMissionControl();
          this.activateWindow(id, 'auto');
        }
      }
    });
  }

  toggleMissionControl() {
    if (this.isMissionControlOpen) {
      this.closeMissionControl();
    } else {
      this.openMissionControl();
    }
  }

  openMissionControl() {
    if (!this.missionControlEl || !this.mcGridEl) return;
    this.isMissionControlOpen = true;
    this.mcGridEl.replaceChildren();

    // Populate thumbnails of all windows (open windows live, unmounted windows icon+title)
    ALL_WINDOW_IDS.forEach((id, idx) => {
      const meta = WINDOW_METADATA[id] || { title: id, symbol: 'icon-folder', color: '#0a84ff' };
      const winEl = document.getElementById(`win-${id}`);
      const isOpen = this.state.openWindows.includes(id);

      const card = document.createElement('div');
      card.className = `mc-window-card ${isOpen ? 'is-open' : 'is-unmounted'}`;
      card.setAttribute('data-mc-id', id);
      card.style.animationDelay = `${idx * 30}ms`;

      const closeBtnHtml = (isOpen && id !== 'home')
        ? `<button class="mc-card-close" data-close-mc="${id}" aria-label="Close ${meta.title} window">&times;</button>`
        : '';

      let previewBody = '';
      if (isOpen && winEl) {
        const titleText = winEl.querySelector('.section-intro h2, h2, h3')?.textContent || meta.title;
        const descText = winEl.querySelector('.section-intro p, p')?.textContent || 'Active Window Workspace';
        previewBody = `
          <div class="mc-live-preview">
            <span class="mc-preview-badge">${meta.title}</span>
            <div class="mc-preview-snippet">
              <h5>${titleText}</h5>
              <p>${descText.slice(0, 90)}...</p>
            </div>
          </div>
        `;
      } else {
        previewBody = `
          <div class="mc-unmounted-preview">
            <span class="mc-launch-hint">Click to Open</span>
          </div>
        `;
      }

      card.innerHTML = `
        ${closeBtnHtml}
        <div class="mc-card-viewport">
          <svg class="mc-card-watermark" width="96" height="96" aria-hidden="true" style="color: ${meta.color};">
            <use href="#${meta.symbol}"></use>
          </svg>
          ${previewBody}
        </div>
        <div class="mc-card-label">
          <svg width="14" height="14" class="titlebar-symbol" aria-hidden="true"><use href="#${meta.symbol}"></use></svg>
          <span>${meta.title}</span>
        </div>
      `;

      this.mcGridEl.appendChild(card);
    });

    this.missionControlEl.classList.add('active');
    this.missionControlEl.setAttribute('aria-hidden', 'false');
  }

  closeMissionControl() {
    if (!this.missionControlEl) return;
    this.isMissionControlOpen = false;
    this.missionControlEl.classList.remove('active');
    this.missionControlEl.setAttribute('aria-hidden', 'true');
  }

  /* ------------------------------------------------------------------------
     Keyboard Shortcuts
     ------------------------------------------------------------------------ */
  bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Escape closes Mission Control or QuickLook
      if (e.key === 'Escape') {
        if (this.isMissionControlOpen) {
          e.preventDefault();
          this.closeMissionControl();
          return;
        }
        const qlModal = document.getElementById('quicklook-modal');
        if (qlModal && qlModal.classList.contains('active')) {
          qlModal.classList.remove('active');
          qlModal.setAttribute('aria-hidden', 'true');
          return;
        }
      }

      // Mission Control trigger: F3 or Ctrl+Up Arrow
      if (e.key === 'F3' || (e.ctrlKey && e.key === 'ArrowUp')) {
        e.preventDefault();
        this.toggleMissionControl();
        return;
      }

      // Ignore standard keys if user is typing in form inputs
      const isInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
      if (isInput) return;

      // Ctrl/Cmd + W: Close active tab
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        this.closeWindow(this.state.activeId);
        return;
      }

      // Ctrl+Tab / Ctrl+Shift+Tab: Cycle tabs
      if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault();
        this.cycleTab(e.shiftKey ? -1 : 1);
        return;
      }

      // Arrow Left / Arrow Right: Switch window
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.cycleTab(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.cycleTab(1);
      }
    });
  }

  cycleTab(offset) {
    if (this.state.openWindows.length <= 1) return;
    const currentIdx = this.state.openWindows.indexOf(this.state.activeId);
    let nextIdx = (currentIdx + offset + this.state.openWindows.length) % this.state.openWindows.length;
    const nextId = this.state.openWindows[nextIdx];
    this.activateWindow(nextId, offset > 0 ? 'next' : 'prev');
  }

  /* ------------------------------------------------------------------------
     Touch & Wheel Swipe Gestures (Horizontal Gallery Switching)
     ------------------------------------------------------------------------ */
  bindTouchAndWheelGestures() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let lastWheelTime = 0;

    // Trackpad horizontal swipe
    window.addEventListener(
      'wheel',
      (e) => {
        // Wheel/trackpad window switching must not hijack scroll inside a scrollable window:
        // only switch when the inner scroller is at its edge AND horizontal intent dominates (|deltaX| > |deltaY|),
        // or via keys/swipe on the title bar.
        const scroller = e.target.closest('.window-content-scroll, .terminal-body');
        if (scroller) {
          const atLeftEdge = scroller.scrollLeft <= 2;
          const atRightEdge = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 2;
          const atEdge = e.deltaX > 0 ? atRightEdge : atLeftEdge;
          if (!atEdge) return;
        }

        // Only trigger on dominant horizontal delta with cooldown
        if (Math.abs(e.deltaX) > 40 && Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.4) {
          const now = Date.now();
          if (now - lastWheelTime > 320) {
            lastWheelTime = now;
            if (e.deltaX > 0) {
              this.cycleTab(1);
            } else {
              this.cycleTab(-1);
            }
          }
        }
      },
      { passive: true }
    );

    // Mobile touch gestures with boundary verification
    this.windowStageEl?.addEventListener(
      'touchstart',
      (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
      },
      { passive: true }
    );

    this.windowStageEl?.addEventListener(
      'touchend',
      (e) => {
        const titleBar = e.target.closest('.window-titlebar, .macos-browser-bar');
        const scroller = e.target.closest('.window-content-scroll, .terminal-body');
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        const deltaY = e.changedTouches[0].clientY - touchStartY;
        const duration = Math.max(1, Date.now() - touchStartTime);
        const velocity = Math.abs(deltaX) / duration;

        if (scroller && !titleBar) {
          const atLeftEdge = scroller.scrollLeft <= 2;
          const atRightEdge = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 2;
          const atEdge = deltaX < 0 ? atRightEdge : atLeftEdge;
          if (!atEdge) return;
        }

        // If horizontal swipe is dominant and significant (>45px or velocity > 0.35 px/ms)
        if ((Math.abs(deltaX) > 45 || velocity > 0.35) && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
          if (deltaX < 0) {
            this.cycleTab(1); // Swipe left -> next
          } else {
            this.cycleTab(-1); // Swipe right -> prev
          }
        }
      },
      { passive: true }
    );
  }

  /* ------------------------------------------------------------------------
     Visibility Change (Pause Background Drift When Hidden)
     ------------------------------------------------------------------------ */
  bindVisibilityChange() {
    const handleVisibility = () => {
      const bg = document.getElementById('ambient-background');
      if (document.hidden) {
        bg?.classList.add('is-paused');
        document.body.classList.add('is-paused');
      } else {
        bg?.classList.remove('is-paused');
        document.body.classList.remove('is-paused');
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
  }

  /* ------------------------------------------------------------------------
     Hash Routing (#/projects, #/skills, #/contact)
     ------------------------------------------------------------------------ */
  bindRouter() {
    window.addEventListener('hashchange', () => {
      const hashId = window.location.hash.replace(/^#\/?/, '').toLowerCase();
      if (hashId && ALL_WINDOW_IDS.includes(hashId) && hashId !== this.state.activeId) {
        this.openWindow(hashId, false);
      }
    });
  }
}

// Export singleton instance
export const windowManager = new WindowManager();
