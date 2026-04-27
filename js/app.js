/* =============================================
   PALETA — app.js
   Generador de colores aleatorios
   Vanilla JS / sin frameworks / sin fetch
   ============================================= */

'use strict';

/* ───────────────────────────────────────────
   ESTADO DE LA APLICACIÓN
─────────────────────────────────────────── */
const state = {
  size:    6,         // número de colores activos
  format: 'hex',     // 'hex' | 'hsl'
  colors: [],        // [{ h, s, l, locked }]
  saved:  []         // paletas guardadas [{ id, colors[], date }]
};

/* ───────────────────────────────────────────
   REFERENCIAS AL DOM
─────────────────────────────────────────── */
const grid         = document.getElementById('palette-grid');
const savedList    = document.getElementById('saved-list');
const emptyState   = document.getElementById('empty-state');
const btnGenerate  = document.getElementById('btn-generate');
const btnClearAll  = document.getElementById('btn-clear-all');
const btnUnlockAll = document.getElementById('btn-unlock-all');
const toast        = document.getElementById('toast');

/* ───────────────────────────────────────────
   UTILIDADES DE COLOR
─────────────────────────────────────────── */

/** Genera un objeto color HSL aleatorio */
function randomColor() {
  return {
    h: Math.floor(Math.random() * 360),
    s: Math.floor(30 + Math.random() * 65),   // 30–95% para evitar gris absoluto
    l: Math.floor(30 + Math.random() * 45),   // 30–75% para evitar blanco/negro puro
    locked: false
  };
}

/** Convierte H, S, L a cadena CSS HSL */
function toHSLString({ h, s, l }) {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

/** Convierte HSL a HEX */
function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/** Devuelve el código en el formato activo */
function formatColor(color) {
  return state.format === 'hex'
    ? hslToHex(color.h, color.s, color.l)
    : `hsl(${color.h}, ${color.s}%, ${color.l}%)`;
}

/** Decide si el texto sobre el color debe ser oscuro o claro */
function textOnColor(l) {
  return l > 55 ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)';
}

/* ───────────────────────────────────────────
   GENERACIÓN DE PALETA
─────────────────────────────────────────── */

/** Rellena state.colors respetando los bloqueados */
function generateColors() {
  const newColors = [];
  for (let i = 0; i < state.size; i++) {
    if (state.colors[i] && state.colors[i].locked) {
      // conserva el color bloqueado
      newColors.push(state.colors[i]);
    } else {
      newColors.push(randomColor());
    }
  }
  state.colors = newColors;
}

/* ───────────────────────────────────────────
   RENDER
─────────────────────────────────────────── */

function renderGrid() {
  grid.innerHTML = '';

  // Mostrar/ocultar "Desbloquear todo" según si hay algún color bloqueado
  const hasLocked = state.colors.some(c => c.locked);
  btnUnlockAll.style.display = hasLocked ? '' : 'none';

  state.colors.forEach((color, index) => {
    const bg  = toHSLString(color);
    const txt = textOnColor(color.l);
    const code = formatColor(color);

    // Card
    const card = document.createElement('div');
    card.className = 'color-card' + (color.locked ? ' locked' : '');
    card.setAttribute('role', 'listitem');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Color ${code}${color.locked ? ', bloqueado' : ''}. Clic para copiar.`);

    // Swatch
    const swatch = document.createElement('div');
    swatch.className = 'card-swatch';
    swatch.style.background = bg;

    // Hint de copia
    const hint = document.createElement('div');
    hint.className = 'copy-hint';
    hint.setAttribute('aria-hidden', 'true');
    hint.textContent = 'COPIAR';
    hint.style.color = txt;
    swatch.appendChild(hint);

    // Badge de bloqueo (visible cuando está locked)
    const lockBadge = document.createElement('div');
    lockBadge.className = 'lock-badge';
    lockBadge.setAttribute('aria-hidden', 'true');
    lockBadge.innerHTML = '🔒 bloqueado';
    swatch.appendChild(lockBadge);

    // Info bar
    const info = document.createElement('div');
    info.className = 'card-info';

    const codeEl = document.createElement('span');
    codeEl.className = 'card-code';
    codeEl.textContent = code;

    const lockBtn = document.createElement('button');
    lockBtn.className = 'btn-lock';
    lockBtn.setAttribute('aria-label', color.locked ? 'Desbloquear color' : 'Bloquear color');
    lockBtn.setAttribute('aria-pressed', String(color.locked));
    lockBtn.innerHTML = color.locked
      ? `🔒 <span class="lock-label">on</span>`
      : `🔓 <span class="lock-label">off</span>`;

    info.appendChild(codeEl);
    info.appendChild(lockBtn);

    card.appendChild(swatch);
    card.appendChild(info);
    grid.appendChild(card);

    /* ─── EVENTOS DE LA CARD ─── */

    // Copiar según el formato activo (HEX o HSL)
    const copyAction = () => {
      const codeToCopy = formatColor(color);
      copyToClipboard(codeToCopy);
      // Flash visual
      card.classList.add('copied');
      card.addEventListener('animationend', () => card.classList.remove('copied'), { once: true });
      showToast(`Copiado: ${codeToCopy}`);
    };

    swatch.addEventListener('click', copyAction);
    swatch.style.cursor = 'pointer';

    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); copyAction(); }
    });

    // Bloquear / desbloquear
    lockBtn.addEventListener('click', e => {
      e.stopPropagation();
      state.colors[index].locked = !state.colors[index].locked;
      showToast(state.colors[index].locked ? '🔒 Color bloqueado' : '🔓 Color desbloqueado');
      renderGrid();
    });
  });

  // Botón de guardar (solo si no existe ya)
  if (!document.getElementById('btn-save-palette')) {
    const btnSave = document.createElement('button');
    btnSave.id = 'btn-save-palette';
    btnSave.className = 'btn-save-palette';
    btnSave.setAttribute('aria-label', 'Guardar paleta actual');
    btnSave.innerHTML = '💾 Guardar paleta';
    btnSave.addEventListener('click', savePalette);
    grid.insertAdjacentElement('afterend', btnSave);
  }
}

/* ───────────────────────────────────────────
   CLIPBOARD
─────────────────────────────────────────── */

function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const el = document.createElement('textarea');
  el.value = text;
  el.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
  document.body.appendChild(el);
  el.select();
  try { document.execCommand('copy'); } catch (e) { /* silencioso */ }
  document.body.removeChild(el);
}

/* ───────────────────────────────────────────
   TOAST
─────────────────────────────────────────── */

let toastTimer = null;

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

/* ───────────────────────────────────────────
   GUARDAR / CARGAR PALETAS — localStorage
─────────────────────────────────────────── */

const LS_KEY = 'paleta_saved_v1';

function loadSaved() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    state.saved = raw ? JSON.parse(raw) : [];
  } catch {
    state.saved = [];
  }
}

function persistSaved() {
  localStorage.setItem(LS_KEY, JSON.stringify(state.saved));
}

function savePalette() {
  const entry = {
    id: Date.now(),
    name: '',
    colors: state.colors.map(c => ({ h: c.h, s: c.s, l: c.l })),
    date: new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
  };
  state.saved.unshift(entry);
  persistSaved();
  renderSaved();
  showToast('✅ Paleta guardada');
}

function deleteSaved(id) {
  state.saved = state.saved.filter(p => p.id !== id);
  persistSaved();
  renderSaved();
  showToast('🗑 Paleta eliminada');
}

function clearAllSaved() {
  state.saved = [];
  persistSaved();
  renderSaved();
  showToast('🧹 Paletas eliminadas');
}

function renderSaved() {
  savedList.innerHTML = '';

  if (state.saved.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  state.saved.forEach(palette => {
    const row = document.createElement('div');
    row.className = 'saved-palette';
    row.setAttribute('role', 'article');
    row.setAttribute('aria-label', `Paleta guardada con ${palette.colors.length} colores`);

    // Swatches
    const swatchGroup = document.createElement('div');
    swatchGroup.className = 'saved-swatches';
    palette.colors.forEach(c => {
      const sw = document.createElement('div');
      sw.className = 'saved-swatch';
      sw.style.background = toHSLString(c);
      sw.setAttribute('title', hslToHex(c.h, c.s, c.l));
      swatchGroup.appendChild(sw);
    });

    // Meta info
    const meta = document.createElement('span');
    meta.className = 'saved-meta';
    meta.textContent = `${palette.colors.length} · ${palette.date}`;

    // Nombre editable
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'palette-name-input';
    nameInput.placeholder = 'sin nombre';
    nameInput.value = palette.name || '';
    nameInput.setAttribute('aria-label', 'Nombre de la paleta');
    nameInput.maxLength = 24;
    nameInput.addEventListener('input', () => {
      const idx = state.saved.findIndex(p => p.id === palette.id);
      if (idx !== -1) { state.saved[idx].name = nameInput.value; persistSaved(); }
    });

    // Botón cargar paleta
    const loadBtn = document.createElement('button');
    loadBtn.className = 'btn-load-palette';
    loadBtn.setAttribute('aria-label', 'Cargar esta paleta como activa');
    loadBtn.title = 'Cargar paleta';
    loadBtn.textContent = '↩';
    loadBtn.addEventListener('click', () => loadPalette(palette));

    // Delete btn
    const delBtn = document.createElement('button');
    delBtn.className = 'btn-delete-saved';
    delBtn.setAttribute('aria-label', 'Eliminar paleta guardada');
    delBtn.textContent = '✕';
    delBtn.addEventListener('click', () => deleteSaved(palette.id));

    row.appendChild(swatchGroup);
    row.appendChild(nameInput);
    row.appendChild(meta);
    row.appendChild(loadBtn);
    row.appendChild(delBtn);
    savedList.appendChild(row);
  });
}

/* ───────────────────────────────────────────
   CONTROLES — Tamaño y formato
─────────────────────────────────────────── */

// Botones segmentados (tamaño)
document.querySelectorAll('[data-size]').forEach(btn => {
  btn.addEventListener('click', () => {
    state.size = parseInt(btn.dataset.size);
    // UI active state
    document.querySelectorAll('[data-size]').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    // Rellena o recorta colors sin regenerar los bloqueados
    while (state.colors.length < state.size) state.colors.push(randomColor());
    state.colors = state.colors.slice(0, state.size);
    renderGrid();
  });
});

// Botones segmentados (formato)
document.querySelectorAll('[data-format]').forEach(btn => {
  btn.addEventListener('click', () => {
    state.format = btn.dataset.format;
    document.querySelectorAll('[data-format]').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    renderGrid(); // rerender para actualizar código mostrado
  });
});

/* ───────────────────────────────────────────
   BOTÓN GENERAR
─────────────────────────────────────────── */
btnGenerate.addEventListener('click', () => {
  generateColors();
  renderGrid();
  showToast('🎨 ¡Paleta generada!');
});

/* ───────────────────────────────────────────
   BOTÓN DESBLOQUEAR TODO
─────────────────────────────────────────── */
btnUnlockAll.addEventListener('click', () => {
  state.colors.forEach(c => c.locked = false);
  renderGrid();
  showToast('🔓 Todos los colores desbloqueados');
});

/* ───────────────────────────────────────────
   CARGAR PALETA GUARDADA
─────────────────────────────────────────── */
function loadPalette(palette) {
  // Carga los colores guardados como nueva paleta activa (sin bloqueo)
  state.colors = palette.colors.map(c => ({ ...c, locked: false }));
  state.size   = state.colors.length;

  // Sincroniza el botón de tamaño activo si coincide
  document.querySelectorAll('[data-size]').forEach(b => {
    const match = parseInt(b.dataset.size) === state.size;
    b.classList.toggle('active', match);
    b.setAttribute('aria-pressed', String(match));
  });

  renderGrid();
  const name = palette.name ? `"${palette.name}"` : 'la paleta';
  showToast(`✅ Cargada ${name}`);
  // Scroll suave hacia arriba para ver la paleta
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ───────────────────────────────────────────
   BOTÓN LIMPIAR TODO
─────────────────────────────────────────── */
btnClearAll.addEventListener('click', clearAllSaved);: barra espaciadora o "G"
   (cuando el foco no está en un botón/input)
─────────────────────────────────────────── */
document.addEventListener('keydown', e => {
  const tag = document.activeElement.tagName;
  if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'TEXTAREA') return;
  if (e.key === ' ' || e.key === 'g' || e.key === 'G') {
    e.preventDefault();
    btnGenerate.click();
  }
});

/* ───────────────────────────────────────────
   TEMA CLARO / OSCURO
─────────────────────────────────────────── */
const btnTheme  = document.getElementById('btn-theme');
const themeIcon = document.getElementById('theme-icon');
const LS_THEME  = 'paleta_theme';

function applyTheme(light) {
  document.body.classList.toggle('light', light);
  themeIcon.textContent = light ? '🌙' : '☀️';
  btnTheme.setAttribute('aria-label', light ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro');
}

btnTheme.addEventListener('click', () => {
  const isLight = !document.body.classList.contains('light');
  localStorage.setItem(LS_THEME, isLight ? 'light' : 'dark');
  applyTheme(isLight);
});

/* ───────────────────────────────────────────
   INIT
─────────────────────────────────────────── */
function init() {
  // Restaurar tema guardado
  const savedTheme = localStorage.getItem(LS_THEME);
  if (savedTheme === 'light') applyTheme(true);

  loadSaved();
  generateColors();
  renderGrid();
  renderSaved();
}

init();
