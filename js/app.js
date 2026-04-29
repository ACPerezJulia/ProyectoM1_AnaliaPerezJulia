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

const INTERACTIVE_SELECTOR = 'button, input, select, textarea, a, [contenteditable="true"]';

const UI_TEXT = {
  cardCopyHint: 'COPIAR',
  lockedBadge: '🔒 bloqueado',
  lockOn: '🔒 <span class="lock-label">on</span>',
  lockOff: '🔓 <span class="lock-label">off</span>',
  lockColor: 'Bloquear color',
  unlockColor: 'Desbloquear color',
  savePalette: '💾 Guardar paleta',
  savePaletteAria: 'Guardar paleta actual',
  exportPng: '🖼 Exportar PNG',
  exportPngAria: 'Exportar paleta como imagen PNG',
  exportNameAria: 'Nombre de la paleta para exportar',
  paletteNamePlaceholder: 'Nombre de la paleta...',
  cardAriaLabel: (code, isLocked) => `Color ${code}${isLocked ? ', bloqueado' : ''}. Clic para copiar.`,
  copiedToast: code => `Copiado: ${code}`,
  lockToast: isLocked => isLocked ? '🔒 Color bloqueado' : '🔓 Color desbloqueado',
  unlockAllToast: '🔓 Todos los colores desbloqueados',
  reorderedToast: '↕ Colores reordenados',
  exportToast: '🖼 PNG exportado'
};

const KEYBOARD_SHORTCUTS = {
  generatePaletteKey: ' '
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

/** Genera un objeto color HSL 100% aleatorio */
function randomColor() {
  return {
    h: Math.floor(Math.random() * 360),
    s: Math.floor(Math.random() * 101),
    l: Math.floor(Math.random() * 101),
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
    s: Math.floor(Math.random() * 101),
    l: Math.floor(Math.random() * 101),
    locked: false
  };
}

/** Mantiene h dentro de 0–359 */
function wrapHue(h) {
  return Math.round(((h % 360) + 360) % 360);
}

/**
 * Genera un array de `count` colores según la armonía activa.
 * Los colores bloqueados se preservan.
 */
function generateColors() {
  const count   = state.size;
  const harmony = state.harmony;

  // Si hay colores bloqueados, su tono ancla la armonía (análogos, complementarios, triádicos)
  const lockedColor = state.colors.find(c => c.locked);
  const anchorH     = lockedColor ? lockedColor.h : null;

  const generated = buildHarmony(harmony, count, anchorH);

  // Respeta los colores bloqueados
  state.colors = generated.map((color, i) =>
    state.colors[i] && state.colors[i].locked ? state.colors[i] : color
  );
}

/** Construye el array de colores según el tipo de armonía */
function buildHarmony(harmony, count, anchorH = null) {
  if (harmony === 'random') return buildRandom(count);
  if (harmony === 'analogous') return buildAnalogous(count, anchorH);
  if (harmony === 'complementary') return buildComplementary(count, anchorH);
  if (harmony === 'triadic') return buildTriadic(count, anchorH);
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
function buildAnalogous(count, anchorH = null) {
  const baseH  = anchorH !== null ? anchorH : Math.floor(Math.random() * 360);
  const spread = 60;
  const baseS  = Math.floor(10 + Math.random() * 91);  // 10–100%: evita gris absoluto
  const baseL  = Math.floor(8  + Math.random() * 85);  // 8–92%: evita negro/blanco puro
  return Array.from({ length: count }, (_, i) => {
    const step = count > 1 ? (spread / (count - 1)) : 0;
    const h    = wrapHue(baseH - spread / 2 + i * step);
    return {
      h,
      s: Math.min(100, Math.max(10, Math.floor(baseS + (Math.random() - 0.5) * 20))),
      l: Math.min(92,  Math.max(8,  Math.floor(baseL + (Math.random() - 0.5) * 20))),
      locked: false
    };
  });
}

/**
 * COMPLEMENTARIOS — dos polos opuestos (180°) más variaciones
 * de luminosidad y saturación alrededor de cada polo.
 * Mitad de colores en torno al tono base, mitad en torno al opuesto.
 */
function buildComplementary(count, anchorH = null) {
  const baseH  = anchorH !== null ? anchorH : Math.floor(Math.random() * 360);
  const compH  = wrapHue(baseH + 180);
  const half   = Math.ceil(count / 2);
  const baseS  = Math.floor(10 + Math.random() * 91);  // 10–100%
  const baseL  = Math.floor(8  + Math.random() * 85);  // 8–92%
  const colors = [];

  for (let i = 0; i < count; i++) {
    const h      = i < half ? baseH : compH;
    const jitter = (Math.random() - 0.5) * 20;
    colors.push({
      h: wrapHue(h + jitter),
      s: Math.min(100, Math.max(10, Math.floor(baseS + (Math.random() - 0.5) * 20))),
      l: Math.min(92,  Math.max(8,  Math.floor(baseL + (Math.random() - 0.5) * 20))),
      locked: false
    });
  }
  return colors;
}

/**
 * TRIÁDICOS — tres tonos equidistantes (120° entre sí).
 * Los colores se distribuyen en grupos alrededor de cada vértice.
 */
function buildTriadic(count, anchorH = null) {
  const baseH  = anchorH !== null ? anchorH : Math.floor(Math.random() * 360);
  const roots  = [baseH, wrapHue(baseH + 120), wrapHue(baseH + 240)];
  const baseS  = Math.floor(10 + Math.random() * 91);  // 10–100%
  const baseL  = Math.floor(8  + Math.random() * 85);  // 8–92%
  return Array.from({ length: count }, (_, i) => {
    const root   = roots[i % 3];
    const jitter = (Math.random() - 0.5) * 24;
    return {
      h: wrapHue(root + jitter),
      s: Math.min(100, Math.max(10, Math.floor(baseS + (Math.random() - 0.5) * 20))),
      l: Math.min(92,  Math.max(8,  Math.floor(baseL + (Math.random() - 0.5) * 20))),
      locked: false
    };
  });
}

/* ───────────────────────────────────────────
   RENDER
─────────────────────────────────────────── */

function updateUnlockAllVisibility() {
  const hasLocked = state.colors.some(c => c.locked);
  btnUnlockAll.classList.toggle('hidden', !hasLocked);
}

function updateCardAriaLabel(card, color) {
  const code = formatColor(color);
  card.setAttribute('aria-label', UI_TEXT.cardAriaLabel(code, color.locked));
}

function updateLockButton(lockBtn, isLocked) {
  lockBtn.innerHTML = isLocked ? UI_TEXT.lockOn : UI_TEXT.lockOff;
  lockBtn.setAttribute('aria-pressed', String(isLocked));
  lockBtn.setAttribute('aria-label', isLocked ? UI_TEXT.unlockColor : UI_TEXT.lockColor);
}

function isInteractiveTarget(el) {
  return el && el.closest(INTERACTIVE_SELECTOR);
}

function buildCardSwatch(color, textColor) {
  const swatch = document.createElement('div');
  swatch.className = 'card-swatch';
  // Nota: swatch.style.background es inline intencional — el color es dinámico (valor único por color generado)
  swatch.style.background = toHSLString(color);
  // cursor:pointer se define en CSS (.card-swatch), no hace falta inline

  const hint = document.createElement('div');
  hint.className = 'copy-hint';
  hint.setAttribute('aria-hidden', 'true');
  hint.textContent = UI_TEXT.cardCopyHint;
  hint.style.color = textColor;
  swatch.appendChild(hint);

  const lockBadge = document.createElement('div');
  lockBadge.className = 'lock-badge';
  lockBadge.setAttribute('aria-hidden', 'true');
  lockBadge.textContent = UI_TEXT.lockedBadge;
  swatch.appendChild(lockBadge);

  return swatch;
}

function buildCardInfo(code, isLocked) {
  const info = document.createElement('div');
  info.className = 'card-info';

  const codeEl = document.createElement('span');
  codeEl.className = 'card-code';
  codeEl.textContent = code;

  const lockBtn = document.createElement('button');
  lockBtn.className = 'btn-lock';
  updateLockButton(lockBtn, isLocked);

  info.appendChild(codeEl);
  info.appendChild(lockBtn);

  return { info, lockBtn };
}

function attachCardDragAndDrop(card, index) {
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

    renderGrid(true);
    showToast(UI_TEXT.reorderedToast);
  });
}

function createColorCard(color, index) {
  const textColor = textOnColor(color.l);
  const code = formatColor(color);

  const card = document.createElement('div');
  card.className = 'color-card' + (color.locked ? ' locked' : '');
  card.setAttribute('role', 'listitem');
  card.setAttribute('tabindex', '0');
  updateCardAriaLabel(card, color);

  // Drag & drop — todas las tarjetas son arrastrables (el bloqueo protege de regeneración, no de reordenamiento)
  card.setAttribute('draggable', 'true');
  card.classList.add('draggable');

  const swatch = buildCardSwatch(color, textColor);
  const { info, lockBtn } = buildCardInfo(code, color.locked);

  card.appendChild(swatch);
  card.appendChild(info);

  // Siempre copia en HEX — los diseñadores del cliente trabajan solo en ese formato
  const copyAction = () => {
    const currentColor = state.colors[index];
    const codeToCopy = hslToHex(currentColor.h, currentColor.s, currentColor.l);
    copyToClipboard(codeToCopy);
    // Flash visual
    card.classList.add('copied');
    card.addEventListener('animationend', () => card.classList.remove('copied'), { once: true });
    showToast(UI_TEXT.copiedToast(codeToCopy));
  };

  swatch.addEventListener('click', copyAction);

  card.addEventListener('keydown', e => {
    if (isInteractiveTarget(e.target)) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      copyAction();
    }
  });

  // Bloquear / desbloquear — muta el DOM sin re-render para evitar el salto visual
  lockBtn.addEventListener('click', e => {
    e.stopPropagation();
    const isNowLocked = !state.colors[index].locked;
    state.colors[index].locked = isNowLocked;

    // Actualizar clases de la card
    card.classList.toggle('locked', isNowLocked);

    // Actualizar botón y accesibilidad
    updateLockButton(lockBtn, isNowLocked);
    updateCardAriaLabel(card, state.colors[index]);
    updateUnlockAllVisibility();

    showToast(UI_TEXT.lockToast(isNowLocked));
  });

  attachCardDragAndDrop(card, index);
  return card;
}

function ensurePaletteActionBar() {
  // Botones de acción (solo si no existen ya)
  if (document.getElementById('btn-save-palette')) return;

  const actionBar = document.createElement('div');
  actionBar.id = 'palette-action-bar';
  actionBar.className = 'palette-action-bar';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.id = 'export-name-input';
  nameInput.className = 'export-name-input';
  nameInput.placeholder = UI_TEXT.paletteNamePlaceholder;
  nameInput.maxLength = 32;
  nameInput.setAttribute('aria-label', UI_TEXT.exportNameAria);

  const btnSave = document.createElement('button');
  btnSave.id = 'btn-save-palette';
  btnSave.className = 'btn-save-palette';
  btnSave.setAttribute('aria-label', UI_TEXT.savePaletteAria);
  btnSave.innerHTML = UI_TEXT.savePalette;
  btnSave.addEventListener('click', savePalette);

  const btnExport = document.createElement('button');
  btnExport.id = 'btn-export-palette';
  btnExport.className = 'btn-export-palette';
  btnExport.setAttribute('aria-label', UI_TEXT.exportPngAria);
  btnExport.innerHTML = UI_TEXT.exportPng;
  btnExport.addEventListener('click', exportPalettePNG);

  actionBar.appendChild(nameInput);
  actionBar.appendChild(btnSave);
  actionBar.appendChild(btnExport);
  grid.insertAdjacentElement('afterend', actionBar);
}

function renderGrid(skipAnim = false) {
  grid.innerHTML = '';

  updateUnlockAllVisibility();
  state.colors.forEach((color, index) => {
    const card = createColorCard(color, index);
    if (skipAnim) card.style.animation = 'none';
    grid.appendChild(card);
  });
  ensurePaletteActionBar();
}

/* ───────────────────────────────────────────
   EXPORTAR PALETA COMO PNG — Canvas API
─────────────────────────────────────────── */

function getExportName() {
  return (document.getElementById('export-name-input')?.value || '').trim();
}

function getExportMetrics(count, name) {
  // Dimensiones lógicas (lo que "parece" en pantalla)
  const STRIP_W  = 160;   // ancho de cada tira de color
  const SWATCH_H = 280;   // altura del bloque de color
  const LABEL_H  = 52;    // altura del área de texto
  const PADDING  = 12;    // espacio entre tiras
  const MARGIN   = 24;    // margen exterior
  const NAME_H   = name ? 40 : 0;   // altura para el nombre (si existe)
  const BRAND_H  = 36;               // altura para el branding inferior

  const canvasW = MARGIN * 2 + count * STRIP_W + (count - 1) * PADDING;
  const canvasH = MARGIN * 2 + NAME_H + SWATCH_H + LABEL_H + BRAND_H;

  return {
    STRIP_W,
    SWATCH_H,
    LABEL_H,
    PADDING,
    MARGIN,
    NAME_H,
    BRAND_H,
    canvasW,
    canvasH
  };
}

function createExportCanvas(metrics) {
  // Factor de escala para pantallas HiDPI/Retina — texto nítido
  const DPR = window.devicePixelRatio || 1;
  const canvas  = document.createElement('canvas');
  canvas.width  = metrics.canvasW * DPR;
  canvas.height = metrics.canvasH * DPR;

  const ctx = canvas.getContext('2d');
  // Escalar el contexto para que todo dibuje al doble de resolución
  ctx.scale(DPR, DPR);

  return { canvas, ctx };
}

function drawExportBackground(ctx, metrics, isLight) {
  ctx.fillStyle = isLight ? '#f5f4f0' : '#17171b';
  ctx.fillRect(0, 0, metrics.canvasW, metrics.canvasH);
}

function drawExportName(ctx, name, metrics, isLight) {
  if (!name) return;
  ctx.fillStyle    = isLight ? '#1a1a1e' : '#e8e8f0';
  ctx.font         = '400 italic 17px "Playfair Display", Georgia, serif';
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, metrics.MARGIN, metrics.MARGIN + metrics.NAME_H / 2);
}

function drawExportSwatches(ctx, colors, metrics, isLight) {
  colors.forEach((color, index) => {
    const x = metrics.MARGIN + index * (metrics.STRIP_W + metrics.PADDING);
    const y = metrics.MARGIN + metrics.NAME_H;

    // Swatch con esquinas redondeadas solo arriba
    const hsl = `hsl(${color.h}, ${color.s}%, ${color.l}%)`;
    ctx.fillStyle = hsl;
    roundRect(ctx, x, y, metrics.STRIP_W, metrics.SWATCH_H, { tl: 14, tr: 14, bl: 0, br: 0 });
    ctx.fill();

    // Fondo de la etiqueta — mismo color que el fondo pero ligeramente diferente
    ctx.fillStyle = isLight ? '#ffffff' : '#0e0e10';
    roundRect(ctx, x, y + metrics.SWATCH_H, metrics.STRIP_W, metrics.LABEL_H, { tl: 0, tr: 0, bl: 14, br: 14 });
    ctx.fill();

    // Separador sutil entre swatch y etiqueta
    ctx.fillStyle = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';
    ctx.fillRect(x, y + metrics.SWATCH_H, metrics.STRIP_W, 1);

    // Código del color
    const code = formatColor(color);
    ctx.fillStyle  = isLight ? '#1a1a1e' : '#e8e8f0';
    ctx.font       = '500 13px "DM Mono", "Courier New", monospace';
    ctx.textAlign  = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(code, x + metrics.STRIP_W / 2, y + metrics.SWATCH_H + metrics.LABEL_H / 2);
  });
}

function drawExportBranding(ctx, metrics, isLight) {
  ctx.fillStyle    = isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)';
  ctx.font         = '400 11px "DM Mono", "Courier New", monospace';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    'Paleta generada por Colorfly Studio',
    metrics.canvasW / 2,
    metrics.MARGIN + metrics.NAME_H + metrics.SWATCH_H + metrics.LABEL_H + metrics.BRAND_H / 2
  );
}

function downloadExportCanvas(canvas, name) {
  const link    = document.createElement('a');
  link.href     = canvas.toDataURL('image/png');
  const slug    = name ? `-${name.toLowerCase().replace(/\s+/g, '-')}` : '';
  link.download = `paleta${slug}-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportPalettePNG() {
  const colors = state.colors;
  const name = getExportName();
  const metrics = getExportMetrics(colors.length, name);
  const { canvas, ctx } = createExportCanvas(metrics);

  const isLight = document.body.classList.contains('light');
  drawExportBackground(ctx, metrics, isLight);
  drawExportName(ctx, name, metrics, isLight);
  drawExportSwatches(ctx, colors, metrics, isLight);
  drawExportBranding(ctx, metrics, isLight);

  downloadExportCanvas(canvas, name);

  showToast(UI_TEXT.exportToast);
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
  const nameInput = document.getElementById('export-name-input');
  const entry = {
    id: Date.now(),
    name: nameInput ? nameInput.value.trim() : '',
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

function handleHarmonyChange(e) {
  const select = e.currentTarget;
  state.harmony = select.value;
  generateColors();
  renderGrid();
  showToast(`🎨 Armonía: ${select.options[select.selectedIndex].text}`);
}

function handleSizeClick(e) {
  const btn = e.currentTarget;
  state.size = parseInt(btn.dataset.size, 10);

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
}

function handleFormatClick(e) {
  const btn = e.currentTarget;
  state.format = btn.dataset.format;

  document.querySelectorAll('[data-format]').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-pressed', 'false');
  });
  btn.classList.add('active');
  btn.setAttribute('aria-pressed', 'true');

  renderGrid(); // rerender para actualizar código mostrado
}

function handleGenerateClick() {
  generateColors();
  renderGrid();
  showToast('🎨 ¡Paleta generada!');
}

function handleUnlockAllClick() {
  state.colors.forEach(c => c.locked = false);
  renderGrid();
  showToast(UI_TEXT.unlockAllToast);
}

function handleGlobalShortcut(e) {
  const active = document.activeElement;
  if (isInteractiveTarget(active)) return;
  if (e.key === KEYBOARD_SHORTCUTS.generatePaletteKey) {
    e.preventDefault();
    btnGenerate.click();
  }
}

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

  const nameInput = document.getElementById('export-name-input');
  if (nameInput) nameInput.value = palette.name || '';

  renderGrid();
  const name = palette.name ? `"${palette.name}"` : 'la paleta';
  showToast(`✅ Cargada ${name}`);
  // Scroll suave hacia arriba para ver la paleta
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

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

function handleThemeToggle() {
  const isLight = !document.body.classList.contains('light');
  localStorage.setItem(LS_THEME, isLight ? 'light' : 'dark');
  applyTheme(isLight);
}

/* ───────────────────────────────────────────
   EVENTOS
─────────────────────────────────────────── */
function bindEvents() {
  document.getElementById('select-harmony').addEventListener('change', handleHarmonyChange);

  document.querySelectorAll('[data-size]').forEach(btn => {
    btn.addEventListener('click', handleSizeClick);
  });

  document.querySelectorAll('[data-format]').forEach(btn => {
    btn.addEventListener('click', handleFormatClick);
  });

  btnGenerate.addEventListener('click', handleGenerateClick);
  btnUnlockAll.addEventListener('click', handleUnlockAllClick);
  btnClearAll.addEventListener('click', clearAllSaved);
  document.addEventListener('keydown', handleGlobalShortcut);
  btnTheme.addEventListener('click', handleThemeToggle);
}

/* ───────────────────────────────────────────
   INIT
─────────────────────────────────────────── */
function init() {
  bindEvents();

  // Restaurar tema guardado
  const savedTheme = localStorage.getItem(LS_THEME);
  if (savedTheme === 'light') applyTheme(true);

  loadSaved();
  generateColors();
  renderGrid();
  renderSaved();
}

init();
