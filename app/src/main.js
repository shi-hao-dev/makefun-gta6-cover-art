// Wires the editor: pick photos per panel, drag to reposition, zoom to crop,
// type the caption, pick a grade and a post size, export the cover as a PNG.
// Photos are read from the person's own machine with object URLs and never
// uploaded anywhere. A `?shot=` query sets up a fixed scene for a screenshot
// instead (see ./shots.js).
import { drawCover, panelRects, SIZES, GRADES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const tagInput = document.getElementById('tag');
const status = document.getElementById('status');
const panelName = document.getElementById('panel-name');
const zoomInput = document.getElementById('zoom');
const zoomValue = document.getElementById('zoom-value');

const state = {
  size: 'portrait',
  grade: 'sunset',
  title: 'Vice City Nights',
  subtitle: 'Your story, in neon',
  tag: 'Vice City',
  panels: [
    { photo: null, zoom: 1, ox: 0, oy: 0 },
    { photo: null, zoom: 1, ox: 0, oy: 0 },
    { photo: null, zoom: 1, ox: 0, oy: 0 },
  ],
};
let selected = 0;

function selectPanel(index) {
  selected = index;
  redraw();
}

function redraw() {
  drawCover(canvas, state);
  syncPanelControls();
}

function syncPanelControls() {
  const panel = state.panels[selected];
  panelName.textContent = `Panel ${selected + 1} of 3 — ${panel.photo ? 'photo loaded' : 'empty'}`;
  zoomInput.value = String(Math.round((panel.zoom || 1) * 100));
  zoomValue.textContent = `${Math.round((panel.zoom || 1) * 100)}%`;
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function setPanelPhoto(index, url) {
  try {
    state.panels[index].photo = await loadImage(url);
    state.panels[index].zoom = 1;
    state.panels[index].ox = 0;
    state.panels[index].oy = 0;
    selected = index;
    redraw();
  } catch {
    status.textContent = 'That file could not be read as a photo.';
  }
}

// Per-panel file inputs: photos stay on the person's machine.
document.querySelectorAll('[data-panel-file]').forEach((input) => {
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await setPanelPhoto(Number(input.dataset.panelFile), URL.createObjectURL(file));
    status.textContent = `Panel ${Number(input.dataset.panelFile) + 1}: ${file.name}`;
  });
});

// "Same photo in every panel": copies the selected panel's photo to the rest.
document.getElementById('fill-all').addEventListener('click', () => {
  const source = state.panels[selected];
  if (!source.photo) {
    status.textContent = 'Load a photo into the selected panel first.';
    return;
  }
  state.panels.forEach((panel, i) => {
    if (i !== selected) {
      panel.photo = source.photo;
      panel.zoom = 1;
      panel.ox = 0;
      panel.oy = 0;
    }
  });
  redraw();
  status.textContent = 'One photo now fills all three panels.';
});

// Demo photos shipped with the app, free to use.
document.getElementById('fill-samples').addEventListener('click', async () => {
  await setPanelPhoto(0, 'samples/pier.jpg');
  await setPanelPhoto(1, 'samples/boulevard.jpg');
  await setPanelPhoto(2, 'samples/pier.jpg');
  selected = 0;
  redraw();
  status.textContent = 'Demo photos loaded — replace any panel with your own.';
});

// Caption fields.
titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
tagInput.addEventListener('input', () => { state.tag = tagInput.value; redraw(); });

// Grade and size pickers.
document.querySelectorAll('[data-grade]').forEach((button) => {
  button.addEventListener('click', () => {
    state.grade = button.dataset.grade;
    document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b === button));
    redraw();
  });
});
document.querySelectorAll('[data-size]').forEach((button) => {
  button.addEventListener('click', () => {
    state.size = button.dataset.size;
    document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('active', b === button));
    redraw();
  });
});

// Zoom slider for the selected panel.
zoomInput.addEventListener('input', () => {
  state.panels[selected].zoom = Number(zoomInput.value) / 100;
  redraw();
});

// Click a panel to select it; drag inside it to reposition its photo.
function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}
let dragging = null;
canvas.addEventListener('pointerdown', (event) => {
  const point = canvasPoint(event);
  const rects = panelRects(state.size);
  const hit = rects.findIndex((r) => point.x >= r.x && point.x < r.x + r.w && point.y >= r.y && point.y < r.y + r.h);
  if (hit === -1) return;
  selected = hit;
  dragging = { x: point.x, y: point.y, ox: state.panels[hit].ox, oy: state.panels[hit].oy, rect: rects[hit] };
  canvas.setPointerCapture(event.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  const point = canvasPoint(event);
  const panel = state.panels[selected];
  panel.ox = dragging.ox + (point.x - dragging.x) / dragging.rect.w;
  panel.oy = dragging.oy + (point.y - dragging.y) / dragging.rect.h;
  redraw();
});
canvas.addEventListener('pointerup', () => { dragging = null; });
canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  const panel = state.panels[selected];
  panel.zoom = Math.min(3, Math.max(1, panel.zoom * (event.deltaY < 0 ? 1.08 : 0.92)));
  redraw();
}, { passive: false });

// Export: draw the cover at full post size and download it as a PNG.
document.getElementById('export').addEventListener('click', () => {
  const offscreen = document.createElement('canvas');
  drawCover(offscreen, state);
  const { w, h } = SIZES[state.size];
  offscreen.toBlob((blob) => {
    if (!blob) {
      status.textContent = 'Export failed — try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sunset-cover-${w}x${h}.png`;
    a.click();
    status.textContent = `Saved sunset-cover-${w}x${h}.png`;
  }, 'image/png');
});

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), state, setPanelPhoto, redraw, {
    titleInput, subtitleInput, tagInput, selectPanel,
  });
} else {
  // The Anton display font has to be ready before the first paint, or the
  // title falls back to a plain sans. Redraw once it arrives.
  document.fonts.load('100px Anton').catch(() => {}).finally(redraw);
  redraw();
}
