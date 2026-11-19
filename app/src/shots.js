// Fixed scenes for screenshots: ?shot=editor shows the page with demo photos
// loaded; ?shot=cover shows the exported cover alone, at the post size the
// query names. `photo` picks the hero sample, `caption` the title, `grade`
// the colour grade, `size` the post size. window.__shotReady is set once the
// display font has loaded and the cover has been painted twice.
export async function runShot(shot, query, state, setPanelPhoto, redraw, inputs) {
  const grade = query.get('grade');
  if (grade && ['sunset', 'neon', 'dusk', 'golden'].includes(grade)) state.grade = grade;
  const size = query.get('size');
  if (size && ['square', 'portrait', 'wide'].includes(size)) state.size = size;

  const title = query.get('caption') ?? 'Vice City Nights';
  state.title = title;
  inputs.titleInput.value = title;
  state.subtitle = query.get('subtitle') ?? 'Your story, in neon';
  inputs.subtitleInput.value = state.subtitle;
  state.tag = query.get('tag') ?? 'Vice City';
  inputs.tagInput.value = state.tag;

  const hero = query.get('photo') ?? 'pier';
  await setPanelPhoto(0, `samples/${hero}.jpg`);
  await setPanelPhoto(1, `samples/${hero === 'pier' ? 'boulevard' : 'pier'}.jpg`);
  await setPanelPhoto(2, `samples/${hero}.jpg`);

  // Optional per-panel vertical pan (fractions of the panel height), so a
  // screenshot can frame the photo's subject instead of its middle.
  const oyAll = query.get('oy');
  for (let i = 0; i < 3; i++) {
    const oy = query.get(`oy${i}`) ?? oyAll;
    if (oy !== null && oy !== undefined) state.panels[i].oy = Number(oy) || 0;
  }
  if (inputs.selectPanel) inputs.selectPanel(0);

  if (shot === 'cover') document.body.classList.add('shot-cover');
  document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b.dataset.grade === state.grade));
  document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('active', b.dataset.size === state.size));

  try { await document.fonts.load('100px Anton'); } catch { /* fall back to sans */ }
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
