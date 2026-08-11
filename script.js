/* OXYGENATED NEW TAB // HIGH-CONTRAST MATRIX ENGINE */
'use strict';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* App State */
const state = {
  theme: localStorage.getItem('oxy_theme') || 'light',
  clock24h: localStorage.getItem('oxy_clock_24h') !== 'false',
  searchEngine: 'google', // google, duckduckgo, github, youtube, wikipedia
  bgBaseOpacity: parseFloat(localStorage.getItem('oxy_bg_base')) || 0.22,
  bgHoverOpacity: parseFloat(localStorage.getItem('oxy_bg_hover')) || 0.85,
  bgSpacing: parseInt(localStorage.getItem('oxy_bg_spacing')) || 24,
  shortcuts: JSON.parse(localStorage.getItem('oxy_shortcuts')) || [
    { id: '1', title: 'GitHub', url: 'https://github.com', key: '1', icon: 'GH' },
    { id: '2', title: 'YouTube', url: 'https://youtube.com', key: '2', icon: 'YT' },
    { id: '3', title: 'Reddit', url: 'https://reddit.com', key: '3', icon: 'RD' },
    { id: '4', title: 'ChatGPT', url: 'https://chatgpt.com', key: '4', icon: 'AI' },
    { id: '5', title: 'Gmail', url: 'https://mail.google.com', key: '5', icon: 'M' },
    { id: '6', title: 'Vercel', url: 'https://vercel.com', key: '6', icon: 'VC' },
    { id: '7', title: 'Figma', url: 'https://figma.com', key: '7', icon: 'FG' },
    { id: '8', title: 'X / Twitter', url: 'https://x.com', key: '8', icon: 'X' }
  ]
};

/* ── 1. ENTRANCE DIAGONAL WAVE LOADER ─────────────────────── */
(function initDiagonalWaveLoader() {
  const overlay = $('#loader-overlay');
  const canvas = $('#loader-wave-canvas');
  const welcome = $('#loader-welcome');
  if (!overlay || !canvas) return;

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const SPACING = 20;
  let cols = Math.ceil(width / SPACING) + 1;
  let rows = Math.ceil(height / SPACING) + 1;
  let maxDiag = cols + rows;

  let waveFront = 0;
  let retracting = false;
  let isLoaded = false;

  window.addEventListener('load', () => { isLoaded = true; });

  // Timeout fallback in case load event fires early
  setTimeout(() => { isLoaded = true; }, 500);

  function renderWave() {
    ctx.clearRect(0, 0, width, height);

    if (!retracting) {
      waveFront += 0.9;
      if (waveFront > maxDiag) {
        waveFront = maxDiag;
        if (isLoaded) {
          retracting = true;
        } else {
          waveFront = 0;
        }
      }
    } else {
      waveFront -= 1.2;
      const fadeProgress = waveFront / maxDiag;
      if (welcome) {
        welcome.style.opacity = Math.max(0, fadeProgress).toFixed(2);
      }

      if (waveFront <= 0) {
        overlay.classList.add('hidden');
        document.body.classList.remove('loading');
        return;
      }
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const diagPos = c + r;
        const distToFront = waveFront - diagPos;

        if (distToFront >= 0) {
          const radius = Math.min(6, Math.max(1, distToFront * 0.8));
          const opacity = Math.min(0.95, Math.max(0.15, 1 - distToFront * 0.05));
          ctx.beginPath();
          ctx.arc(c * SPACING, r * SPACING, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(17, 17, 17, ${opacity.toFixed(2)})`;
          ctx.fill();
        }
      }
    }

    requestAnimationFrame(renderWave);
  }

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    cols = Math.ceil(width / SPACING) + 1;
    rows = Math.ceil(height / SPACING) + 1;
    maxDiag = cols + rows;
  });

  renderWave();
})();

/* ── 2. HIGH-CONTRAST DOT MATRIX BACKGROUND ─────────────── */
let updateBgConfig = () => {};

(function initDotMatrixBg() {
  const canvas = $('#dot-matrix-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let SPACING = state.bgSpacing;
  const BASE_RADIUS = 1.3;
  const MAX_RADIUS = 5.0;
  const INFLUENCE_DIST = 160;

  let width = 0, height = 0, cols = 0, rows = 0;
  let dots = [];
  const mouse = { x: -1000, y: -1000 };

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    SPACING = state.bgSpacing;
    cols = Math.ceil(width / SPACING) + 1;
    rows = Math.ceil(height / SPACING) + 1;
    dots = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        dots.push({
          x: c * SPACING,
          y: r * SPACING,
          radius: BASE_RADIUS,
          phase: Math.random() * Math.PI * 2
        });
      }
    }
  }

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    // Telemetry update
    const coordsEl = $('#mouse-coords');
    if (coordsEl) {
      coordsEl.textContent = `X: ${String(e.clientX).padStart(3, '0')} | Y: ${String(e.clientY).padStart(3, '0')}`;
    }
  });

  let time = 0;

  function render() {
    ctx.clearRect(0, 0, width, height);
    time += 0.02;

    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const rgb = isDark ? '255, 255, 255' : '17, 17, 17';

    const baseAlpha = state.bgBaseOpacity;
    const hoverAlpha = state.bgHoverOpacity;

    for (let i = 0; i < dots.length; i++) {
      const dot = dots[i];
      const dx = mouse.x - dot.x;
      const dy = mouse.y - dot.y;
      const dist = Math.hypot(dx, dy);

      let targetR = BASE_RADIUS;
      let proximityFactor = 0;

      if (dist < INFLUENCE_DIST) {
        proximityFactor = 1 - dist / INFLUENCE_DIST;
        // Quadratic easing for high contrast expansion
        targetR = BASE_RADIUS + (MAX_RADIUS - BASE_RADIUS) * proximityFactor * proximityFactor;
      }
      
      // Ambient pulse wave
      targetR += Math.sin(dot.phase + time) * 0.2;

      // Smooth spring interpolation
      dot.radius += (targetR - dot.radius) * 0.15;

      // Calculate dynamic high-contrast opacity
      const opacity = baseAlpha + (hoverAlpha - baseAlpha) * (proximityFactor * proximityFactor);

      ctx.beginPath();
      ctx.arc(dot.x, dot.y, Math.max(0.6, dot.radius), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb}, ${opacity.toFixed(3)})`;
      ctx.fill();
    }

    requestAnimationFrame(render);
  }

  updateBgConfig = function() {
    SPACING = state.bgSpacing;
    resize();
    const indicator = $('#bg-contrast-indicator');
    if (indicator) {
      indicator.textContent = `CUSTOM (${state.bgBaseOpacity} / ${state.bgHoverOpacity})`;
    }
  };

  window.addEventListener('resize', resize);
  resize();
  render();
})();

/* ── 3. CLOCK & SEARCH ENGINE SYSTEM ─────────────────────── */
(function initClockAndSearch() {
  const clockEl = $('#clock-display');
  const periodEl = $('#clock-period');
  const dateEl = $('#date-display');
  const tzEl = $('#tz-display');
  const greetingEl = $('#greeting-text');

  function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    if (greetingEl) {
      if (hours < 12) greetingEl.textContent = 'GOOD MORNING // SYSTEM ONLINE';
      else if (hours < 18) greetingEl.textContent = 'GOOD AFTERNOON // SYSTEM ONLINE';
      else greetingEl.textContent = 'GOOD EVENING // SYSTEM ONLINE';
    }

    if (!state.clock24h) {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      if (periodEl) periodEl.textContent = ampm;
      if (clockEl) clockEl.textContent = `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`;
    } else {
      if (periodEl) periodEl.textContent = '24H';
      if (clockEl) clockEl.textContent = `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`;
    }

    // Update Date
    if (dateEl) {
      const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
      dateEl.textContent = now.toLocaleDateString('en-US', options).toUpperCase();
    }

    // Update Timezone
    if (tzEl) {
      const offset = -now.getTimezoneOffset();
      const sign = offset >= 0 ? '+' : '-';
      const padH = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
      const padM = String(Math.abs(offset) % 60).padStart(2, '0');
      tzEl.textContent = `UTC${sign}${padH}:${padM}`;
    }
  }

  setInterval(updateClock, 1000);
  updateClock();

  /* Search Engine Handling */
  const searchInput = $('#search-input');
  const searchBtn = $('#search-btn');
  const engineBadge = $('#search-engine-badge');
  const engineTags = $$('.engine-tag');

  const engineUrls = {
    google: 'https://www.google.com/search?q=',
    duckduckgo: 'https://duckduckgo.com/?q=',
    github: 'https://github.com/search?q=',
    youtube: 'https://www.youtube.com/results?search_query=',
    wikipedia: 'https://en.wikipedia.org/wiki/Special:Search?search='
  };

  const enginePrefixes = {
    'g:': 'google',
    'ddg:': 'duckduckgo',
    'gh:': 'github',
    'yt:': 'youtube',
    'w:': 'wikipedia'
  };

  function setEngine(engineKey) {
    if (!engineUrls[engineKey]) return;
    state.searchEngine = engineKey;
    engineTags.forEach(tag => {
      if (tag.dataset.engine === engineKey) {
        tag.classList.add('active');
        if (engineBadge) engineBadge.textContent = tag.dataset.prefix;
      } else {
        tag.classList.remove('active');
      }
    });
  }

  engineTags.forEach(tag => {
    tag.addEventListener('click', () => {
      setEngine(tag.dataset.engine);
      if (searchInput) searchInput.focus();
    });
  });

  function performSearch() {
    if (!searchInput) return;
    let query = searchInput.value.trim();
    if (!query) return;

    // Check prefix commands in text like "gh: react"
    for (const [prefix, engineKey] of Object.entries(enginePrefixes)) {
      if (query.toLowerCase().startsWith(prefix)) {
        setEngine(engineKey);
        query = query.substring(prefix.length).trim();
        break;
      }
    }

    // Direct URL check
    const isUrl = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/i.test(query);
    if (isUrl && !query.includes(' ')) {
      const url = query.startsWith('http') ? query : `https://${query}`;
      window.location.href = url;
      return;
    }

    const searchUrl = engineUrls[state.searchEngine] + encodeURIComponent(query);
    window.location.href = searchUrl;
  }

  if (searchBtn) searchBtn.addEventListener('click', performSearch);
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        performSearch();
      }
    });

    // Detect live prefix typing to highlight badge
    searchInput.addEventListener('input', () => {
      const text = searchInput.value.trim().toLowerCase();
      for (const [prefix, engineKey] of Object.entries(enginePrefixes)) {
        if (text.startsWith(prefix)) {
          setEngine(engineKey);
          break;
        }
      }
    });
  }

  // Global key listener for search focus '/' and hotkeys '1-9'
  window.addEventListener('keydown', (e) => {
    const isEditing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
    
    if (e.key === '/' && !isEditing) {
      e.preventDefault();
      if (searchInput) searchInput.focus();
    }

    if (!isEditing && e.key >= '1' && e.key <= '9') {
      const shortcut = state.shortcuts.find(s => s.key === e.key);
      if (shortcut) {
        e.preventDefault();
        window.location.href = shortcut.url;
      }
    }

    if (e.altKey && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      const settingsModal = $('#settings-modal');
      if (settingsModal) settingsModal.classList.toggle('open');
    }
  });
})();

/* ── 4. SHORTCUTS GRID MANAGER ────────────────────────────── */
(function initShortcuts() {
  const container = $('#shortcuts-grid');
  const addBtn = $('#add-shortcut-btn');
  const modal = $('#shortcut-modal');
  const closeBtn = $('#close-shortcut-modal');
  const cancelBtn = $('#cancel-shortcut-btn');
  const form = $('#shortcut-form');

  function renderShortcuts() {
    if (!container) return;
    container.innerHTML = '';

    state.shortcuts.forEach((item) => {
      const card = document.createElement('a');
      card.href = item.url;
      card.className = 'shortcut-card';
      
      card.innerHTML = `
        <div class="shortcut-top">
          <div class="shortcut-icon">${item.icon || item.title.substring(0, 2).toUpperCase()}</div>
          ${item.key ? `<span class="shortcut-key">[${item.key}]</span>` : ''}
        </div>
        <div class="shortcut-bottom">
          <div class="shortcut-title">${item.title}</div>
          <div class="shortcut-domain">${cleanDomain(item.url)}</div>
        </div>
        <button class="delete-shortcut-btn" data-id="${item.id}" title="Remove shortcut">&times;</button>
      `;

      // Handle delete click without triggering navigation
      const delBtn = card.querySelector('.delete-shortcut-btn');
      delBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        state.shortcuts = state.shortcuts.filter(s => s.id !== item.id);
        saveShortcuts();
        renderShortcuts();
      });

      container.appendChild(card);
    });
  }

  function cleanDomain(url) {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  }

  function saveShortcuts() {
    localStorage.setItem('oxy_shortcuts', JSON.stringify(state.shortcuts));
  }

  if (addBtn) addBtn.addEventListener('click', () => modal && modal.classList.add('open'));
  if (closeBtn) closeBtn.addEventListener('click', () => modal && modal.classList.remove('open'));
  if (cancelBtn) cancelBtn.addEventListener('click', () => modal && modal.classList.remove('open'));

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = $('#shortcut-name').value.trim();
      let url = $('#shortcut-url').value.trim();
      const key = $('#shortcut-key').value.trim();

      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      const newShortcut = {
        id: Date.now().toString(),
        title,
        url,
        key: key ? key.substring(0, 1) : '',
        icon: title.substring(0, 2).toUpperCase()
      };

      state.shortcuts.push(newShortcut);
      saveShortcuts();
      renderShortcuts();

      form.reset();
      modal.classList.remove('open');
    });
  }

  renderShortcuts();
})();

/* ── 5. SCRATCHPAD WIDGET ─────────────────────────────────── */
(function initScratchpad() {
  const textarea = $('#scratchpad-input');
  const countEl = $('#scratch-count');
  const clearBtn = $('#clear-scratch-btn');

  if (!textarea) return;

  // Load saved content
  const saved = localStorage.getItem('oxy_scratchpad') || '';
  textarea.value = saved;
  updateCount();

  textarea.addEventListener('input', () => {
    localStorage.setItem('oxy_scratchpad', textarea.value);
    updateCount();
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      textarea.value = '';
      localStorage.removeItem('oxy_scratchpad');
      updateCount();
    });
  }

  function updateCount() {
    if (countEl) {
      countEl.textContent = `${textarea.value.length} chars`;
    }
  }
})();

/* ── 6. POMODORO / FOCUS TIMER WIDGET ─────────────────────── */
(function initFocusTimer() {
  const display = $('#timer-display');
  const statusEl = $('#timer-status');
  const progressFill = $('#timer-progress-fill');
  const startBtn = $('#timer-start-btn');
  const resetBtn = $('#timer-reset-btn');
  const presetBtns = $$('.timer-preset-btn');

  let totalTime = 1500; // 25 min default
  let remainingTime = 1500;
  let timerId = null;
  let isRunning = false;

  function updateDisplay() {
    const mins = Math.floor(remainingTime / 60);
    const secs = remainingTime % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    
    if (display) display.textContent = timeStr;
    if (progressFill) {
      const pct = (remainingTime / totalTime) * 100;
      progressFill.style.width = `${pct}%`;
    }

    if (isRunning) {
      document.title = `(${timeStr}) Focus // Oxygenated`;
    } else {
      document.title = `New Tab // Oxygenated`;
    }
  }

  function startTimer() {
    if (isRunning) {
      clearInterval(timerId);
      isRunning = false;
      if (startBtn) startBtn.textContent = 'RESUME';
      if (statusEl) statusEl.textContent = 'PAUSED';
      return;
    }

    isRunning = true;
    if (startBtn) startBtn.textContent = 'PAUSE';
    if (statusEl) statusEl.textContent = 'RUNNING';

    timerId = setInterval(() => {
      remainingTime--;
      updateDisplay();

      if (remainingTime <= 0) {
        clearInterval(timerId);
        isRunning = false;
        if (startBtn) startBtn.textContent = 'START';
        if (statusEl) statusEl.textContent = 'FINISHED!';
        alert('⏱️ Focus Timer Session Finished!');
      }
    }, 1000);
  }

  function resetTimer() {
    clearInterval(timerId);
    isRunning = false;
    remainingTime = totalTime;
    if (startBtn) startBtn.textContent = 'START';
    if (statusEl) statusEl.textContent = 'READY';
    updateDisplay();
  }

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      totalTime = parseInt(btn.dataset.time, 10);
      resetTimer();
    });
  });

  if (startBtn) startBtn.addEventListener('click', startTimer);
  if (resetBtn) resetBtn.addEventListener('click', resetTimer);

  updateDisplay();
})();

/* ── 7. 3D INTERACTIVE CAD WIREFRAME VIEWPORT ─────────────── */
(function init3DCAD() {
  const canvas = $('#cad-3d-canvas');
  const coordsEl = $('#cad-coords');
  const modeBtn = $('#cad-mode-btn');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  let mode = 'icosahedron'; // icosahedron, heart, cube
  let vertices = [];

  function generateGeometry() {
    vertices = [];
    if (mode === 'icosahedron') {
      const phi = (1 + Math.sqrt(5)) / 2;
      const raw = [
        [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
        [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
        [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
      ];
      // Scale and add sub-points along edges for dense dot CAD look
      raw.forEach(v => {
        vertices.push({ x: v[0] * 32, y: v[1] * 32, z: v[2] * 32 });
      });
      // Interpolate points between vertices for wireframe dot effect
      for (let i = 0; i < raw.length; i++) {
        for (let j = i + 1; j < raw.length; j++) {
          const dist = Math.hypot(raw[i][0]-raw[j][0], raw[i][1]-raw[j][1], raw[i][2]-raw[j][2]);
          if (dist < 2.3) {
            for (let t = 0.2; t < 1; t += 0.2) {
              vertices.push({
                x: (raw[i][0] + (raw[j][0] - raw[i][0]) * t) * 32,
                y: (raw[i][1] + (raw[j][1] - raw[i][1]) * t) * 32,
                z: (raw[i][2] + (raw[j][2] - raw[i][2]) * t) * 32
              });
            }
          }
        }
      }
    } else if (mode === 'heart') {
      const thicknesses = [-12, 0, 12];
      thicknesses.forEach(zOffset => {
        for (let angle = 0; angle < Math.PI * 2; angle += 0.15) {
          const x = 16 * Math.pow(Math.sin(angle), 3);
          const y = -(13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle));
          vertices.push({ x: x * 3.8, y: y * 3.8, z: zOffset });
        }
      });
    } else { // Cube
      for (let x = -1; x <= 1; x += 0.5) {
        for (let y = -1; y <= 1; y += 0.5) {
          for (let z = -1; z <= 1; z += 0.5) {
            if (Math.abs(x) === 1 || Math.abs(y) === 1 || Math.abs(z) === 1) {
              vertices.push({ x: x * 40, y: y * 40, z: z * 40 });
            }
          }
        }
      }
    }
  }

  generateGeometry();

  if (modeBtn) {
    modeBtn.addEventListener('click', () => {
      if (mode === 'icosahedron') mode = 'heart';
      else if (mode === 'heart') mode = 'cube';
      else mode = 'icosahedron';
      modeBtn.textContent = `MODE: ${mode.toUpperCase()}`;
      generateGeometry();
    });
  }

  let rotX = 0.2;
  let rotY = 0.4;
  let targetRotX = 0.2;
  let targetRotY = 0.4;
  let isDragging = false;
  let lastX = 0, lastY = 0;

  const viewport = canvas.parentElement;
  viewport.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    targetRotY += dx * 0.01;
    targetRotX += dy * 0.01;
    lastX = e.clientX;
    lastY = e.clientY;
  });

  window.addEventListener('mouseup', () => { isDragging = false; });

  function render3D() {
    if (!isDragging) {
      targetRotY += 0.008;
    }

    rotX += (targetRotX - rotX) * 0.1;
    rotY += (targetRotY - rotY) * 0.1;

    if (coordsEl) {
      coordsEl.textContent = `X: ${rotX.toFixed(2)} Y: ${rotY.toFixed(2)}`;
    }

    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const fov = 240;

    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);

    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const rgb = isDark ? '255, 255, 255' : '17, 17, 17';

    for (let i = 0; i < vertices.length; i++) {
      const v = vertices[i];
      let x1 = v.x * cosY - v.z * sinY;
      let z1 = v.x * sinY + v.z * cosY;
      let y2 = v.y * cosX - z1 * sinX;
      let z2 = v.y * sinX + z1 * cosX;

      const scale = fov / (fov + z2 + 180);
      const px = cx + x1 * scale;
      const py = cy + y2 * scale;

      const radius = Math.max(1, 2.2 * scale);
      const alpha = Math.min(0.9, Math.max(0.2, (scale - 0.4) * 1.8));

      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb}, ${alpha.toFixed(2)})`;
      ctx.fill();
    }

    requestAnimationFrame(render3D);
  }

  render3D();
})();

/* ── 8. SETTINGS & THEME TOGGLE ───────────────────────────── */
(function initSettings() {
  const toggleBtn = $('#settings-toggle-btn');
  const modal = $('#settings-modal');
  const closeBtn = $('#close-settings-modal');
  const confirmBtn = $('#close-settings-confirm');
  const contrastBtns = $$('.set-contrast-btn');
  const spacingBtns = $$('.set-spacing-btn');
  const btn24h = $('#clock-24h-btn');
  const btn12h = $('#clock-12h-btn');
  const btnLight = $('#theme-light-btn');
  const btnDark = $('#theme-dark-btn');
  const resetShortcutsBtn = $('#reset-shortcuts-btn');

  // Apply initial theme
  if (state.theme === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
    if (btnDark) btnDark.classList.add('active');
    if (btnLight) btnLight.classList.remove('active');
  }

  if (toggleBtn) toggleBtn.addEventListener('click', () => modal && modal.classList.add('open'));
  if (closeBtn) closeBtn.addEventListener('click', () => modal && modal.classList.remove('open'));
  if (confirmBtn) confirmBtn.addEventListener('click', () => modal && modal.classList.remove('open'));

  contrastBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      contrastBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.bgBaseOpacity = parseFloat(btn.dataset.base);
      state.bgHoverOpacity = parseFloat(btn.dataset.hover);
      localStorage.setItem('oxy_bg_base', state.bgBaseOpacity);
      localStorage.setItem('oxy_bg_hover', state.bgHoverOpacity);
      updateBgConfig();
    });
  });

  spacingBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      spacingBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.bgSpacing = parseInt(btn.dataset.spacing, 10);
      localStorage.setItem('oxy_bg_spacing', state.bgSpacing);
      updateBgConfig();
    });
  });

  if (btn24h && btn12h) {
    btn24h.addEventListener('click', () => {
      state.clock24h = true;
      localStorage.setItem('oxy_clock_24h', 'true');
      btn24h.classList.add('active');
      btn12h.classList.remove('active');
    });

    btn12h.addEventListener('click', () => {
      state.clock24h = false;
      localStorage.setItem('oxy_clock_24h', 'false');
      btn12h.classList.add('active');
      btn24h.classList.remove('active');
    });
  }

  if (btnLight && btnDark) {
    btnLight.addEventListener('click', () => {
      document.body.removeAttribute('data-theme');
      state.theme = 'light';
      localStorage.setItem('oxy_theme', 'light');
      btnLight.classList.add('active');
      btnDark.classList.remove('active');
    });

    btnDark.addEventListener('click', () => {
      document.body.setAttribute('data-theme', 'dark');
      state.theme = 'dark';
      localStorage.setItem('oxy_theme', 'dark');
      btnDark.classList.add('active');
      btnLight.classList.remove('active');
    });
  }

  if (resetShortcutsBtn) {
    resetShortcutsBtn.addEventListener('click', () => {
      if (confirm('Reset shortcuts to default presets?')) {
        localStorage.removeItem('oxy_shortcuts');
        location.reload();
      }
    });
  }

  // Telemetry updates
  const netStatusEl = $('#net-status');
  const browserInfoEl = $('#browser-info');
  const screenResEl = $('#screen-res');

  if (screenResEl) {
    screenResEl.textContent = `${window.innerWidth} x ${window.innerHeight}`;
    window.addEventListener('resize', () => {
      screenResEl.textContent = `${window.innerWidth} x ${window.innerHeight}`;
    });
  }

  if (browserInfoEl) {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) browserInfoEl.textContent = 'FIREFOX ENGINE';
    else if (ua.includes('Edg')) browserInfoEl.textContent = 'EDGE CHROMIUM';
    else if (ua.includes('Chrome')) browserInfoEl.textContent = 'GOOGLE CHROMIUM';
    else if (ua.includes('Safari')) browserInfoEl.textContent = 'APPLE WEBKIT';
    else browserInfoEl.textContent = 'GENERIC ENGINE';
  }

  if (netStatusEl) {
    const updateNet = () => {
      netStatusEl.textContent = navigator.onLine ? 'ONLINE (STABLE)' : 'OFFLINE';
      netStatusEl.className = `t-val ${navigator.onLine ? 'highlight-val' : ''}`;
    };
    window.addEventListener('online', updateNet);
    window.addEventListener('offline', updateNet);
    updateNet();
  }
})();
