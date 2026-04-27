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
  size:    6,           // número de colores activos
  format: 'hex',       // 'hex' | 'hsl'
  harmony: 'random',   // 'random' | 'analogous' | 'complementary' | 'triadic'
  colors: [],          // [{ h, s, l, locked }]
  saved:  []           // paletas guardadas [{ id, colors[], date }]
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
   GENERACIÓN DE PALETA Y ARMONÍAS
─────────────────────────────────────────── */

/**
 * Genera un color base con s y l aleatorios dentro de rangos seguros.
 * El tono (h) se puede pasar o se genera aleatorio.
 */
function makeColor(h = Math.floor(Math.random() * 360)) {
  return {
    h,
    s: Math.floor(40 + Math.random() * 50),   // 40–90%
    l: Math.floor(35 + Math.random() * 35),   // 35–70%
    locked: false
  };
}

/** Mantiene h dentro de 0–359 */
function wrapHue(h) {
  return ((h % 360) + 360) % 360;
}

/**
 * Genera un array de `count` colores según la armonía activa.
 * Los colores bloqueados se preservan.
 */
function generateColors() {
  const count     = state.size;
  const harmony   = state.harmony;
  const generated = buildHarmony(harmony, count);

  // Respeta los colores bloqueados
  state.colors = generated.map((color, i) =>
    state.colors[i] && state.colors[i].locked ? state.colors[i] : color
  );
}

/** Construye el array de colores según el tipo de armonía */
function buildHarmony(harmony, count) {
  if (harmony === 'random') return buildRandom(count);
  if (harmony === 'analogous') return buildAnalogous(count);
  if (harmony === 'complementary') return buildComplementary(count);
  if (harmony === 'triadic') return buildTriadic(count);
  return buildRandom(count);
}

/** ALEATORIO — cada color completamente independiente */
function buildRandom(count) {
  return Array.from({ length: count }, () => makeColor());
}

/**
 * ANÁLOGOS — colores vecinos en la rueda.
 * Se parte de un tono base y se distribuyen los demás
 * en un arco de ±60° alrededor de él, con leve variación
 * de s y l para que no sean todos idénticos.
 */
function buildAnalogous(count) {
  const baseH  = Math.floor(Math.random() * 360);
  const spread = 60;  // arco total en grados
  return Array.from({ length: count }, (_, i) => {
    const step = count > 1 ? (spread / (count - 1)) : 0;
    const h    = wrapHue(baseH - spread / 2 + i * step);
    return {
      h,
      s: Math.floor(50 + Math.random() * 35),
      l: Math.floor(38 + Math.random() * 28),
      locked: false
    };
  });
}

/**
 * COMPLEMENTARIOS — dos polos opuestos (180°) más variaciones
 * de luminosidad y saturación alrededor de cada polo.
 * Mitad de colores en torno al tono base, mitad en torno al opuesto.
 */
function buildComplementary(count) {
  const baseH  = Math.floor(Math.random() * 360);
  const compH  = wrapHue(baseH + 180);
  const half   = Math.ceil(count / 2);
  const colors = [];

  for (let i = 0; i < count; i++) {
    const h    = i < half ? baseH : compH;
    const jitter = (Math.random() - 0.5) * 20;  // ±10° de variación
    colors.push({
      h: wrapHue(h + jitter),
      s: Math.floor(50 + Math.random() * 40),
      l: Math.floor(30 + Math.random() * 40),
      locked: false
    });
  }
  return colors;
}

/**
 * TRIÁDICOS — tres tonos equidistantes (120° entre sí).
 * Los colores se distribuyen en grupos alrededor de cada vértice.
 */
function buildTriadic(count) {
  const baseH   = Math.floor(Math.random() * 360);
  const roots   = [baseH, wrapHue(baseH + 120), wrapHue(baseH + 240)];
  return Array.from({ length: count }, (_, i) => {
    const root   = roots[i % 3];
    const jitter = (Math.random() - 0.5) * 24;  // ±12° de variación
    return {
      h: wrapHue(root + jitter),
      s: Math.floor(45 + Math.random() * 45),
      l: Math.floor(35 + Math.random() * 35),
      locked: false
    };
  });
}

/* ───────────────────────────────────────────
   RENDER
─────────────────────────────────────────── */

function renderGrid() {
  grid.innerHTML = '';

  // Mostrar/ocultar "Desbloquear todo" según si hay algún color bloqueado
  const hasLocked = state.colors.some(c => c.locked);
  btnUnlockAll.classList.toggle('hidden', !hasLocked);

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

    // Drag & drop — todas las tarjetas son arrastrables (el bloqueo protege de regeneración, no de reordenamiento)
    card.setAttribute('draggable', 'true');
    card.classList.add('draggable');

    // Swatch
    const swatch = document.createElement('div');
    swatch.className = 'card-swatch';
    // Nota: swatch.style.background es inline intencional — el color es dinámico (valor único por color generado)
    swatch.style.background = bg;
    // cursor:pointer se define en CSS (.card-swatch), no hace falta inline

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
    lockBadge.textContent = '🔒 bloqueado';
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

    // Siempre copia en HEX — los diseñadores del cliente trabajan solo en ese formato
    const copyAction = () => {
      const codeToCopy = hslToHex(color.h, color.s, color.l);
      copyToClipboard(codeToCopy);
      // Flash visual
      card.classList.add('copied');
      card.addEventListener('animationend', () => card.classList.remove('copied'), { once: true });
      showToast(`Copiado: ${codeToCopy}`);
    };

    swatch.addEventListener('click', copyAction);

    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); copyAction(); }
    });

    // Bloquear / desbloquear — muta el DOM sin re-render para evitar el salto visual
    lockBtn.addEventListener('click', e => {
      e.stopPropagation();
      const isNowLocked = !state.colors[index].locked;
      state.colors[index].locked = isNowLocked;

      // Actualizar clases de la card
      card.classList.toggle('locked', isNowLocked);

      // Actualizar botón
      lockBtn.innerHTML = isNowLocked
        ? `🔒 <span class="lock-label">on</span>`
        : `🔓 <span class="lock-label">off</span>`;
      lockBtn.setAttribute('aria-pressed', String(isNowLocked));
      lockBtn.setAttribute('aria-label', isNowLocked ? 'Desbloquear color' : 'Bloquear color');

      // Actualizar aria-label de la card
      const currentCode = formatColor(state.colors[index]);
      card.setAttribute('aria-label', `Color ${currentCode}${isNowLocked ? ', bloqueado' : ''}. Clic para copiar.`);

      // Mostrar/ocultar botón "Desbloquear todo"
      const hasLocked = state.colors.some(c => c.locked);
      btnUnlockAll.classList.toggle('hidden', !hasLocked);

      showToast(isNowLocked ? '🔒 Color bloqueado' : '🔓 Color desbloqueado');
    });

    /* ─── DRAG & DROP ─── */
    card.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', String(index));
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => card.classList.add('dragging'), 0);
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    });

    card.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      card.classList.add('drag-over');
    });

    card.addEventListener('dragleave', () => {
      card.classList.remove('drag-over');
    });

    card.addEventListener('drop', e => {
      e.preventDefault();
      card.classList.remove('drag-over');

      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
      const toIndex   = index;

      if (fromIndex === toIndex) return;

      // Intercambiar en state.colors
      const temp              = state.colors[fromIndex];
      state.colors[fromIndex] = state.colors[toIndex];
      state.colors[toIndex]   = temp;

      renderGrid();
      showToast('↕ Colores reordenados');
    });
  });

  // Botones de acción (solo si no existen ya)
  if (!document.getElementById('btn-save-palette')) {
    const actionBar = document.createElement('div');
    actionBar.id = 'palette-action-bar';
    actionBar.className = 'palette-action-bar';

    const btnSave = document.createElement('button');
    btnSave.id = 'btn-save-palette';
    btnSave.className = 'btn-save-palette';
    btnSave.setAttribute('aria-label', 'Guardar paleta actual');
    btnSave.innerHTML = '💾 Guardar paleta';
    btnSave.addEventListener('click', savePalette);

    const btnExport = document.createElement('button');
    btnExport.id = 'btn-export-palette';
    btnExport.className = 'btn-export-palette';
    btnExport.setAttribute('aria-label', 'Exportar paleta como imagen PNG');
    btnExport.innerHTML = '🖼 Exportar PNG';
    btnExport.addEventListener('click', exportPalettePNG);

    actionBar.appendChild(btnSave);
    actionBar.appendChild(btnExport);
    grid.insertAdjacentElement('afterend', actionBar);
  }
}

/* ───────────────────────────────────────────
   EXPORTAR PALETA COMO PNG — Canvas API
─────────────────────────────────────────── */

function exportPalettePNG() {
  const colors = state.colors;
  const count  = colors.length;

  // Dimensiones lógicas (lo que "parece" en pantalla)
  const STRIP_W  = 160;   // ancho de cada tira de color
  const SWATCH_H = 280;   // altura del bloque de color
  const LABEL_H  = 52;    // altura del área de texto
  const PADDING  = 12;    // espacio entre tiras
  const MARGIN   = 24;    // margen exterior

  const canvasW = MARGIN * 2 + count * STRIP_W + (count - 1) * PADDING;
  const canvasH = MARGIN * 2 + SWATCH_H + LABEL_H;

  // Factor de escala para pantallas HiDPI/Retina — texto nítido
  const DPR = window.devicePixelRatio || 1;

  const canvas  = document.createElement('canvas');
  canvas.width  = canvasW * DPR;
  canvas.height = canvasH * DPR;

  const ctx = canvas.getContext('2d');

  // Escalar el contexto para que todo dibuje al doble de resolución
  ctx.scale(DPR, DPR);

  // Fondo según tema activo
  const isLight = document.body.classList.contains('light');
  ctx.fillStyle = isLight ? '#f5f4f0' : '#17171b';
  ctx.fillRect(0, 0, canvasW, canvasH);

  colors.forEach((color, index) => {
    const x = MARGIN + index * (STRIP_W + PADDING);
    const y = MARGIN;

    // Swatch con esquinas redondeadas solo arriba
    const hsl = `hsl(${color.h}, ${color.s}%, ${color.l}%)`;
    ctx.fillStyle = hsl;
    roundRect(ctx, x, y, STRIP_W, SWATCH_H, { tl: 14, tr: 14, bl: 0, br: 0 });
    ctx.fill();

    // Fondo de la etiqueta — mismo color que el fondo pero ligeramente diferente
    ctx.fillStyle = isLight ? '#ffffff' : '#0e0e10';
    roundRect(ctx, x, y + SWATCH_H, STRIP_W, LABEL_H, { tl: 0, tr: 0, bl: 14, br: 14 });
    ctx.fill();

    // Separador sutil entre swatch y etiqueta
    ctx.fillStyle = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';
    ctx.fillRect(x, y + SWATCH_H, STRIP_W, 1);

    // Código del color
    const code = formatColor(color);
    ctx.fillStyle  = isLight ? '#1a1a1e' : '#e8e8f0';
    ctx.font       = '500 13px "DM Mono", "Courier New", monospace';
    ctx.textAlign  = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(code, x + STRIP_W / 2, y + SWATCH_H + LABEL_H / 2);
  });

  // Descargar como PNG
  const link    = document.createElement('a');
  link.href     = canvas.toDataURL('image/png');
  link.download = `paleta-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('🖼 PNG exportado');
}

/** Rectángulo con radio independiente por esquina */
function roundRect(ctx, x, y, w, h, r) {
  const { tl = 0, tr = 0, bl = 0, br = 0 } = typeof r === 'number'
    ? { tl: r, tr: r, bl: r, br: r }
    : r;
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.quadraticCurveTo(x + w, y,         x + w, y + tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.quadraticCurveTo(x + w, y + h,     x + w - br, y + h);
  ctx.lineTo(x + bl, y + h);
  ctx.quadraticCurveTo(x,     y + h,     x, y + h - bl);
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x,     y,         x + tl, y);
  ctx.closePath();
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
    btnClearAll.classList.add('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  btnClearAll.classList.remove('hidden');

  state.saved.forEach(palette => {
    const row = document.createElement('li');
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

// Botones segmentados (armonía)
document.querySelectorAll('[data-harmony]').forEach(btn => {
  btn.addEventListener('click', () => {
    state.harmony = btn.dataset.harmony;
    document.querySelectorAll('[data-harmony]').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    generateColors();
    renderGrid();
    showToast(`🎨 Armonía: ${btn.textContent.trim()}`);
  });
});

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
btnClearAll.addEventListener('click', clearAllSaved);

/* ───────────────────────────────────────────
   SHORTCUT TECLADO: barra espaciadora o "G"
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
