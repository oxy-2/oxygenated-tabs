/* ╔══════════════════════════════════════════════════════════════════════╗
   ║                                                                      ║
   ║     ██                  ██                  ██                       ║ 
   ║     ██                  ██                  ██                       ║
   ║     ██████     ███ █    ██████     ███ █    ██████     ███ █         ║
   ║     ██   ██  ██  ███    ██   ██  ██  ███    ██   ██  ██  ███         ║
   ║     ██   ██    ███ █    ██   ██    ███ █    ██   ██    ███ █         ║
   ║                                                                      ║
   ║      "laughs very evily"                                             ║
   ║       -oxy                                                           ║
   ╚══════════════════════════════════════════════════════════════════════╝ */

'use strict';

// little helper goobs to fetch things

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// themes

const applyTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
};

// big local state save guy to save all the stuff the user set

const state = {
  theme: localStorage.getItem('oxy_theme') || 'light',
  clock24h: localStorage.getItem('oxy_clock_24h') !== 'false',
  showSeconds: localStorage.getItem('oxy_show_seconds') !== 'false',
  searchEngine: localStorage.getItem('oxy_engine') || 'google', // google, wikipedia, duckduckgo, github, youtube
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

// entrace welcome and wave loader thingy (note to self use this for my future sites its way better)

(function initLoader() {
  const overlay = $('#loader-overlay');
  const canvas = $('#loader-wave-canvas');
  if (!overlay || !canvas) return;

  // ctx is used to like paint or like make everything on the site ctx.arc(), ctx.fill(), etc
  const ctx = canvas.getContext('2d');
  const SPACING = 20;

  let width = 0, height = 0, cols = 0, rows = 0, maxDiag = 0;
  let waveFront = 0;
  let isLoaded = false;
  let fading = false;

  // measures on every window and resizes so the grid always fills the screen
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

  // isDark() asks the <html> tag which theme is active, the canvas cant use css vars afaik so it asks each frame
  const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';

  function render() {
    // stop drawing once the loader is fully hidden
    if (overlay.classList.contains('hidden')) return;

    ctx.clearRect(0, 0, width, height);

    // wave only moves one way, its diff from my personal site but i will update my personal site to be the same as this cuz its so much cleaner tho
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

    // draw tailing dots, deeper dots grow larger and more opaque for sweep effect
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

    // requestAnimationFrame is what actually animates and does frames for everything it should be 60fps but changes if u have battery saver, a high refresh rate monitor etc
    requestAnimationFrame(render);
  }

  window.addEventListener('resize', size);
  render();
})();

// my beloved dot matrix background, its one of my favorite like design thingies, for my school project i really wanna do it but like with like
// with frosted glass ontop kidna look and then crisp full cards hovering above, gosh that will be so pretty


let updateBgConfig = () => { };

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

  // build a flat list of all the dots once, then only redraw them, each dot stores its position + a random `phase` used to make the ambient pulse
  // feel organic instead of lock step
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
        // proximityFactor goes 1 (on your cursor) down to 0 (at the edge), squaring it (x*x) makes the falloff feel curved, not linear
        proximityFactor = 1 - dist / INFLUENCE_DIST;
        // quadratic easing for a crisp expansion (im feeling pretty square today, like in a good way yk)
        targetR = BASE_RADIUS + (MAX_RADIUS - BASE_RADIUS) * proximityFactor * proximityFactor;
      }

      // soft ambient pulse so the grid stays alive
      targetR += Math.sin(dot.phase + time) * 0.2;
      dot.radius += (targetR - dot.radius) * 0.15;

      //dot.radius += (target - current) * 0.15, this is called larping get it like linear interpolation, yeah mb
      //anyways so instead of jumping to the target size, the dot moves like 15% (or 3/20ths for you fraction freaks)
      // of the way each frame, which makes the motion smooth, opacity blends between the base setting and the hover setting
      const opacity = state.bgBaseOpacity + (state.bgHoverOpacity - state.bgBaseOpacity) * (proximityFactor * proximityFactor);

      ctx.beginPath();
      ctx.arc(dot.x, dot.y, Math.max(0.6, dot.radius), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb}, ${opacity.toFixed(3)})`;
      ctx.fill();
    }

    requestAnimationFrame(render);
  }

  // gets called for contrast and spacing changes in settings menu
  updateBgConfig = () => resize();

  window.addEventListener('resize', resize);
  resize();
  render();
})();

// clock + search and uh utc offset and allat jazz, im actually listening to every breath u take, pretty sure thats jazz

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
      if (clockEl) clockEl.textContent = formatTime(hours, minutes);
    } else {
      // 12 hour mode, its just time % 12, but 0%12=0, midnight is supposed to be 12 so we add || 12 as a fix
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12 || 12;
      if (periodEl) periodEl.textContent = ampm;
      if (clockEl) clockEl.textContent = formatTime(hours, minutes);
    }

    function formatTime(h, m) {
      return state.showSeconds
        ? `${String(h).padStart(2, '0')}:${m}:${seconds}`
        : `${String(h).padStart(2, '0')}:${m}`;
    }

    if (dateEl) {
      const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
      dateEl.textContent = now.toLocaleDateString('en-US', options).toLowerCase();
    }

    // utc offset math is getTimezoneOffset() but it returns mins, but in the opposite sign so -now.getTimezoneOffset() flips it, then we split into hours + minutes so like utc+05:30 reads naturally
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

  // search bar for searching things

  const searchInput = $('#search-input');
  const searchBtn = $('#search-btn');
  const engineBadge = $('#search-badge');
  const engineTags = $$('.engine-tag');

  const engineUrls = {
    google: 'https://www.google.com/search?q=',
    wikipedia: 'https://en.wikipedia.org/wiki/Special:Search?search=',
    duckduckgo: 'https://duckduckgo.com/?q=',
    github: 'https://github.com/search?q=',
    youtube: 'https://www.youtube.com/results?search_query='

  };

  const enginePrefixes = {
    'ggl:': 'google',
    'wki:': 'wikipedia',
    'ddg:': 'duckduckgo',
    'gth:': 'github',
    'ytb:': 'youtube'
  };

  // setEngine(engineKey) highlights the matching tag button + swaps the little badge text at the left of the search box so things all match up
  function setEngine(engineKey) {
    if (!engineUrls[engineKey]) return;
    state.searchEngine = engineKey;
    localStorage.setItem('oxy_engine', engineKey); // remember the pick across reloads
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

  setEngine(state.searchEngine); // reflect the saved engine on load

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

  // keyboard shortcuts like 1-9 to open shortcuts, i might remove this cuz a first was tryna type in scratch pad and like couldnt put numbers without getting sent to narnia
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



   // shortcut cards

   // rendershortcuts wipes the grid n rebuilds one card for every shortcut stored in state.shortcuts
   // render shortcuts creates an <a> tag, which navigates by default
   // del btn calls preventdefault to stop navigation
   // new shortcuts are added via modal form in index.html
   // everything is saved with localStorage so grid survives reloads

(function initShortcuts() {
  const container = $('#shortcuts-grid');
  const addBtn = $('#add-shortcut-btn');
  const modal = $('#shortcut-modal');
  const closeBtn = $('#close-shortcut-modal');
  const cancelBtn = $('#cancel-shortcut-btn');
  const form = $('#shortcut-form');

  // new URL(url) is the browser's built-in URL parser, used it to pull out just the hostname so the card can show github.com under the title instead of a long ahh url. 
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

      // icon top left, info bottom left, key badge bottom right, delete top right
      card.innerHTML = `
        <div class="shortcut-icon">${item.icon || item.title.substring(0, 2).toLowerCase()}</div>
        <div class="shortcut-bottom">
          <div class="shortcut-title">${item.title}</div>
          <div class="shortcut-domain">${cleanDomain(item.url)}</div>
        </div>
        ${item.key ? `<span class="shortcut-key">${item.key}</span>` : ''}
        <button class="shortcut-del" data-id="${item.id}" title="remove shortcut">&times;</button>
      `;

      // remake card on state change re render
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

  // listening to 'click' on the background, if the click directly hit the overlay (not a child), close the modal like click outside to dismiss
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
      e.preventDefault(); // stop page refresh
      const title = $('#shortcut-name').value.trim();
      let url = $('#shortcut-url').value.trim();
      const key = $('#shortcut-key').value.trim();

      // adds https cuz like i know no one actually writes out links with http lmao
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      state.shortcuts.push({
        id: Date.now().toString(), // uid for delete to identify correctly
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

// so scratchpad can read and write to local storage but the writes are on keypress and also char counter
// im not sure if i wanna fix this cuz rn its autosave on key so its like less efficent for battery on big ammlunts of text but i doubt it will be an issue yk

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

/* ╔══════════════════════════════════════════════════════════════════════╗
   ║    6 ── 3D WIREFRAME VIEWPORT                                         ║
   ║    (the rotating wire shape you can drag)                             ║
   ╚══════════════════════════════════════════════════════════════════════╝ */

/* ──────────────────────────────────────────────────────────────────────────
   WHAT IS GOING ON HERE? THE SHORT VERSION:
   • We don't use a 3D library. It's hand-built math on a 2D canvas.
   • `vertices` is a big list of points {x, y, z} in 3D space.
   • Every frame we ROTATE those points (math below) and then FLATTEN them
     into 2D screen coordinates using a simple cube-not-a-camera projection.
     (scale = fov / (fov + depth) is the same trick 3D games use: things
     that are far away look smaller.)
   • Dragging sets targetRotX/targetRotY; the rotation LERP-towards them,
     and when you let go it slowly spins on its own (targetRotY += 0.008).

   THE GEOMETRY FACTORIES:
   • "icosahedron": 12 classic vertices + dots sprinkled along the edges.
     Have you seen the "golden ratio" (1 + √5)/2? These are its 12 corners.
   • "heart": a famous heart formula — with 3 slices of depth to make it
     volumetric.
   • "cube": every 3D lattice point on the surface of a 3x3x3 cube.
   ────────────────────────────────────────────────────────────────────────── */

/* ★ PERSONALIZE ★
   • the * 32 and * 40 scalars in generateGeometry control shape SIZE.
   • rotY += 0.008  → the auto-spin speed while you are NOT dragging.
   • fov = 240 and the +180 depth offset tune the "camera lens" feel.
   • the 3 modes cycle icosahedron → heart → cube → loop. You can add a 4th
     by adding an else-if branch + a factory.
   ────────────────────────────────────────────────────────────────────────── */

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
    vertices = []; // isosahedron one, done with math but like vectors lol
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
            /* dist < 2.3 is how we know two corners are neighbors
                  distance in 3d is the same as 3d pythag so math.hypot(x, y, z) works the same way */
            for (let t = 0.2; t < 1; t += 0.2) {
              vertices.push({
                x: (raw[i][0] + (raw[j][0] - raw[i][0]) * t) * 32,
                y: (raw[i][1] + (raw[j][1] - raw[i][1]) * t) * 32,
                z: (raw[i][2] + (raw[j][2] - raw[i][2]) * t) * 32
              });
            }
          }
        }
      }   // the heart one
    } else if (mode === 'heart') {
      const thicknesses = [-12, 0, 12];
      thicknesses.forEach(zOffset => {
        for (let angle = 0; angle < Math.PI * 2; angle += 0.15) {
          /* heart math stuff:
                x = 16·sin³(t)  and  y = -(13·cos t - 5·cos 2t - 2·cos 3t - cos 4t)
                the minus in front of y flips it so the heart points upwards */
          const x = 16 * Math.pow(Math.sin(angle), 3);
          const y = -(13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle));
          vertices.push({ x: x * 3.8, y: y * 3.8, z: zOffset });
        }
      });
    } else { // the cube, done with math like the heart
      for (let x = -1; x <= 1; x += 0.5) {
        for (let y = -1; y <= 1; y += 0.5) {
          for (let z = -1; z <= 1; z += 0.5) {
            /* math.abs is used for like checking distance from zero so the inside of the is empty */
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

  /* dragging controls for the 3d object, lowk most of this is just borrowed from my personal site
        1. mousedown on the canvas -> start dragging, remember last mouse pos
        2. mousemove on the window -> add the mouse movement to the targets
        3. mouseup on the window -> stop dragging
        also mousemove and mouseup are on window, so they work even if you drag outside of the canvas which makes it feel nicer  */
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

    /* smooth dragging to make it not snap to cursor when dragging */
    rotX += (targetRotX - rotX) * 0.1;
    rotY += (targetRotY - rotY) * 0.1;

    if (coordsEl) coordsEl.textContent = `x: ${rotX.toFixed(2)} y: ${rotY.toFixed(2)}`;

    ctx.clearRect(0, 0, w, h);

    /* projection math to make pretty 2d kinda thang
         first rot y, then x using cosin / sine like trigonometry
         secondly, scale = fov / (fov + z2 + 180) => far or like smaller
         thirdly, px = center + rotatedX * scale   (same for Y)
         so dots with a higher scale will be brighter and bigger => depth cue */
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

/* ╔══════════════════════════════════════════════════════════════════════╗
   ║    7 ── DAILY QUOTE                                                   ║
   ║    (a random quote + a link to the author on wikipedia)               ║
   ╚══════════════════════════════════════════════════════════════════════╝ */

/* ──────────────────────────────────────────────────────────────────────────
   HOW IT WORKS:
   • loadQuote() is an ASYNC function: it awaits a fetch() to an API that
     returns a random quote. "await" literally pauses the function until
     the internet answers (or fails).
   • If fetch throws an error (offline, blocked, whatever) we catch it and
     pick a random quote from the built-in `fallbacks` list — so the box
     is NEVER empty. This is called a "graceful fallback".
   • render() applies clean sentence-casing and builds the wikipedia link
     from the author's name.
   ────────────────────────────────────────────────────────────────────────── */

/* ★ PERSONALIZE ★ — YOUR OWN QUOTES, YOUR OWN FLAVOR ★
   ──────────────────────────────────────────────────────────────────────────
   • Add YOUR favourite lines to the fallbacks array! They are shown when
     you're offline, and they keep the vibe YOU want.
   • The quote API is dummyjson.com — swap it for another API by changing
     the URL in fetch() (zenquotes.io, api.quotable.io...) if you like.
   • toSentenceCase() lowercases everything then floats the first letter
     and the word "I" — DELETE this if you'd rather keep the author's caps.
   ────────────────────────────────────────────────────────────────────────── */

(function initQuote() {
  const quoteEl = $('#quote-text');
  const authorEl = $('#quote-author');
  const linkEl = $('#quote-link');
  const descEl = $('#quote-desc');
  const refreshBtn = $('#quote-refresh');
  if (!quoteEl) return;

  // fallback incase it dont work as it should or sum
  // might remove the description later but whatever for now
  const fallbacks = [
    { quote: 'the unexamined life is not worth living.', author: 'Socrates', desc: 'classical greek philosopher, one of the founders of western philosophy.' },
    { quote: 'whatever you can do, or dream you can, begin it. boldness has genius, power, and magic in it.', author: 'Johann Wolfgang von Goethe', desc: 'german writer and statesman, author of faust.' },
    { quote: 'the only way to do great work is to love what you do.', author: 'Steve Jobs', desc: 'american entrepreneur, co-founder of apple.' },
    { quote: 'be yourself; everyone else is already taken.', author: 'Oscar Wilde', desc: 'irish poet and playwright.' }
  ];

  // link to wikipedia on top of name like same way wiki search works 
  const wikiUrl = (name) => 'https://en.wikipedia.org/wiki/' + encodeURIComponent(name).replace(/%20/g, '_');

  // make quote look clean to avoid the dreaded Don'T 
  function toSentenceCase(text) {
    return text
      .toLowerCase()
      .replace(/^\s*(\w)/, (m, ch) => ch.toUpperCase())
      .replace(/([.!?]\s+)(\w)/g, (m, sp, ch) => sp + ch.toUpperCase())
      .replace(/\bi\b/g, 'I');
  }

  function render(item) {
    quoteEl.textContent = `"${toSentenceCase(item.quote)}"`;

    if (linkEl) {
      linkEl.href = wikiUrl(item.author);
      linkEl.textContent = item.author;
      linkEl.style.display = 'inline';
    }
    if (authorEl) authorEl.textContent = '';
    if (descEl) descEl.textContent = item.desc ? `— ${item.desc}` : '';
  }

  async function loadQuote() {
    quoteEl.textContent = 'loading...';
    if (authorEl) authorEl.textContent = '';
    if (descEl) descEl.textContent = '';

    let quote = null;
    try {
      const res = await fetch('https://dummyjson.com/quotes/random');
      const data = await res.json();
      quote = { quote: data.quote, author: data.author };
    } catch (e) {
      quote = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    render(quote || fallbacks[0]);
  }

  if (refreshBtn) refreshBtn.addEventListener('click', loadQuote);
  loadQuote();
})();

/* ╔══════════════════════════════════════════════════════════════════════╗
   ║    8 ── SETTINGS DRAWER                                                ║
   ║    (the sliding panel from the right)                                  ║
   ╚══════════════════════════════════════════════════════════════════════╝ */

/* ──────────────────────────────────────────────────────────────────────────
   THE GRAND PATTERN YOU WILL SEE ~10 TIMES IN HERE:
      button.addEventListener('click', () => {
        1. change the setting in `state`
        2. save it to localStorage (so it survives reloads)
        3. flip the .active class so the picked button looks chosen
      })

   >>> ABOUT `updateBgConfig` and `toggleSettings`:
        Both were declared as empty functions near the top of this file.
        Other sections REPLACE them with real implementations. Because the
        settings section lives here (last), it is allowed to CALL them
        freely. That is the "bridge" between features. 
   ────────────────────────────────────────────────────────────────────────── */

let toggleSettings = () => { };

(function initSettings() {
  const toggleBtn = $('#settings-toggle');
  const drawer = $('#settings-drawer');
  const bg = $('#drawer-bg');
  const closeBtn = $('#close-drawer');
  const contrastOpts = $$('#contrast-opts .opt');
  const spacingOpts = $$('#spacing-opts .opt');
  const btn24h = $('#btn-24h');
  const btn12h = $('#btn-12h');
  const btnSecOn = $('#btn-seconds-on');
  const btnSecOff = $('#btn-seconds-off');
  const btnLight = $('#btn-light');
  const btnDark = $('#btn-dark');
  const resetShortcutsBtn = $('#reset-shortcuts-btn');

  /* load saved state for all the stuff on the site like the scratchpad, menu, theme, etc. */
  // also selected option buttons and allat
  contrastOpts.forEach(o => {
    o.classList.toggle('active', parseFloat(o.dataset.base) === state.bgBaseOpacity);
  });
  spacingOpts.forEach(o => {
    o.classList.toggle('active', parseInt(o.dataset.spacing, 10) === state.bgSpacing);
  });
  if (btn24h) btn24h.classList.toggle('active', state.clock24h);
  if (btn12h) btn12h.classList.toggle('active', !state.clock24h);
  if (btnSecOn) btnSecOn.classList.toggle('active', state.showSeconds);
  if (btnSecOff) btnSecOff.classList.toggle('active', !state.showSeconds);
  if (btnLight) btnLight.classList.toggle('active', state.theme !== 'dark');
  if (btnDark) btnDark.classList.toggle('active', state.theme === 'dark');

  // open or close settings menu
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

  // contrast for dots in bkg
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

  // spacing for dots in bkg
  spacingOpts.forEach(btn => {
    btn.addEventListener('click', () => {
      state.bgSpacing = parseInt(btn.dataset.spacing, 10);
      localStorage.setItem('oxy_bg_spacing', state.bgSpacing);
      spacingOpts.forEach(o => o.classList.toggle('active', o === btn));
      updateBgConfig();
    });
  });

  // military or am/pm clock toggle
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

  // clock seconds toggle
  if (btnSecOn && btnSecOff) {
    btnSecOn.addEventListener('click', () => {
      state.showSeconds = true;
      localStorage.setItem('oxy_show_seconds', 'true');
      btnSecOn.classList.add('active');
      btnSecOff.classList.remove('active');
    });
    btnSecOff.addEventListener('click', () => {
      state.showSeconds = false;
      localStorage.setItem('oxy_show_seconds', 'false');
      btnSecOff.classList.add('active');
      btnSecOn.classList.remove('active');
    });
  }

  // theme selector code
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

  // reset for shortcuts
  if (resetShortcutsBtn) {
    resetShortcutsBtn.addEventListener('click', () => {
      if (confirm('reset shortcuts to default?')) {
        localStorage.removeItem('oxy_shortcuts');
        location.reload();
      }
    });
  }
})();

/* ╔══════════════════════════════════════════════════════════════════════╗
   ║    NEW FEATURE TIME — PICK ONE, PASTE WHERE IT BELONGS                ║
   ║                                                                        ║
   ║    Below are 3 easy additions, each written as a complete little       ║
   ║    module. COPY the block, PASTE it near the matching section, then    ║
   ║    add the 2-3 lines of HTML (and tiny bit of CSS if you want).        ║
   ║    Everything is commented so you know EXACTLY where it plugs in.      ║
   ╚══════════════════════════════════════════════════════════════════════╝ */

/* ── FEATURE A: TIME-OF-DAY GREETING (easiest one, zero HTML needed) ──────
   ──────────────────────────────────────────────────────────────────────────
   Shows "good morning" / "good afternoon" / "good evening" under the clock.
   You can even personalise it with YOUR name: "good morning, rhime".

   PASTE: just below the clock update block inside SECTION 3 (the clock
   section) so the greeting refreshes with the clock each second.

   HTML TO ADD  ← drop this into index.html, right under the
                  date-display line, so the greeting sits above it:

   <div class="date-label" id="greeting-display"></div>

   ────────────────────────────────────────────────────────────────────────── */

  /* ★ PERSONALIZE ★ — say YOUR name */ 
  /*
  const greetingEl = document.getElementById('greeting-display'); // the <div>
  const YOUR_NAME = 'rhime'; // ← change this to your name (or '' for none)

  function updateGreeting() {
    const h = new Date().getHours();
    let word;
    if (h < 5)      word = 'night owl';            // midnight → 5am
    else if (h < 12) word = 'good morning';        // 5am → noon
    else if (h < 18) word = 'good afternoon';      // noon → 6pm
    else            word = 'good evening';         // 6pm → midnight
    if (greetingEl) greetingEl.textContent = YOUR_NAME
      ? `${word}, ${YOUR_NAME}.`
      : `${word}.`;
  }
  updateGreeting();
  setInterval(updateGreeting, 60000); // re-check once a minute
  */

/* ── FEATURE B: TODO / TASKS LIST (built exactly like the scratchpad) ──────
   ──────────────────────────────────────────────────────────────────────────
   A tiny to-do list: type a task, press enter to add it, click to delete it.
   It autosaves to localStorage with the exact same tricks as the scratchpad.

   PASTE: as a brand-new section (copy a whole `(function(){...})()` shape),
   anywhere between section 8 and here. Then add this HTML inside the
   widgets-grid in index.html:

      <div class="card">
        <div class="card-head">
          <span class="card-label"><span class="red-dot"></span> tasks</span>
        </div>
        <textarea id="todo-input" placeholder="add a task..."></textarea>
        <ul id="todo-list"></ul>
      </div>

   ────────────────────────────────────────────────────────────────────────── */

/*
(function initTodo() {
  const input = $('#todo-input');
  const list = $('#todo-list');
  if (!input || !list) return;

  // load saved tasks: JSON.parse turns the saved text back into an array
  let tasks = JSON.parse(localStorage.getItem('oxy_todos') || '[]');
  const save = () => localStorage.setItem('oxy_todos', JSON.stringify(tasks));

  function render() {
    list.innerHTML = '';
    tasks.forEach((task, i) => {
      const li = document.createElement('li');
      li.textContent = task;
      li.classList.add('todo-item');
      li.addEventListener('click', () => {        // click = delete
        tasks.splice(i, 1);                       // remove from array
        save();
        render();
      });
      list.appendChild(li);
    });
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      tasks.unshift(input.value.trim());          // add to FRONT of list
      input.value = '';
      save();
      render();
    }
  });

  render();
})();
*/

/* ── FEATURE C: ACCENT COLOR PICKER (personalization on steroids) ──────────
   ──────────────────────────────────────────────────────────────────────────
   Every red accent on the page (the dots, the search glow, the "g:" badge)
   comes from ONE CSS variable: --red. This feature lets the user pick any
   colour, stores it, and the whole page restyles on the spot.

   PASTE: as a new section anywhere after section 8. Then add to settings
   drawer in index.html:

      <div class="setting-group">
        <label>accent color</label>
        <input type="color" id="accent-picker" value="#ff2e2e">
      </div>

   ────────────────────────────────────────────────────────────────────────── */

/*
(function initAccent() {
  const picker = $('#accent-picker');
  if (!picker) return;

  // load the saved colour, or fall back to the default oxy. red
  picker.value = localStorage.getItem('oxy_accent') || '#ff2e2e';

  picker.addEventListener('input', () => {
    localStorage.setItem('oxy_accent', picker.value);
    // overwriting the CSS variable instantly restyles the whole page
    document.documentElement.style.setProperty('--red', picker.value);
  });
})();
*/

/*
// SECOND PART: apply the saved accent BEFORE the paint so there's no
// red flash. Paste this right after applyTheme(state.theme); near the
// top of the file, next to the other theme line.
document.documentElement.style.setProperty('--red',
  localStorage.getItem('oxy_accent') || '#ff2e2e');
*/