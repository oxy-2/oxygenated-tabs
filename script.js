/* OXYGENATED NEW TAB // HIGH-CONTRAST MATRIX ENGINE */
'use strict';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* theme lives on <html> so the loader matches before first paint */
const applyTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
};

/* App State */
const state = {
  theme: localStorage.getItem('oxy_theme') || 'light',
  clock24h: localStorage.getItem('oxy_clock_24h') !== 'false',
  searchEngine: 'google', // google, duckduckgo, github, youtube
  bgBaseOpacity: parseFloat(localStorage.getItem('oxy_bg_base')) || 0.22,
  bgHoverOpacity: parseFloat(localStorage.getItem('oxy_bg_hover')) || 0.85,
  bgSpacing: parseInt(localStorage.getItem('oxy_bg_spacing')) || 24,
  shortcuts: JSON.parse(localStorage.getItem('oxy_shortcuts')) || [
    { id: '1', title: 'github', url: 'https://github.com', key: '1', icon: 'gh' },
    { id: '2', title: 'youtube', url: 'https://youtube.com', key: '2', icon: 'yt' },
    { id: '3', title: 'reddit', url: 'https://reddit.com', key: '3', icon: 'rd' },
    { id: '4', title: 'chatgpt', url: 'https://chatgpt.com', key: '4', icon: 'ai' },
    { id: '5', title: 'gmail', url: 'https://mail.google.com', key: '5', icon: 'gm' },
    { id: '6', title: 'vercel', url: 'https://vercel.com', key: '6', icon: 'vc' },
    { id: '7', title: 'figma', url: 'https://figma.com', key: '7', icon: 'fg' },
    { id: '8', title: 'x', url: 'https://x.com', key: '8', icon: 'x' }
  ]
};

applyTheme(state.theme);

/* ── 1. LOADER: diagonal dot wave sweeps down, then fades out (no retract) ── */
(function initLoader() {
  const overlay = $('#loader-overlay');
  const canvas = $('#loader-wave-canvas');
  if (!overlay || !canvas) return;

  const ctx = canvas.getContext('2d');
  const SPACING = 20;

  let width = 0, height = 0, cols = 0, rows = 0, maxDiag = 0;
  let waveFront = 0;
  let isLoaded = false;
  let fading = false;

  function size() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    cols = Math.ceil(width / SPACING) + 1;
    rows = Math.ceil(height / SPACING) + 1;
    maxDiag = cols + rows;
  }
  size();

  // page counts as loaded once assets are in (or shortly after)
  window.addEventListener('load', () => { isLoaded = true; });
  setTimeout(() => { isLoaded = true; }, 600);

  const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';

  function render() {
    // stop drawing once the loader is fully hidden
    if (overlay.classList.contains('hidden')) return;

    ctx.clearRect(0, 0, width, height);

    // the wave only goes down; once it reaches the end it fades away
    if (!fading) {
      waveFront += 1.6;
      if (waveFront >= maxDiag) {
        waveFront = maxDiag;
        if (isLoaded) {
          fading = true;
          overlay.classList.add('fading'); // fades grid + welcome dot together
          setTimeout(() => {
            overlay.classList.add('hidden');
            document.body.classList.remove('loading'); // reveal the page
          }, 700); // matches the css fade duration
        }
      }
    }

    // fill in the grid of dots behind the wave front
    const rgb = isDark() ? '255, 255, 255' : '17, 17, 17';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const distToFront = waveFront - (c + r);
        if (distToFront >= 0) {
          const radius = Math.min(6, Math.max(1, distToFront * 0.8));
          const opacity = Math.min(0.95, Math.max(0.15, 1 - distToFront * 0.05));
          ctx.beginPath();
          ctx.arc(c * SPACING, r * SPACING, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgb}, ${opacity.toFixed(2)})`;
          ctx.fill();
        }
      }
    }

    requestAnimationFrame(render);
  }

  window.addEventListener('resize', size);
  render();
})();

/* ── 2. DOT MATRIX BACKGROUND (reacts to mouse) ─────────────── */
let updateBgConfig = () => {};

(function initDotMatrix() {
  const canvas = $('#dot-matrix-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const BASE_RADIUS = 1.3;
  const MAX_RADIUS = 5.0;
  const INFLUENCE_DIST = 160;

  let width = 0, height = 0, cols = 0, rows = 0;
  let dots = [];
  const mouse = { x: -1000, y: -1000 };

  const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    cols = Math.ceil(width / state.bgSpacing) + 1;
    rows = Math.ceil(height / state.bgSpacing) + 1;
    dots = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        dots.push({
          x: c * state.bgSpacing,
          y: r * state.bgSpacing,
          radius: BASE_RADIUS,
          phase: Math.random() * Math.PI * 2
        });
      }
    }
  }

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  let time = 0;

  function render() {
    ctx.clearRect(0, 0, width, height);
    time += 0.02;

    const rgb = isDark() ? '255, 255, 255' : '17, 17, 17';

    for (let i = 0; i < dots.length; i++) {
      const dot = dots[i];
      const dx = mouse.x - dot.x;
      const dy = mouse.y - dot.y;
      const dist = Math.hypot(dx, dy);

      let targetR = BASE_RADIUS;
      let proximityFactor = 0;

      if (dist < INFLUENCE_DIST) {
        proximityFactor = 1 - dist / INFLUENCE_DIST;
        // quadratic easing for a crisp expansion
        targetR = BASE_RADIUS + (MAX_RADIUS - BASE_RADIUS) * proximityFactor * proximityFactor;
      }

      // soft ambient pulse so the grid stays alive
      targetR += Math.sin(dot.phase + time) * 0.2;
      dot.radius += (targetR - dot.radius) * 0.15;

      const opacity = state.bgBaseOpacity + (state.bgHoverOpacity - state.bgBaseOpacity) * (proximityFactor * proximityFactor);

      ctx.beginPath();
      ctx.arc(dot.x, dot.y, Math.max(0.6, dot.radius), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb}, ${opacity.toFixed(3)})`;
      ctx.fill();
    }

    requestAnimationFrame(render);
  }

  // called when contrast/spacing changes in settings
  updateBgConfig = () => resize();

  window.addEventListener('resize', resize);
  resize();
  render();
})();

/* ── 3. CLOCK (with timezone + 12/24h) & SEARCH ────────────── */
(function initClockAndSearch() {
  const clockEl = $('#clock-display');
  const periodEl = $('#clock-period');
  const dateEl = $('#date-display');
  const tzEl = $('#tz-display');

  function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    if (state.clock24h) {
      if (periodEl) periodEl.textContent = '';
      if (clockEl) clockEl.textContent = `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`;
    } else {
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12 || 12;
      if (periodEl) periodEl.textContent = ampm;
      if (clockEl) clockEl.textContent = `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`;
    }

    if (dateEl) {
      const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
      dateEl.textContent = now.toLocaleDateString('en-US', options).toLowerCase();
    }

    if (tzEl) {
      const offset = -now.getTimezoneOffset();
      const sign = offset >= 0 ? '+' : '-';
      const padH = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
      const padM = String(Math.abs(offset) % 60).padStart(2, '0');
      tzEl.textContent = `utc${sign}${padH}:${padM}`;
    }
  }

  setInterval(updateClock, 1000);
  updateClock();

  /* search */
  const searchInput = $('#search-input');
  const searchBtn = $('#search-btn');
  const engineBadge = $('#search-badge');
  const engineTags = $$('.engine-tag');

  const engineUrls = {
    google: 'https://www.google.com/search?q=',
    duckduckgo: 'https://duckduckgo.com/?q=',
    github: 'https://github.com/search?q=',
    youtube: 'https://www.youtube.com/results?search_query='
  };

  const enginePrefixes = {
    'g:': 'google',
    'ddg:': 'duckduckgo',
    'gh:': 'github',
    'yt:': 'youtube'
  };

  function setEngine(engineKey) {
    if (!engineUrls[engineKey]) return;
    state.searchEngine = engineKey;
    engineTags.forEach(tag => {
      if (tag.dataset.engine === engineKey) {
        tag.classList.add('active');
        if (engineBadge) engineBadge.textContent = tag.dataset.prefix || '';
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

    // prefix command like "gh: react"
    for (const [prefix, engineKey] of Object.entries(enginePrefixes)) {
      if (query.toLowerCase().startsWith(prefix)) {
        setEngine(engineKey);
        query = query.substring(prefix.length).trim();
        break;
      }
    }

    // direct url
    const isUrl = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/i.test(query);
    if (isUrl && !query.includes(' ')) {
      const url = query.startsWith('http') ? query : `https://${query}`;
      window.location.href = url;
      return;
    }

    window.location.href = engineUrls[state.searchEngine] + encodeURIComponent(query);
  }

  if (searchBtn) searchBtn.addEventListener('click', performSearch);
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        performSearch();
      }
    });

    // live prefix typing highlights the right engine
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

  // '/' focuses search, 1-9 opens shortcuts, alt+s toggles settings
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
      toggleSettings();
    }
  });
})();

/* ── 4. SHORTCUTS GRID ─────────────────────────────────────── */
(function initShortcuts() {
  const container = $('#shortcuts-grid');
  const addBtn = $('#add-shortcut-btn');
  const modal = $('#shortcut-modal');
  const closeBtn = $('#close-shortcut-modal');
  const cancelBtn = $('#cancel-shortcut-btn');
  const form = $('#shortcut-form');

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

  function renderShortcuts() {
    if (!container) return;
    container.innerHTML = '';

    state.shortcuts.forEach((item) => {
      const card = document.createElement('a');
      card.href = item.url;
      card.className = 'shortcut-card';

      // icon top-left, info bottom-left, key badge bottom-right, delete top-right
      card.innerHTML = `
        <div class="shortcut-icon">${item.icon || item.title.substring(0, 2).toLowerCase()}</div>
        <div class="shortcut-bottom">
          <div class="shortcut-title">${item.title}</div>
          <div class="shortcut-domain">${cleanDomain(item.url)}</div>
        </div>
        ${item.key ? `<span class="shortcut-key">${item.key}</span>` : ''}
        <button class="shortcut-del" data-id="${item.id}" title="remove shortcut">&times;</button>
      `;

      // delete without triggering navigation
      const delBtn = card.querySelector('.shortcut-del');
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

  function openModal() { if (modal) modal.classList.add('open'); }
  function closeModal() { if (modal) modal.classList.remove('open'); }

  if (addBtn) addBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  // click outside or press escape to close
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = $('#shortcut-name').value.trim();
      let url = $('#shortcut-url').value.trim();
      const key = $('#shortcut-key').value.trim();

      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      state.shortcuts.push({
        id: Date.now().toString(),
        title,
        url,
        key: key ? key.substring(0, 1) : '',
        icon: title.substring(0, 2).toLowerCase()
      });
      saveShortcuts();
      renderShortcuts();

      form.reset();
      closeModal();
    });
  }

  renderShortcuts();
})();

/* ── 5. SCRATCHPAD (saves automatically) ────────────────────── */
(function initScratchpad() {
  const textarea = $('#scratchpad');
  const countEl = $('#scratch-count');
  const clearBtn = $('#clear-scratch-btn');
  if (!textarea) return;

  textarea.value = localStorage.getItem('oxy_scratchpad') || '';
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
    if (countEl) countEl.textContent = textarea.value.length;
  }
})();

/* ── 6. 3D INTERACTIVE WIREFRAME VIEWPORT ───────────────────── */
(function init3DCAD() {
  const canvas = $('#cad-3d-canvas');
  const coordsEl = $('#cad-coords');
  const modeBtn = $('#cad-mode-btn');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  let mode = 'icosahedron';
  let vertices = [];

  const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';

  function generateGeometry() {
    vertices = [];
    if (mode === 'icosahedron') {
      const phi = (1 + Math.sqrt(5)) / 2;
      const raw = [
        [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
        [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
        [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
      ];
      raw.forEach(v => {
        vertices.push({ x: v[0] * 32, y: v[1] * 32, z: v[2] * 32 });
      });
      // dots along edges for a wireframe feel
      for (let i = 0; i < raw.length; i++) {
        for (let j = i + 1; j < raw.length; j++) {
          const dist = Math.hypot(raw[i][0] - raw[j][0], raw[i][1] - raw[j][1], raw[i][2] - raw[j][2]);
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
    } else { // cube
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
      modeBtn.textContent = mode;
      generateGeometry();
    });
  }

  let rotX = 0.2, rotY = 0.4;
  let targetRotX = 0.2, targetRotY = 0.4;
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
    targetRotY += (e.clientX - lastX) * 0.01;
    targetRotX += (e.clientY - lastY) * 0.01;
    lastX = e.clientX;
    lastY = e.clientY;
  });

  window.addEventListener('mouseup', () => { isDragging = false; });

  function render3D() {
    if (!isDragging) targetRotY += 0.008;

    rotX += (targetRotX - rotX) * 0.1;
    rotY += (targetRotY - rotY) * 0.1;

    if (coordsEl) coordsEl.textContent = `x: ${rotX.toFixed(2)} y: ${rotY.toFixed(2)}`;

    ctx.clearRect(0, 0, w, h);

    const cx = w / 2, cy = h / 2, fov = 240;
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
    const rgb = isDark() ? '255, 255, 255' : '17, 17, 17';

    for (let i = 0; i < vertices.length; i++) {
      const v = vertices[i];
      const x1 = v.x * cosY - v.z * sinY;
      const z1 = v.x * sinY + v.z * cosY;
      const y2 = v.y * cosX - z1 * sinX;
      const z2 = v.y * sinX + z1 * cosX;

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

/* ── 7. SETTINGS DRAWER ────────────────────────────────────── */
let toggleSettings = () => {};

(function initSettings() {
  const toggleBtn = $('#settings-toggle');
  const drawer = $('#settings-drawer');
  const bg = $('#drawer-bg');
  const closeBtn = $('#close-drawer');
  const contrastOpts = $$('#contrast-opts .opt');
  const spacingOpts = $$('#spacing-opts .opt');
  const btn24h = $('#btn-24h');
  const btn12h = $('#btn-12h');
  const btnLight = $('#btn-light');
  const btnDark = $('#btn-dark');
  const resetShortcutsBtn = $('#reset-shortcuts-btn');

  // reflect saved choices on the selected option buttons
  contrastOpts.forEach(o => {
    o.classList.toggle('active', parseFloat(o.dataset.base) === state.bgBaseOpacity);
  });
  spacingOpts.forEach(o => {
    o.classList.toggle('active', parseInt(o.dataset.spacing, 10) === state.bgSpacing);
  });
  if (btn24h) btn24h.classList.toggle('active', state.clock24h);
  if (btn12h) btn12h.classList.toggle('active', !state.clock24h);
  if (btnLight) btnLight.classList.toggle('active', state.theme !== 'dark');
  if (btnDark) btnDark.classList.toggle('active', state.theme === 'dark');

  // open / close the drawer
  toggleSettings = () => {
    if (!drawer) return;
    const open = drawer.classList.toggle('open');
    if (bg) bg.classList.toggle('open', open);
  };

  if (toggleBtn) toggleBtn.addEventListener('click', toggleSettings);
  if (closeBtn) closeBtn.addEventListener('click', toggleSettings);
  if (bg) {
    bg.addEventListener('click', () => {
      if (drawer && drawer.classList.contains('open')) toggleSettings();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer && drawer.classList.contains('open')) toggleSettings();
  });

  // dot contrast
  contrastOpts.forEach(btn => {
    btn.addEventListener('click', () => {
      state.bgBaseOpacity = parseFloat(btn.dataset.base);
      state.bgHoverOpacity = parseFloat(btn.dataset.hover);
      localStorage.setItem('oxy_bg_base', state.bgBaseOpacity);
      localStorage.setItem('oxy_bg_hover', state.bgHoverOpacity);
      contrastOpts.forEach(o => o.classList.toggle('active', o === btn));
      updateBgConfig();
    });
  });

  // dot spacing
  spacingOpts.forEach(btn => {
    btn.addEventListener('click', () => {
      state.bgSpacing = parseInt(btn.dataset.spacing, 10);
      localStorage.setItem('oxy_bg_spacing', state.bgSpacing);
      spacingOpts.forEach(o => o.classList.toggle('active', o === btn));
      updateBgConfig();
    });
  });

  // clock format
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

  // theme
  if (btnLight && btnDark) {
    btnLight.addEventListener('click', () => {
      state.theme = 'light';
      localStorage.setItem('oxy_theme', 'light');
      applyTheme('light');
      btnLight.classList.add('active');
      btnDark.classList.remove('active');
    });
    btnDark.addEventListener('click', () => {
      state.theme = 'dark';
      localStorage.setItem('oxy_theme', 'dark');
      applyTheme('dark');
      btnDark.classList.add('active');
      btnLight.classList.remove('active');
    });
  }

  // reset shortcuts
  if (resetShortcutsBtn) {
    resetShortcutsBtn.addEventListener('click', () => {
      if (confirm('reset shortcuts to default?')) {
        localStorage.removeItem('oxy_shortcuts');
        location.reload();
      }
    });
  }
})();
