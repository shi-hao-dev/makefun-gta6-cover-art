// Draws a multi-panel GTA-style poster cover on a canvas: up to three photo
// panels with white frames, a neon-sunset colour grade over every photo, and a
// bold gradient title band along the foot. Everything is drawn by hand on the
// 2D context — no game artwork, no borrowed template, just rectangles,
// gradients and the vendored Anton display font.
//
// A cover state looks like:
//   {
//     size: 'square' | 'portrait' | 'wide',
//     grade: 'sunset' | 'neon' | 'dusk' | 'golden',
//     title: string, subtitle: string, tag: string,
//     panels: [{ photo: HTMLImageElement | null, zoom: number, ox: number, oy: number }, x3]
//   }
// Panel offsets ox/oy are fractions of the panel's own width/height; zoom 1
// is the tightest cover-fit of the photo inside its panel.

export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 x 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 x 1350' },
  wide: { w: 1920, h: 1080, label: '1920 x 1080' },
};

export const GRADES = {
  sunset: {
    label: 'Sunset',
    washTop: 'rgba(255, 150, 60, 0.16)',
    washBottom: 'rgba(255, 45, 120, 0.34)',
    title: ['#ffe259', '#ff7e5f', '#ff2e88'],
    accent: '#ff5e78',
  },
  neon: {
    label: 'Neon',
    washTop: 'rgba(0, 229, 255, 0.15)',
    washBottom: 'rgba(255, 45, 200, 0.32)',
    title: ['#a5f3fc', '#f0abfc', '#ff5df2'],
    accent: '#22d3ee',
  },
  dusk: {
    label: 'Dusk',
    washTop: 'rgba(120, 90, 255, 0.18)',
    washBottom: 'rgba(40, 20, 90, 0.38)',
    title: ['#e0e7ff', '#a78bfa', '#7c3aed'],
    accent: '#a78bfa',
  },
  golden: {
    label: 'Golden',
    washTop: 'rgba(255, 220, 120, 0.18)',
    washBottom: 'rgba(255, 140, 0, 0.30)',
    title: ['#fff7cc', '#ffd166', '#ff8c00'],
    accent: '#ffb703',
  },
};

// Panel rectangles as fractions of the cover [x, y, w, h], and the caption
// band as a fraction of the height. Hero first, then the two small panels.
const LAYOUTS = {
  portrait: {
    panels: [
      [0, 0, 1, 0.56],
      [0, 0.56, 0.5, 0.26],
      [0.5, 0.56, 0.5, 0.26],
    ],
    band: 0.82,
  },
  square: {
    panels: [
      [0, 0, 0.62, 0.78],
      [0.62, 0, 0.38, 0.39],
      [0.62, 0.39, 0.38, 0.39],
    ],
    band: 0.78,
  },
  wide: {
    panels: [
      [0, 0, 0.58, 0.74],
      [0.58, 0, 0.42, 0.37],
      [0.58, 0.37, 0.42, 0.37],
    ],
    band: 0.74,
  },
};

/** Panel rectangles in canvas pixels for `size`, in draw order. */
export function panelRects(size) {
  const { w, h } = SIZES[size];
  return LAYOUTS[size].panels.map(([fx, fy, fw, fh]) => ({
    x: fx * w,
    y: fy * h,
    w: fw * w,
    h: fh * h,
  }));
}

/** Draws one photo into a panel rect, cover-fit, with the panel's zoom and pan. */
function drawPanelPhoto(ctx, photo, rect, zoom, ox, oy) {
  if (!photo) return false;
  const base = Math.max(rect.w / photo.naturalWidth, rect.h / photo.naturalHeight);
  const scale = base * zoom;
  const pw = photo.naturalWidth * scale;
  const ph = photo.naturalHeight * scale;
  const cx = rect.x + rect.w / 2 + ox * rect.w;
  const cy = rect.y + rect.h / 2 + oy * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.filter = 'saturate(1.25) contrast(1.06)';
  ctx.drawImage(photo, cx - pw / 2, cy - ph / 2, pw, ph);
  ctx.filter = 'none';
  ctx.restore();
  return true;
}

/** A synthwave sun: a gradient disc cut by horizontal slits, drawn small. */
function drawMiniSun(ctx, x, y, r) {
  const g = ctx.createLinearGradient(x, y - r, x, y + r);
  g.addColorStop(0, '#ffe259');
  g.addColorStop(0.55, '#ff7e5f');
  g.addColorStop(1, '#ff2e88');
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.fillStyle = '#160a1e';
  let slit = r * 0.12;
  let sy = y + r * 0.05;
  while (sy < y + r) {
    ctx.fillRect(x - r, sy, r * 2, slit);
    sy += slit * 2.6;
    slit *= 1.35;
  }
  ctx.restore();
}

/** The sunset wash over one panel: warm at the top, hot pink at the foot. */
function washPanel(ctx, rect, grade) {
  const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  wash.addColorStop(0, grade.washTop);
  wash.addColorStop(1, grade.washBottom);
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

/** A panel with no photo yet: dark sky, a sun, and a hint of what goes there. */
function drawEmptyPanel(ctx, rect, grade, index) {
  const sky = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  sky.addColorStop(0, '#2b1245');
  sky.addColorStop(0.6, '#57204e');
  sky.addColorStop(1, '#8a2a5e');
  ctx.fillStyle = sky;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const r = Math.min(rect.w, rect.h) * 0.2;
  drawMiniSun(ctx, rect.x + rect.w / 2, rect.y + rect.h * 0.42, r);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = `700 ${Math.round(Math.min(rect.w, rect.h) * 0.07)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(`PANEL ${index + 1}`, rect.x + rect.w / 2, rect.y + rect.h * 0.78);
  washPanel(ctx, rect, grade);
}

/** Fits `text` on one line: shrinks the Anton size until it fits `maxWidth`. */
function fitTitle(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
  while (size > 20 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
  }
  return size;
}

/** Draws `state` onto `canvas` at the canvas's own pixel size. */
export function drawCover(canvas, state) {
  const { w, h } = SIZES[state.size];
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const unit = w / 1080; // everything scales from a 1080-wide poster
  const gutter = 10 * unit;
  const rects = panelRects(state.size);
  const bandTop = LAYOUTS[state.size].band * h;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  rects.forEach((rect, i) => {
    const panel = state.panels[i];
    const inner = {
      x: rect.x + gutter,
      y: rect.y + gutter,
      w: rect.w - gutter * 2,
      h: rect.h - gutter * 2,
    };
    // White frame, then the photo (or an empty-panel sky) inside it.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    const drawn = panel && panel.photo
      ? drawPanelPhoto(ctx, panel.photo, inner, panel.zoom || 1, panel.ox || 0, panel.oy || 0)
      : false;
    if (!drawn) drawEmptyPanel(ctx, inner, grade, i);
    else washPanel(ctx, inner, grade);
    // Thin dark keyline so panels read against the white gutters.
    ctx.strokeStyle = 'rgba(20, 6, 28, 0.85)';
    ctx.lineWidth = 2 * unit;
    ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  });

  // A soft vignette over the whole poster pulls the panels together.
  const vig = ctx.createRadialGradient(
    w / 2, h * 0.42, Math.min(w, h) * 0.35,
    w / 2, h * 0.5, Math.max(w, h) * 0.75,
  );
  vig.addColorStop(0, 'rgba(10, 0, 20, 0)');
  vig.addColorStop(1, 'rgba(10, 0, 20, 0.32)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  // Caption band: deep plum, an accent stripe on top, title, subtitle, tag.
  const band = ctx.createLinearGradient(0, bandTop, 0, h);
  band.addColorStop(0, '#1d0b28');
  band.addColorStop(1, '#12061a');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandTop, w, h - bandTop);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(0, bandTop, w, 6 * unit);

  const title = (state.title || '').trim().toUpperCase();
  const bandH = h - bandTop;
  if (title) {
    const size = fitTitle(ctx, title, w * 0.88, bandH * 0.44);
    const grad = ctx.createLinearGradient(0, bandTop + bandH * 0.18, 0, bandTop + bandH * 0.62);
    grad.addColorStop(0, grade.title[0]);
    grad.addColorStop(0.55, grade.title[1]);
    grad.addColorStop(1, grade.title[2]);
    ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#14061c';
    ctx.lineWidth = size * 0.09;
    const ty = bandTop + bandH * 0.4;
    ctx.strokeText(title, w / 2, ty);
    ctx.fillStyle = grad;
    ctx.fillText(title, w / 2, ty);
  }

  const subtitle = (state.subtitle || '').trim();
  if (subtitle) {
    let size = bandH * 0.15;
    ctx.font = `700 ${size}px sans-serif`;
    while (size > 12 && ctx.measureText(subtitle).width > w * 0.86) {
      size -= 1;
      ctx.font = `700 ${size}px sans-serif`;
    }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(subtitle.toUpperCase(), w / 2, bandTop + bandH * 0.8);
  }

  // City tag pill, top-left over the hero panel, with a mini sun.
  const tag = (state.tag || '').trim().toUpperCase();
  if (tag) {
    const pad = 14 * unit;
    const fs = 26 * unit;
    ctx.font = `700 ${fs}px sans-serif`;
    const tw = ctx.measureText(tag).width;
    const pillW = tw + pad * 2 + fs * 1.6;
    const pillH = fs * 2.1;
    const px = gutter + 6 * unit;
    const py = gutter + 6 * unit;
    ctx.fillStyle = 'rgba(18, 6, 26, 0.82)';
    ctx.beginPath();
    ctx.roundRect(px, py, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.strokeStyle = grade.accent;
    ctx.lineWidth = 2 * unit;
    ctx.stroke();
    drawMiniSun(ctx, px + pad + fs * 0.55, py + pillH / 2, fs * 0.55);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(tag, px + pad + fs * 1.5, py + pillH / 2 + 1);
  }
}
