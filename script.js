/* ==========================================================================
   TEDxKI site script
   1. Content: sponsors and speakers (edit these)
   2. Header, navigation and page router
   3. Halftone helpers
   4. Ribbon helix (the twisting animation)
   5. Page widgets: people, sponsor grid, talks, contact form
   ========================================================================== */

/* ---------- 1. Content ---------- */

// Sponsors appear in the helix on the Sponsors page and in the logo grid.
// logo: path to a PNG or SVG, ideally dark artwork on a transparent background.
// Leave logo empty to show a placeholder. url is optional.
const SPONSORS = [
  { name: 'Sponsor One', logo: '', url: '' },
  { name: 'Sponsor Two', logo: '', url: '' },
  { name: 'Sponsor Three', logo: '', url: '' },
  { name: 'Sponsor Four', logo: '', url: '' },
  { name: 'Sponsor Five', logo: '', url: '' },
  { name: 'Sponsor Six', logo: '', url: '' },
];

// Speakers appear in the helix on the Home page and on the Event page.
// photo: path to a JPG or PNG. Leave empty to show a placeholder portrait.
const SPEAKERS = [
  { name: 'Speaker name', topic: 'Talk topic', photo: '' },
  { name: 'Speaker name', topic: 'Talk topic', photo: '' },
  { name: 'Speaker name', topic: 'Talk topic', photo: '' },
  { name: 'Speaker name', topic: 'Talk topic', photo: '' },
  { name: 'Speaker name', topic: 'Talk topic', photo: '' },
  { name: 'Speaker name', topic: 'Talk topic', photo: '' },
];

// Photos for the strip on the Home page. Each round shows a random set from this list,
// so add as many as you like. label is the small caption under each photo (optional).
// Leave the list empty to show halftone placeholders.
const STRIP_IMAGES = [
  // { src: 'images/moments/rehearsal.jpg', label: 'Rehearsal' },
  // { src: 'images/moments/stage.jpg', label: 'Aula Medica' },
];

const STRIP_OPTIONS = {
  holdMs: 7000, // how long the full row stays before it clears
  enterMs: 820, // how long one photo takes to pop in and slide into place
  gapMs: 140, // pause between photos
  bumpMs: 260, // the little squash when a photo docks
  exitMs: 520,
  restMs: 400, // empty pause before the next round
  halftone: false, // true draws our photos as dots too
};

const CONTACT_EMAIL = 'hello@tedxki.com';
const YOUTUBE_SEARCH = 'https://www.youtube.com/results?search_query=TEDxKI';

const HELIX_OPTIONS = {
  holdMs: 2800, // how long each set of logos stays still
  twistMs: 1500, // how long the half twist takes
  slotWidth: 0.62, // portrait width as a share of one half turn
  logoSlotWidth: 0.74, // logo width as a share of one half turn
  rungsPerHalfTurn: 6,
};

const DESKTOP_QUERY = '(min-width: 1024px)';
const PAGES = ['home', 'about', 'event', 'team', 'sponsors', 'watch', 'contact'];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ---------- 2. Header, navigation and router ---------- */

function initHeader() {
  const header = document.querySelector('[data-header]');
  if (!header) return;

  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  update();
  window.addEventListener('scroll', update, { passive: true });
}

function initNavigation() {
  const header = document.querySelector('[data-header]');
  const nav = document.querySelector('[data-nav]');
  const burger = document.querySelector('[data-burger]');
  if (!header || !nav || !burger) return;

  const desktop = window.matchMedia(DESKTOP_QUERY);
  const isOpen = () => nav.classList.contains('is-open');

  function setOpen(open) {
    // The header is not sticky, so jump to the top before the menu covers the screen.
    if (open) window.scrollTo({ top: 0, behavior: 'instant' });
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('is-locked', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  burger.addEventListener('click', () => setOpen(!isOpen()));

  header.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !isOpen()) return;
    setOpen(false);
    burger.focus();
  });

  desktop.addEventListener('change', (event) => {
    if (event.matches) setOpen(false);
  });
}

function initRouter() {
  const pages = new Map();
  document.querySelectorAll('[data-page]').forEach((page) => pages.set(page.dataset.page, page));
  const navLinks = document.querySelectorAll('.nav__link');
  let current = null;

  function show(fromNavigation) {
    const requested = window.location.hash.slice(1);
    // Hashes like #main (skip link) are anchors on the current page, not pages.
    if (requested && !PAGES.includes(requested) && current !== null) return;
    const id = PAGES.includes(requested) ? requested : 'home';
    if (id === current) return;

    pages.forEach((page, key) => {
      page.hidden = key !== id;
    });

    const page = pages.get(id);
    navLinks.forEach((link) => {
      if (link.getAttribute('href') === `#${id}`) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    document.title = page.dataset.pageTitle || 'TEDxKI';

    if (current !== null) {
      page.classList.remove('is-entering');
      void page.offsetWidth; // restart the entrance animation
      page.classList.add('is-entering');
      window.scrollTo({ top: 0, behavior: 'instant' });
      if (fromNavigation) page.querySelector('h1')?.focus({ preventScroll: true });
    }

    current = id;
  }

  // Placeholder links (href="#") do nothing until a real address is added.
  document.addEventListener('click', (event) => {
    if (event.target.closest('a[href="#"]')) event.preventDefault();
  });

  window.addEventListener('hashchange', () => show(true));
  show(false);
}

function setCurrentYear() {
  const year = String(new Date().getFullYear());
  document.querySelectorAll('[data-year]').forEach((element) => {
    element.textContent = year;
  });
}

/* ---------- 3. Halftone helpers ---------- */

const PLACEHOLDER_WORDS = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];

function cssVar(element, name, fallback) {
  return getComputedStyle(element).getPropertyValue(name).trim() || fallback;
}

function makeCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

// Canvas pixels cannot be read from images opened as local files (file://).
// When that happens we fall back to a placeholder so nothing breaks.
function canReadPixels(source) {
  try {
    const probe = makeCanvas(1, 1).getContext('2d');
    probe.drawImage(source, 0, 0, 1, 1);
    probe.getImageData(0, 0, 1, 1);
    return true;
  } catch (error) {
    return false;
  }
}

async function imageOr(src, fallback) {
  const image = await loadImage(src);
  return image && canReadPixels(image) ? image : fallback();
}

function placeholderLogo(index) {
  const variant = index % 6;
  const word = PLACEHOLDER_WORDS[index % PLACEHOLDER_WORDS.length];
  const font = (weight, size) => `${weight} ${size}px Inter, system-ui, sans-serif`;
  const measure = makeCanvas(1, 1).getContext('2d');
  const height = 200;
  const pad = 12;
  let canvas;
  let ctx;

  const start = (width) => {
    canvas = makeCanvas(width, height);
    ctx = canvas.getContext('2d');
    ctx.fillStyle = '#111';
    ctx.strokeStyle = '#111';
    ctx.textBaseline = 'middle';
  };

  if (variant === 1) {
    const text = `SPONSOR ${word.toUpperCase()}`;
    measure.font = font(700, 62);
    const width = measure.measureText(text).width + pad * 2;
    start(width);
    ctx.font = font(700, 62);
    ctx.fillText(text, pad, 84);
    ctx.fillRect(pad, 130, width - pad * 2, 16);
    return canvas;
  }

  if (variant === 4) {
    measure.font = font(800, 72);
    const top = measure.measureText('SPONSOR').width;
    measure.font = font(300, 72);
    const bottom = measure.measureText(word.toLowerCase()).width;
    start(Math.max(top, bottom) + pad * 2);
    ctx.font = font(800, 72);
    ctx.fillText('SPONSOR', pad, 58);
    ctx.font = font(300, 72);
    ctx.fillText(word.toLowerCase(), pad, 142);
    return canvas;
  }

  const styles = {
    0: { weight: 700, size: 70, text: `Sponsor ${word}` },
    2: { weight: 300, size: 76, text: `sponsor ${word.toLowerCase()}` },
    3: { weight: 800, size: 70, text: `Sponsor ${word}` },
    5: { weight: 500, size: 70, text: `Sponsor ${word}` },
  }[variant];

  const mark = 140;
  measure.font = font(styles.weight, styles.size);
  const textWidth = measure.measureText(styles.text).width;
  start(pad + mark + 28 + textWidth + pad);
  const cx = pad + mark / 2;
  const cy = height / 2;

  ctx.beginPath();
  if (variant === 0) {
    ctx.arc(cx, cy, mark / 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (variant === 2) {
    ctx.moveTo(cx, cy - mark / 2);
    ctx.lineTo(cx + mark / 2, cy + mark / 2.4);
    ctx.lineTo(cx - mark / 2, cy + mark / 2.4);
    ctx.closePath();
    ctx.fill();
  } else if (variant === 3) {
    ctx.lineWidth = 22;
    ctx.arc(cx, cy, mark / 2 - 11, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, mark / 6, 0, Math.PI * 2);
    ctx.fill();
  } else {
    for (let side = 0; side < 6; side++) {
      const angle = (Math.PI / 3) * side + Math.PI / 6;
      ctx.lineTo(cx + Math.cos(angle) * mark / 2, cy + Math.sin(angle) * mark / 2);
    }
    ctx.closePath();
    ctx.fill();
  }

  ctx.font = font(styles.weight, styles.size);
  ctx.fillText(styles.text, pad + mark + 28, cy + 4);
  return canvas;
}

function placeholderPortrait(index) {
  const size = 400;
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const variant = index % 8;
  const lean = ((index * 37) % 7 - 3) * 6;
  const headX = size / 2 + lean;
  const headY = 160 + (index % 3) * 6;
  const headR = 58 + (index % 4) * 4;
  const shoulder = 128 + (index % 5) * 9;

  const backdrop = ctx.createRadialGradient(size / 2 + lean, 170, 40, size / 2, 200, size * 0.72);
  backdrop.addColorStop(0, '#ececec');
  backdrop.addColorStop(1, '#a9a9a9');
  ctx.fillStyle = backdrop;
  ctx.fillRect(0, 0, size, size);

  const light = index % 2 ? 0.25 : 0.75;
  const body = ctx.createLinearGradient(size * light, 120, size * (1 - light), 400);
  body.addColorStop(0, '#6a6a6a');
  body.addColorStop(1, '#141414');
  ctx.fillStyle = body;

  // Long hair sits behind the shoulders.
  if (variant === 2 || variant === 6) {
    ctx.beginPath();
    ctx.ellipse(headX, headY + 70, headR * 1.25, headR * 1.9, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Shoulders
  ctx.beginPath();
  ctx.moveTo(headX - shoulder, size + 10);
  ctx.bezierCurveTo(headX - shoulder, 290, headX - 60, 262, headX, 262);
  ctx.bezierCurveTo(headX + 60, 262, headX + shoulder, 290, headX + shoulder, size + 10);
  ctx.closePath();
  ctx.fill();

  // Neck and head
  ctx.fillRect(headX - 24, headY + headR - 10, 48, 60);
  const face = ctx.createRadialGradient(headX - headR * 0.4 * (light > 0.5 ? -1 : 1), headY - 20, 8, headX, headY, headR * 1.2);
  face.addColorStop(0, '#8a8a8a');
  face.addColorStop(1, '#262626');
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.ellipse(headX, headY, headR * 0.88, headR, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = '#111';
  ctx.beginPath();
  if (variant === 1 || variant === 5) {
    ctx.arc(headX, headY - headR - 14, headR * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(headX, headY - headR * 0.35, headR * 0.92, headR * 0.7, 0, Math.PI, 0);
  } else if (variant === 3 || variant === 7) {
    for (let curl = 0; curl < 9; curl++) {
      const angle = Math.PI + (Math.PI / 8) * curl;
      ctx.moveTo(headX + Math.cos(angle) * headR, headY + Math.sin(angle) * headR);
      ctx.arc(headX + Math.cos(angle) * headR, headY + Math.sin(angle) * headR * 0.95, headR * 0.32, 0, Math.PI * 2);
    }
  } else if (variant !== 4) {
    ctx.ellipse(headX + (variant === 0 ? 6 : -6), headY - headR * 0.3, headR * 0.98, headR * 0.78, 0, Math.PI, 0);
  }
  ctx.fill();

  return canvas;
}

function placeholderStage(index) {
  const width = 640;
  const height = 360;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const x = width * (0.32 + ((index * 0.17) % 0.36));

  const wall = ctx.createLinearGradient(0, 0, 0, height);
  wall.addColorStop(0, '#f4f4f4');
  wall.addColorStop(1, '#b8b8b8');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, width, height);

  const beam = ctx.createRadialGradient(x, 40, 10, x, 180, 260);
  beam.addColorStop(0, 'rgba(255,255,255,0.9)');
  beam.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = beam;
  ctx.fillRect(0, 0, width, height);

  // The round red carpet
  ctx.fillStyle = '#eb0028';
  ctx.beginPath();
  ctx.ellipse(x, height * 0.86, width * 0.27, height * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Speaker
  ctx.fillStyle = '#151515';
  ctx.beginPath();
  ctx.arc(x, 118, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 36, 150);
  ctx.lineTo(x + 36, 150);
  ctx.lineTo(x + 26, 236);
  ctx.lineTo(x + 20, 312);
  ctx.lineTo(x - 20, 312);
  ctx.lineTo(x - 26, 236);
  ctx.closePath();
  ctx.fill();

  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#151515';
  ctx.beginPath();
  const raised = index % 3 === 0;
  ctx.moveTo(x + 32, 160);
  ctx.lineTo(x + (raised ? 70 : 56), raised ? 110 : 214);
  ctx.moveTo(x - 32, 160);
  ctx.lineTo(x - 50, 220);
  ctx.stroke();

  return canvas;
}

function drawSpeaker(ctx, x, baseY, scale, raised) {
  const p = (dx, dy) => [x + dx * scale, baseY + dy * scale];
  ctx.fillStyle = '#151515';
  ctx.beginPath();
  ctx.arc(...p(0, -194), 22 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  [[-36, -162], [36, -162], [26, -76], [20, 0], [-20, 0], [-26, -76]].forEach(([dx, dy], i) => {
    if (i) ctx.lineTo(...p(dx, dy));
    else ctx.moveTo(...p(dx, dy));
  });
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 14 * scale;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#151515';
  ctx.beginPath();
  ctx.moveTo(...p(32, -152));
  ctx.lineTo(...(raised ? p(70, -202) : p(56, -98)));
  ctx.moveTo(...p(-32, -152));
  ctx.lineTo(...p(-50, -92));
  ctx.stroke();
}

// Stand-in for a slider photo: a wide stage with the red circle, drawn in halftone.
function placeholderBanner(index) {
  const width = 1600;
  const height = 720;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const x = width * [0.7, 0.5, 0.8][index % 3];

  const wall = ctx.createLinearGradient(0, 0, 0, height);
  wall.addColorStop(0, '#f3f3f3');
  wall.addColorStop(1, '#a9a9a9');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, width, height);

  const beam = ctx.createRadialGradient(x, 40, 20, x, 340, 560);
  beam.addColorStop(0, 'rgba(255,255,255,0.95)');
  beam.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = beam;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#eb0028';
  ctx.beginPath();
  ctx.ellipse(x, 560, 300, 60, 0, 0, Math.PI * 2);
  ctx.fill();

  drawSpeaker(ctx, x, 570, 1.6, index % 3 === 0);
  return canvas;
}

/*
 * Turn an image into a grid of dot sizes.
 * mode "logo":  ink comes from dark, opaque pixels (falls back to opacity for light logos)
 * mode "photo": ink comes from darkness after a contrast stretch
 * mask "circle" keeps only a round crop. "duotone" remembers which cells are red.
 */
function halftoneGrid(source, options) {
  const { width, height, cell, fit = 'contain', mode = 'photo', mask = null, duotone = false } = options;
  const cols = Math.max(1, Math.floor(width / cell));
  const rows = Math.max(1, Math.floor(height / cell));
  const sample = makeCanvas(cols, rows);
  const ctx = sample.getContext('2d', { willReadFrequently: true });
  const sw = source.naturalWidth || source.width;
  const sh = source.naturalHeight || source.height;
  const scale = fit === 'cover' ? Math.max(cols / sw, rows / sh) : Math.min(cols / sw, rows / sh);
  const dw = sw * scale;
  const dh = sh * scale;

  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, (cols - dw) / 2, (rows - dh) / 2, dw, dh);

  let data;
  try {
    data = ctx.getImageData(0, 0, cols, rows).data;
  } catch (error) {
    return null;
  }

  const count = cols * rows;
  const alpha = new Float32Array(count);
  const light = new Float32Array(count);
  const red = duotone ? new Uint8Array(count) : null;

  for (let i = 0; i < count; i++) {
    const o = i * 4;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    alpha[i] = data[o + 3] / 255;
    light[i] = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    if (red) red[i] = r > 120 && r > g * 1.8 && r > b * 1.8 ? 1 : 0;

    if (mask === 'circle') {
      const dx = (i % cols) + 0.5 - cols / 2;
      const dy = Math.floor(i / cols) + 0.5 - rows / 2;
      if (Math.hypot(dx / cols, dy / rows) > 0.5) alpha[i] = 0;
    }
  }

  const ink = new Float32Array(count);

  if (mode === 'logo') {
    let darkSum = 0;
    let weight = 0;
    for (let i = 0; i < count; i++) {
      darkSum += alpha[i] * (1 - light[i]);
      weight += alpha[i];
    }
    const useAlphaOnly = weight > 0 && darkSum / weight < 0.25;
    for (let i = 0; i < count; i++) {
      ink[i] = useAlphaOnly ? alpha[i] : alpha[i] * (1 - light[i]);
    }
  } else {
    const visible = [];
    for (let i = 0; i < count; i++) if (alpha[i] > 0.5) visible.push(light[i]);
    visible.sort((a, b) => a - b);
    const lo = visible.length ? visible[Math.floor(visible.length * 0.02)] : 0;
    const hi = visible.length ? visible[Math.floor(visible.length * 0.98)] : 1;
    const span = Math.max(hi - lo, 0.05);
    for (let i = 0; i < count; i++) {
      if (alpha[i] < 0.5) continue;
      const level = Math.min(1, Math.max(0, (light[i] - lo) / span));
      ink[i] = Math.pow(1 - level, 1.15);
    }
  }

  const radii = new Float32Array(count);
  const max = cell * 0.62;
  for (let i = 0; i < count; i++) {
    const amount = red && red[i] ? Math.max(ink[i], 0.55) : ink[i];
    if (amount > 0.04) radii[i] = max * Math.sqrt(amount);
  }

  return { cols, rows, cell, width: cols * cell, height: rows * cell, radii, red };
}

function drawGrid(ctx, grid, x, y, colors) {
  const { cols, rows, cell, radii, red } = grid;
  const passes = red ? [0, 1] : [0];

  passes.forEach((pass) => {
    ctx.fillStyle = pass ? colors.red : colors.ink;
    ctx.beginPath();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const radius = radii[i];
        if (!radius || (red && red[i] !== pass)) continue;
        const px = x + (c + 0.5) * cell;
        const py = y + (r + 0.5) * cell;
        ctx.moveTo(px + radius, py);
        ctx.arc(px, py, radius, 0, Math.PI * 2);
      }
    }
    ctx.fill();
  });
}

// Draws a still halftone image into a canvas and redraws it when the canvas resizes.
function staticHalftone(canvas, getSource, options) {
  let source = null;
  let lastWidth = 0;

  function render() {
    const width = Math.round(canvas.clientWidth);
    const height = Math.round(canvas.clientHeight);
    if (!width || !height || !source || width === lastWidth) return;
    lastWidth = width;

    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const cell = Math.max(3, Math.min(6, width / options.cellsAcross));
    const grid = halftoneGrid(source, { ...options, width, height, cell });
    if (!grid) return;

    drawGrid(ctx, grid, (width - grid.width) / 2, (height - grid.height) / 2, {
      ink: cssVar(canvas, '--color-text', '#111'),
      red: cssVar(canvas, '--color-primary', '#eb0028'),
    });
  }

  Promise.resolve(getSource()).then((result) => {
    source = result;
    render();
  });

  new ResizeObserver(render).observe(canvas);
}

/* ---------- 4. Ribbon helix ---------- */

/*
 * The helix is a ribbon twisting around a horizontal axis. Its two edges are the
 * DNA strands, the faint vertical lines between them are the base pairs, and the
 * logos are printed on the ribbon itself: front and back. Every few seconds the
 * ribbon makes a half turn, so each logo squeezes flat and the next one opens up
 * on the other side.
 */
function createHelix(canvas, items, kind, options) {
  const ctx = canvas.getContext('2d');
  const band = canvas.closest('.helix-band');
  const toggle = band ? band.querySelector('[data-helix-toggle]') : null;
  const maxWidthRef = canvas.dataset.maxWidthRef ? document.querySelector(canvas.dataset.maxWidthRef) : null;

  const state = {
    width: 0,
    height: 0,
    halfTurn: 0,
    amplitude: 0,
    firstSlot: 0,
    cell: 4,
    boxWidth: 0,
    boxHeight: 0,
    slots: [],
    queue: 0,
    cycle: -1,
    clock: 0,
    last: 0,
    frame: null,
    visible: false,
    paused: false,
    colors: {},
    gridCache: new Map(),
  };

  const period = options.holdMs + options.twistMs;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function readColors() {
    state.colors = {
      a: cssVar(canvas, '--helix-strand-a', '#eb0028'),
      b: cssVar(canvas, '--helix-strand-b', '#111'),
      dots: cssVar(canvas, '--helix-dots', '#111'),
    };
  }

  function gridFor(itemIndex) {
    const key = `${itemIndex}|${state.boxWidth}|${state.boxHeight}|${state.cell}`;
    if (!state.gridCache.has(key)) {
      const item = items[itemIndex];
      const grid = kind === 'logo'
        ? halftoneGrid(item.source, { width: state.boxWidth, height: state.boxHeight, cell: state.cell, mode: 'logo' })
        : halftoneGrid(item.source, { width: state.boxWidth, height: state.boxHeight, cell: state.cell, mode: 'photo', fit: 'cover', mask: 'circle' });
      state.gridCache.set(key, grid);
    }
    return state.gridCache.get(key);
  }

  function nextItem() {
    const index = state.queue % items.length;
    state.queue += 1;
    return index;
  }

  function visibleFace(slotIndex, cycle) {
    return (slotIndex + cycle) % 2 === 0 ? 0 : 1;
  }

  function layout() {
    const width = Math.round(canvas.clientWidth);
    const height = Math.round(canvas.clientHeight);
    if (!width || !height) return false;
    if (width === state.width && height === state.height) return true;

    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    state.width = width;
    state.height = height;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const count = width < 640 ? 1 : width < 1000 ? 2 : width < 1500 ? 3 : 4;
    state.halfTurn = count === 1 ? width * 0.8 : width / (count + 0.5);
    state.amplitude = Math.min(height * 0.44, state.halfTurn * 0.42);
    state.firstSlot = width / 2 - ((count - 1) / 2) * state.halfTurn;
    // Logos need finer dots than photos to keep lettering readable.
    state.cell = kind === 'logo'
      ? Math.max(2.4, Math.min(3.2, state.halfTurn / 120))
      : Math.max(3, Math.min(4.5, state.halfTurn / 80));

    let boxWidth = state.halfTurn * (kind === 'logo' ? options.logoSlotWidth : options.slotWidth);
    // TEDx rule: sponsor logos must be smaller than the event logo on the same page.
    if (maxWidthRef && maxWidthRef.offsetWidth) boxWidth = Math.min(boxWidth, maxWidthRef.offsetWidth * 0.95);
    let boxHeight = state.amplitude * (kind === 'logo' ? 0.8 : 1.2);
    if (kind !== 'logo') boxWidth = boxHeight = Math.min(boxWidth, boxHeight);
    state.boxWidth = Math.round(boxWidth);
    state.boxHeight = Math.round(boxHeight);

    // Keep the logos that are already showing when the layout changes.
    const previous = state.slots;
    state.slots = Array.from({ length: count }, (_, i) => {
      if (previous[i]) return { x: state.firstSlot + i * state.halfTurn, faces: previous[i].faces };
      const faces = [null, null];
      const shown = visibleFace(i, Math.max(state.cycle, 0));
      faces[shown] = nextItem();
      faces[1 - shown] = nextItem();
      return { x: state.firstSlot + i * state.halfTurn, faces };
    });

    state.gridCache.clear();
    readColors();
    return true;
  }

  function onNewCycle(cycle) {
    // The face that just turned away is hidden now, so it can take the next logo.
    state.slots.forEach((slot, i) => {
      slot.faces[1 - visibleFace(i, cycle)] = nextItem();
    });
  }

  function phaseAt(clock) {
    if (reducedMotion.matches) return 0;
    const cycle = Math.floor(clock / period);
    const within = clock - cycle * period;
    const turn = within < options.holdMs ? 0 : ease((within - options.holdMs) / options.twistMs);
    return (cycle + turn) * Math.PI + Math.sin(clock * 0.0011) * 0.05;
  }

  function draw() {
    const { width, height, halfTurn, amplitude, firstSlot, cell, colors } = state;
    const phase = phaseAt(state.clock);
    const centerY = height / 2;
    const theta = (x) => (Math.PI * (x - firstSlot)) / halfTurn + phase;

    ctx.clearRect(0, 0, width, height);

    // Strand dots, sorted into depth buckets so far dots draw behind the ribbon.
    const levels = 5;
    const buckets = [[], []].map(() => Array.from({ length: levels }, () => []));
    const step = Math.max(4, cell * 1.15);
    const strandRadius = Math.max(1.6, Math.min(3.2, halfTurn / 120));

    for (let x = -step; x <= width + step; x += step) {
      const t = theta(x);
      const cos = Math.cos(t);
      const sin = Math.sin(t);
      [[centerY - amplitude * cos, (sin + 1) / 2], [centerY + amplitude * cos, (1 - sin) / 2]].forEach(([y, depth], strand) => {
        const level = Math.min(levels - 1, Math.floor(depth * levels));
        buckets[strand][level].push(x, y, strandRadius * (0.55 + depth * 0.6));
      });
    }

    const drawStrands = (fromLevel, toLevel) => {
      for (let strand = 0; strand < 2; strand++) {
        ctx.fillStyle = strand === 0 ? colors.a : colors.b;
        for (let level = fromLevel; level < toLevel; level++) {
          const list = buckets[strand][level];
          if (!list.length) continue;
          ctx.globalAlpha = 0.3 + (level / (levels - 1)) * 0.7;
          ctx.beginPath();
          for (let i = 0; i < list.length; i += 3) {
            ctx.moveTo(list[i] + list[i + 2], list[i + 1]);
            ctx.arc(list[i], list[i + 1], list[i + 2], 0, Math.PI * 2);
          }
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    drawStrands(0, Math.ceil(levels / 2));

    // Base pairs: faint dotted rungs, skipped where a logo sits.
    const rungGap = halfTurn / options.rungsPerHalfTurn;
    const clear = state.boxWidth / 2 + cell * 2;
    const rungStep = Math.max(4, cell * 1.4);
    const rungRadius = strandRadius * 0.6;
    const firstRung = firstSlot - Math.ceil(firstSlot / rungGap + 1) * rungGap + rungGap / 2;

    ctx.globalAlpha = 0.38;
    [colors.a, colors.b].forEach((color, half) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let x = firstRung; x <= width + rungGap; x += rungGap) {
        if (state.slots.some((slot) => Math.abs(x - slot.x) < clear)) continue;
        const reach = amplitude * Math.cos(theta(x));
        const length = Math.abs(reach) * 2;
        if (length < rungStep * 2) continue;
        const top = centerY - Math.abs(reach);
        const dots = Math.floor(length / rungStep);
        const from = half ? Math.ceil(dots / 2) : 1;
        const to = half ? dots : Math.ceil(dots / 2);
        for (let d = from; d < to; d++) {
          const y = top + d * rungStep;
          ctx.moveTo(x + rungRadius, y);
          ctx.arc(x, y, rungRadius, 0, Math.PI * 2);
        }
      }
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Logos printed on the ribbon. Each column is squeezed by how much that part
    // of the ribbon faces us, and shows the front or back face depending on side.
    ctx.fillStyle = colors.dots;
    ctx.beginPath();
    state.slots.forEach((slot) => {
      slot.faces.forEach((itemIndex, face) => {
        const grid = gridFor(itemIndex);
        if (!grid) return;
        const sign = face === 0 ? 1 : -1;
        const left = slot.x - grid.width / 2;

        for (let c = 0; c < grid.cols; c++) {
          const x = left + (c + 0.5) * grid.cell;
          const facing = Math.cos(theta(x)) * sign;
          if (facing < 0.05) continue;
          const shrink = 0.4 + 0.6 * facing;

          for (let r = 0; r < grid.rows; r++) {
            const radius = grid.radii[r * grid.cols + c];
            if (!radius) continue;
            const y = centerY + (r + 0.5 - grid.rows / 2) * grid.cell * facing;
            const size = radius * shrink;
            ctx.moveTo(x + size, y);
            ctx.arc(x, y, size, 0, Math.PI * 2);
          }
        }
      });
    });
    ctx.fill();

    drawStrands(Math.ceil(levels / 2), levels);
  }

  function tick(time) {
    const delta = state.last ? Math.min(time - state.last, 64) : 16;
    state.last = time;
    state.clock += delta;

    const cycle = Math.floor(state.clock / period);
    if (cycle !== state.cycle) {
      if (state.cycle >= 0) onNewCycle(cycle);
      state.cycle = cycle;
    }

    draw();
    state.frame = requestAnimationFrame(tick);
  }

  function play() {
    if (state.frame || !state.visible || state.paused || reducedMotion.matches || !state.width) return;
    state.last = 0;
    state.frame = requestAnimationFrame(tick);
  }

  function stop() {
    cancelAnimationFrame(state.frame);
    state.frame = null;
  }

  function refresh() {
    if (!layout()) return;
    if (state.cycle < 0) state.cycle = 0;
    draw();
    play();
  }

  function setPaused(paused) {
    state.paused = paused;
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.querySelector('[data-icon-pause]').hidden = paused;
      toggle.querySelector('[data-icon-play]').hidden = !paused;
      toggle.querySelector('span').textContent = paused ? 'Play animation' : 'Pause animation';
    }
    if (paused) stop();
    else play();
  }

  if (toggle) {
    toggle.hidden = reducedMotion.matches;
    toggle.addEventListener('click', () => setPaused(!state.paused));
  }

  reducedMotion.addEventListener('change', () => {
    if (toggle) toggle.hidden = reducedMotion.matches;
    stop();
    if (state.width) draw();
    play();
  });

  new ResizeObserver(refresh).observe(canvas);

  new IntersectionObserver(([entry]) => {
    state.visible = entry.isIntersecting;
    if (state.visible) refresh();
    else stop();
  }).observe(canvas);
}

async function initHelixes() {
  const sponsorSources = await Promise.all(
    SPONSORS.map((sponsor, i) => imageOr(sponsor.logo, () => placeholderLogo(i))),
  );
  const speakerSources = await Promise.all(
    SPEAKERS.map((speaker, i) => imageOr(speaker.photo, () => placeholderPortrait(i))),
  );

  const sets = {
    sponsors: { kind: 'logo', items: SPONSORS.map((s, i) => ({ ...s, source: sponsorSources[i] })) },
    speakers: { kind: 'portrait', items: SPEAKERS.map((s, i) => ({ ...s, source: speakerSources[i] })) },
  };

  document.querySelectorAll('[data-helix]').forEach((canvas) => {
    const set = sets[canvas.dataset.helix];
    if (set && set.items.length) createHelix(canvas, set.items, set.kind, HELIX_OPTIONS);
  });
}

/* ---------- 5. Page widgets ---------- */

function initSpeakerGrid() {
  const grid = document.querySelector('[data-speaker-grid]');
  if (!grid) return;

  SPEAKERS.forEach((speaker, i) => {
    const card = document.createElement('article');
    card.className = 'person';
    const photo = document.createElement('canvas');
    photo.className = 'person__photo';
    photo.setAttribute('role', 'img');
    photo.setAttribute('aria-label', `Portrait of ${speaker.name}`);
    const name = document.createElement('h3');
    name.className = 'person__name';
    name.textContent = speaker.name;
    const topic = document.createElement('p');
    topic.className = 'person__role';
    topic.textContent = speaker.topic;
    card.append(photo, name, topic);
    grid.append(card);

    staticHalftone(photo, () => imageOr(speaker.photo, () => placeholderPortrait(i)), {
      mode: 'photo',
      fit: 'cover',
      cellsAcross: 52,
    });
  });
}

function initTeamPortraits() {
  document.querySelectorAll('canvas[data-portrait]').forEach((canvas) => {
    const index = Number(canvas.dataset.portrait) || 0;
    const name = canvas.parentElement.querySelector('.person__name');
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', `Portrait of ${name ? name.textContent : 'team member'}`);
    staticHalftone(canvas, () => imageOr(canvas.dataset.photo, () => placeholderPortrait(index + 3)), {
      mode: 'photo',
      fit: 'cover',
      cellsAcross: 52,
    });
  });
}

function initSponsorGrid() {
  const list = document.querySelector('[data-sponsor-grid]');
  if (!list) return;

  SPONSORS.forEach((sponsor, i) => {
    const item = document.createElement('li');
    const tile = document.createElement(sponsor.url ? 'a' : 'div');
    tile.className = 'logo-tile';
    if (sponsor.url) {
      tile.href = sponsor.url;
      tile.target = '_blank';
      tile.rel = 'noopener';
    }

    if (sponsor.logo) {
      const img = document.createElement('img');
      img.src = sponsor.logo;
      img.alt = sponsor.name;
      img.loading = 'lazy';
      tile.append(img);
    } else {
      const logo = placeholderLogo(i);
      logo.setAttribute('role', 'img');
      logo.setAttribute('aria-label', sponsor.name);
      tile.append(logo);
    }

    item.append(tile);
    list.append(item);
  });
}

function initTalks() {
  document.querySelectorAll('.talk').forEach((talk) => {
    const media = talk.querySelector('.talk__media');
    const title = talk.querySelector('.talk__title')?.textContent || 'talk';
    const videoId = (talk.dataset.video || '').trim();
    const thumb = media.querySelector('canvas[data-thumb]');

    if (!videoId) {
      // No video yet: show a halftone stage and link to the YouTube search.
      staticHalftone(thumb, () => placeholderStage(Number(thumb.dataset.thumb) || 0), {
        mode: 'photo',
        fit: 'cover',
        duotone: true,
        cellsAcross: 90,
      });
      const link = document.createElement('a');
      link.className = media.className;
      link.href = YOUTUBE_SEARCH;
      link.target = '_blank';
      link.rel = 'noopener';
      link.setAttribute('aria-label', `Watch ${title} on YouTube`);
      link.append(...media.childNodes);
      media.replaceWith(link);
      return;
    }

    thumb.remove();
    const img = document.createElement('img');
    img.src = `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;
    img.alt = '';
    img.loading = 'lazy';
    media.prepend(img);
    media.setAttribute('role', 'button');
    media.setAttribute('tabindex', '0');
    media.setAttribute('aria-label', `Play ${title}`);

    const play = () => {
      const frame = document.createElement('iframe');
      frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1`;
      frame.title = title;
      frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      frame.allowFullscreen = true;
      media.replaceChildren(frame);
      media.removeAttribute('role');
      media.removeAttribute('tabindex');
    };

    media.addEventListener('click', play, { once: true });
    media.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        play();
      }
    });
  });
}

function initContact() {
  document.querySelectorAll('[data-email]').forEach((el) => {
    el.textContent = CONTACT_EMAIL;
  });

  const copy = document.querySelector('[data-copy-email]');
  if (copy) {
    copy.addEventListener('click', async () => {
      const label = copy.querySelector('span');
      try {
        await navigator.clipboard.writeText(CONTACT_EMAIL);
        label.textContent = 'Copied';
      } catch (error) {
        const range = document.createRange();
        range.selectNodeContents(document.querySelector('[data-email]'));
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        label.textContent = 'Press Ctrl+C';
      }
      setTimeout(() => {
        label.textContent = 'Copy';
      }, 2200);
    });
  }

  const form = document.querySelector('[data-contact-form]');
  if (!form) return;
  const error = form.querySelector('[data-form-error]');
  const status = form.querySelector('[data-form-status]');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const fields = ['name', 'email', 'message'].map((name) => form.elements[name]);
    const invalid = fields.filter((field) => !field.value.trim() || !field.checkValidity());

    fields.forEach((field) => field.setAttribute('aria-invalid', String(invalid.includes(field))));
    status.hidden = true;

    if (invalid.length) {
      const first = invalid[0];
      error.textContent = first.name === 'email' && first.value.trim()
        ? 'Check your email address. It should look like name@example.com.'
        : 'Fill in your name, email and message so we can reply.';
      error.hidden = false;
      first.focus();
      return;
    }

    error.hidden = true;
    const data = new FormData(form);
    const subject = `${data.get('topic')}: message from ${data.get('name')}`;
    const body = `${data.get('message')}\n\n${data.get('name')}\n${data.get('email')}`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    status.textContent = `Your email app should open with the message ready. If nothing happens, email us at ${CONTACT_EMAIL}.`;
    status.hidden = false;
  });
}

function initBanner() {
  const banner = document.querySelector('[data-banner]');
  if (!banner) return;

  const slides = [...banner.querySelectorAll('.banner__slide')];
  const dots = [...banner.querySelectorAll('.banner__dot')];
  const toggle = banner.querySelector('[data-banner-toggle]');
  const region = banner.querySelector('.banner__slides');
  let index = 0;

  // Swap a missing photo for the halftone stage drawing.
  slides.forEach((slide, i) => {
    const img = slide.querySelector('img.banner__image');
    if (!img) return;
    const useFallback = () => {
      const canvas = document.createElement('canvas');
      canvas.className = 'banner__image';
      canvas.setAttribute('aria-hidden', 'true');
      img.replaceWith(canvas);
      staticHalftone(canvas, () => placeholderBanner(i), {
        mode: 'photo',
        fit: 'cover',
        duotone: true,
        cellsAcross: 230,
      });
    };
    if (!img.getAttribute('src') || (img.complete && img.naturalWidth === 0)) useFallback();
    else img.addEventListener('error', useFallback, { once: true });
  });

  function show(next) {
    index = (next + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === index);
      slide.setAttribute('aria-hidden', String(i !== index));
    });
    dots.forEach((dot, i) => {
      if (i === index) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => show(i));
    // The red progress line finishing is what moves the slider on.
    dot.querySelector('span').addEventListener('animationend', () => {
      if (!reducedMotion.matches && i === index) show(index + 1);
    });
  });

  banner.addEventListener('keydown', (event) => {
    if (!event.target.closest('.banner__dot')) return;
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    show(index + (event.key === 'ArrowRight' ? 1 : -1));
    dots[index].focus();
  });

  let startX = null;
  banner.addEventListener('pointerdown', (event) => {
    startX = event.clientX;
  });
  banner.addEventListener('pointerup', (event) => {
    if (startX === null) return;
    const distance = event.clientX - startX;
    startX = null;
    if (Math.abs(distance) > 50) show(index + (distance < 0 ? 1 : -1));
  });

  if (toggle) {
    toggle.addEventListener('click', () => {
      const paused = !banner.classList.contains('is-paused');
      banner.classList.toggle('is-paused', paused);
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
      toggle.querySelector('[data-icon-pause]').hidden = paused;
      toggle.querySelector('[data-icon-play]').hidden = !paused;
      region.setAttribute('aria-live', paused ? 'polite' : 'off');
    });
  }

  show(0);
}

function initHeroImage() {
  const img = document.querySelector('[data-hero-image]');
  if (!img) return;

  const useFallback = () => {
    const canvas = document.createElement('canvas');
    canvas.className = 'hero__image';
    canvas.setAttribute('aria-hidden', 'true');
    img.replaceWith(canvas);
    staticHalftone(canvas, () => placeholderBanner(2), {
      mode: 'photo',
      fit: 'cover',
      duotone: true,
      cellsAcross: 230,
    });
  };

  if (!img.getAttribute('src') || (img.complete && img.naturalWidth === 0)) useFallback();
  else img.addEventListener('error', useFallback, { once: true });
}

// Any <img data-fallback="stage|banner|portrait"> whose file is missing becomes a halftone drawing.
function initFallbackImages() {
  const drawings = {
    stage: { draw: placeholderStage, cellsAcross: 120, duotone: true },
    banner: { draw: placeholderBanner, cellsAcross: 200, duotone: true },
    portrait: { draw: placeholderPortrait, cellsAcross: 90, duotone: false },
  };

  document.querySelectorAll('img[data-fallback]').forEach((img) => {
    const drawing = drawings[img.dataset.fallback];
    if (!drawing) return;
    const index = Number(img.dataset.fallbackIndex) || 0;

    const useFallback = () => {
      const canvas = document.createElement('canvas');
      canvas.className = img.className;
      canvas.setAttribute('aria-hidden', 'true');
      img.replaceWith(canvas);
      staticHalftone(canvas, () => drawing.draw(index), {
        mode: 'photo',
        fit: 'cover',
        duotone: drawing.duotone,
        cellsAcross: drawing.cellsAcross,
      });
    };

    if (!img.getAttribute('src') || (img.complete && img.naturalWidth === 0)) useFallback();
    else img.addEventListener('error', useFallback, { once: true });
  });
}

function initBackToTop() {
  document.querySelectorAll('[data-back-to-top]').forEach((button) => {
    button.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    });
  });
}

function initNumbers() {
  const values = document.querySelectorAll('[data-count]');
  if (!values.length || reducedMotion.matches) return;

  const write = (el, value) => {
    el.textContent = `${Math.round(value).toLocaleString('en-US')}${el.dataset.suffix || ''}`;
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      const el = entry.target;
      const target = Number(el.dataset.count) || 0;
      const start = performance.now();

      const step = (now) => {
        const t = Math.min(1, (now - start) / 1400);
        write(el, target * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });

  values.forEach((el) => observer.observe(el));
}

/* ---------- Photo strip (Home) ---------- */

// Draws a halftone version of a picture into a fresh canvas of the given CSS size.
function halftoneCanvas(source, size, options) {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const canvas = makeCanvas(size * ratio, size * ratio);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  const cell = Math.max(3, Math.min(5, size / 40));
  const grid = halftoneGrid(source, { width: size, height: size, cell, fit: 'cover', mode: 'photo', ...options });
  if (grid) {
    drawGrid(ctx, grid, (size - grid.width) / 2, (size - grid.height) / 2, {
      ink: cssVar(document.documentElement, '--color-text', '#000'),
      red: cssVar(document.documentElement, '--color-primary', '#eb0028'),
    });
  }
  return canvas;
}

function placeholderMoments() {
  // Portraits are drawn in black dots, stage scenes keep their red carpet.
  const drawings = [
    { draw: () => placeholderStage(0), duotone: true },
    { draw: () => placeholderPortrait(1), duotone: false },
    { draw: () => placeholderStage(2), duotone: true },
    { draw: () => placeholderPortrait(4), duotone: false },
    { draw: () => placeholderBanner(1), duotone: true },
    { draw: () => placeholderPortrait(6), duotone: false },
    { draw: () => placeholderStage(4), duotone: true },
    { draw: () => placeholderPortrait(3), duotone: false },
    { draw: () => placeholderBanner(2), duotone: true },
  ];
  return drawings.map((drawing, i) => ({ ...drawing, label: `Photo ${String(i + 1).padStart(2, '0')}` }));
}

function createDock(root, pool, options) {
  const stage = root.querySelector('[data-dock-stage]');
  const toggle = root.querySelector('[data-dock-toggle]');
  const border = 4;
  const state = {
    width: 0,
    size: 0,
    count: 0,
    step: 0,
    startX: 0,
    tiles: [],
    clock: 0,
    last: 0,
    frame: null,
    visible: false,
    paused: false,
    recent: [],
    timeline: null,
    cache: new Map(),
  };

  const easeOutBack = (t) => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2);
  const easeInCubic = (t) => t * t * t;

  function measure() {
    const width = Math.round(stage.clientWidth);
    if (!width) return false;
    const count = width >= 900 ? 6 : width >= 600 ? 4 : 3;
    const room = width * (count === 3 ? 0.9 : 0.8);
    const size = Math.floor(Math.min(200, (room + border * (count - 1)) / count));
    const changed = width !== state.width || count !== state.count || size !== state.size;
    state.width = width;
    state.count = count;
    state.size = size;
    state.step = size - border;
    state.startX = Math.round((width - (state.step * (count - 1) + size)) / 2);
    stage.style.setProperty('--dock-size', `${size}px`);
    return changed;
  }

  // A random set, avoiding the photos shown last round when the list is long enough.
  function pick(count) {
    const indices = pool.map((_, i) => i);
    const fresh = indices.filter((i) => !state.recent.includes(i));
    const order = (fresh.length >= count ? fresh : indices).sort(() => Math.random() - 0.5);
    const chosen = [];
    while (chosen.length < count) chosen.push(order[chosen.length % order.length]);
    state.recent = chosen;
    return chosen;
  }

  function visual(entryIndex) {
    const entry = pool[entryIndex];
    if (entry.image && !options.halftone) {
      const img = document.createElement('img');
      img.src = entry.image.src;
      img.alt = '';
      return img;
    }
    const key = `${entryIndex}|${state.size}`;
    if (!state.cache.has(key)) {
      const source = entry.image || entry.draw();
      state.cache.set(key, halftoneCanvas(source, state.size, { duotone: entry.duotone ?? true }));
    }
    const cached = state.cache.get(key);
    const canvas = makeCanvas(cached.width, cached.height);
    canvas.getContext('2d').drawImage(cached, 0, 0);
    return canvas;
  }

  function newRound() {
    stage.replaceChildren();
    const chosen = pick(state.count);
    state.tiles = chosen.map((entryIndex, k) => {
      const slot = state.count - 1 - k; // the first photo docks on the right
      const finalX = state.startX + slot * state.step;
      let spawnX = finalX - state.size * (1.3 + Math.random() * 1.1);
      if (k === 0) spawnX = finalX - state.size * 2.2;
      if (k === state.count - 1) spawnX = -state.size - 24; // the last one flies in from the edge

      const tile = document.createElement('figure');
      tile.className = 'dock__tile';
      const frame = document.createElement('div');
      frame.className = 'dock__frame';
      frame.append(visual(entryIndex));
      const label = document.createElement('figcaption');
      label.className = 'dock__label';
      label.textContent = pool[entryIndex].label || '';
      tile.append(frame, label);
      tile.style.opacity = '0';
      stage.append(tile);
      return { el: tile, slot, finalX, spawnX };
    });

    const per = options.enterMs + options.gapMs;
    const arrived = (state.count - 1) * per + options.enterMs;
    const holdEnd = arrived + options.bumpMs + options.holdMs;
    const exitEnd = holdEnd + options.exitMs + (state.count - 1) * 45;
    state.timeline = { per, arrived, holdEnd, end: exitEnd + options.restMs };
    state.clock = 0;
  }

  function render() {
    const { per, holdEnd } = state.timeline;
    const t = state.clock;

    // Which arrival is bumping the row right now?
    let bump = 0;
    let bumper = -1;
    state.tiles.forEach((_, k) => {
      const since = t - (k * per + options.enterMs);
      if (since >= 0 && since < options.bumpMs) {
        bump = Math.sin((Math.PI * since) / options.bumpMs);
        bumper = k;
      }
    });

    state.tiles.forEach((tile, k) => {
      const p = (t - k * per) / options.enterMs;
      let x = tile.spawnX;
      let y = 0;
      let scaleX = 1;
      let scaleY = 1;
      let opacity = 1;

      if (p < 0) {
        opacity = 0;
        scaleX = scaleY = 0.4;
      } else if (p < 0.25) {
        const q = easeOutBack(p / 0.25);
        scaleX = scaleY = 0.4 + 0.6 * q;
        opacity = Math.min(1, p / 0.15);
      } else if (p < 1) {
        x = tile.spawnX + (tile.finalX - tile.spawnX) * easeInCubic((p - 0.25) / 0.75);
      } else {
        x = tile.finalX;
        if (k === bumper) scaleX = 1 - 0.16 * bump;
        else if (k < bumper) x += 9 * bump;
      }

      if (t > holdEnd) {
        const e = Math.min(1, Math.max(0, (t - holdEnd - tile.slot * 45) / options.exitMs));
        opacity = 1 - e;
        y = 26 * e * e;
        scaleX = scaleY = 1 - 0.12 * e;
      }

      tile.el.style.opacity = String(opacity);
      tile.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)})`;
    });
  }

  function showStill() {
    // Reduced motion: the full row, no movement.
    state.clock = state.timeline.arrived + options.bumpMs;
    render();
  }

  function tick(time) {
    const delta = state.last ? Math.min(time - state.last, 64) : 16;
    state.last = time;
    state.clock += delta;
    if (state.clock >= state.timeline.end) newRound();
    render();
    state.frame = requestAnimationFrame(tick);
  }

  function play() {
    if (state.frame || !state.visible || state.paused || reducedMotion.matches || !state.timeline) return;
    state.last = 0;
    state.frame = requestAnimationFrame(tick);
  }

  function stop() {
    cancelAnimationFrame(state.frame);
    state.frame = null;
  }

  function refresh() {
    if (!measure() && state.timeline) return;
    state.cache.clear();
    newRound();
    if (reducedMotion.matches) showStill();
    else render();
    play();
  }

  if (toggle) {
    toggle.hidden = reducedMotion.matches;
    toggle.addEventListener('click', () => {
      state.paused = !state.paused;
      toggle.setAttribute('aria-pressed', String(state.paused));
      toggle.querySelector('[data-icon-pause]').hidden = state.paused;
      toggle.querySelector('[data-icon-play]').hidden = !state.paused;
      toggle.querySelector('span').textContent = state.paused ? 'Play animation' : 'Pause animation';
      if (state.paused) stop();
      else play();
    });
  }

  reducedMotion.addEventListener('change', () => {
    if (toggle) toggle.hidden = reducedMotion.matches;
    stop();
    if (!state.timeline) return;
    if (reducedMotion.matches) showStill();
    else play();
  });

  new ResizeObserver(() => requestAnimationFrame(refresh)).observe(stage);

  new IntersectionObserver(([entry]) => {
    state.visible = entry.isIntersecting;
    if (state.visible) {
      refresh();
      play();
    } else {
      stop();
    }
  }).observe(stage);
}

async function initDock() {
  const root = document.querySelector('[data-dock]');
  if (!root) return;

  const loaded = await Promise.all(
    STRIP_IMAGES.map(async (item) => {
      const image = await loadImage(item.src);
      if (!image) return null;
      if (STRIP_OPTIONS.halftone && !canReadPixels(image)) return null;
      return { image, label: item.label || '', duotone: false };
    }),
  );
  const photos = loaded.filter(Boolean);
  createDock(root, photos.length ? photos : placeholderMoments(), STRIP_OPTIONS);
}

/* ---------- Start ---------- */

initHeader();
initNavigation();
initRouter();
setCurrentYear();
initSpeakerGrid();
initTeamPortraits();
initTalks();
initContact();
initHeroImage();
initFallbackImages();
initDock();
initBanner();
initNumbers();
initBackToTop();

// Wait for Inter so placeholder logos are drawn with the right font.
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
  initSponsorGrid();
  initHelixes();
});
