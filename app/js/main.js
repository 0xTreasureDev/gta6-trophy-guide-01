// Leonida Legend controller: loads the trophy data, wires the filters, the
// checklist and roadmap views, the detail panel, deep links and import/export.
// State changes always flow through saveAndRender so header, list, roadmap and
// detail can never drift apart.

import { exportState, importStateFromFile, isEarned, loadState, saveState, setCount, setEarned } from './state.js';
import { buildTrophyRow, renderDetail, renderHeader, renderRoadmap } from './render.js';

const KIND_CHIPS = [
  { key: 'all', label: 'All' },
  { key: 'story', label: 'Story' },
  { key: 'missable', label: 'Missable' },
  { key: 'collectibles', label: 'Collectibles' },
  { key: 'activities', label: 'Activities' },
  { key: 'online', label: 'Online' },
  { key: 'misc', label: 'Misc' },
];

const filters = { kind: 'all', grade: 'all', state: 'all', search: '' };
let view = 'checklist';
let selected = null;

const doc = await (await fetch('data/trophies.json')).json();
const trophiesById = new Map(doc.trophies.map((t) => [t.id, t]));
let state = loadState();

const listEl = document.getElementById('trophy-list');
const checklistView = document.getElementById('checklist-view');
const roadmapView = document.getElementById('roadmap-view');
const detailPanel = document.getElementById('detail');

const handlers = {
  onToggle(trophy, on) {
    setEarned(state, trophy.id, on);
    if (on && trophy.count) setCount(state, trophy, trophy.count);
    saveAndRender();
  },
  onCount(trophy, value) {
    const now = setCount(state, trophy, value);
    if (trophy.count && now >= trophy.count) setEarned(state, trophy.id, true);
    saveAndRender();
  },
  onOpen(trophy) {
    openDetail(trophy);
  },
};

function matchesFilters(t) {
  if (filters.kind === 'missable') {
    if (!t.missable) return false;
  } else if (filters.kind !== 'all' && t.kind !== filters.kind) return false;
  if (filters.grade !== 'all' && t.grade !== filters.grade) return false;
  if (filters.state === 'earned' && !isEarned(state, t.id)) return false;
  if (filters.state === 'unearned' && isEarned(state, t.id)) return false;
  if (filters.search) {
    const hay = `${t.name} ${t.description} ${t.guide}`.toLowerCase();
    if (!hay.includes(filters.search)) return false;
  }
  return true;
}

function renderChecklist() {
  const visible = doc.trophies.filter(matchesFilters);
  listEl.replaceChildren(...visible.map((t) => buildTrophyRow(t, state, handlers)));
  document.getElementById('empty-note').hidden = visible.length !== 0;
  document.getElementById('result-line').textContent =
    `Showing ${visible.length} of ${doc.trophies.length} trophies` +
    (filters.kind === 'missable' ? ' · missable trophies only, handle these with a save ready' : '') +
    (filters.kind === 'online' ? ' · the official list contains no Online trophies' : '');
}

function render() {
  renderHeader(doc, state);
  document.getElementById('spoiler').checked = state.spoiler;
  document.getElementById('tab-checklist').classList.toggle('is-active', view === 'checklist');
  document.getElementById('tab-roadmap').classList.toggle('is-active', view === 'roadmap');
  checklistView.hidden = view !== 'checklist';
  roadmapView.hidden = view !== 'roadmap';
  if (view === 'checklist') renderChecklist();
  else renderRoadmap(doc, state, handlers.onOpen);
  if (selected) renderDetail(selected, state, handlers);
  for (const chip of document.querySelectorAll('#kind-chips .chip')) {
    chip.classList.toggle('is-active', chip.dataset.kind === filters.kind);
  }
}

function saveAndRender() {
  saveState(state);
  render();
}

function openDetail(trophy) {
  selected = trophy;
  renderDetail(trophy, state, handlers);
}

function closeDetail() {
  selected = null;
  detailPanel.hidden = true;
}

// Kind chips
const chipHost = document.getElementById('kind-chips');
for (const chipDef of KIND_CHIPS) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `chip${chipDef.key === 'missable' ? ' missable-chip' : ''}`;
  b.dataset.kind = chipDef.key;
  b.textContent = chipDef.label;
  b.addEventListener('click', () => { filters.kind = chipDef.key; render(); });
  chipHost.append(b);
}

document.getElementById('grade-filter').addEventListener('change', (e) => { filters.grade = e.target.value; render(); });
document.getElementById('state-filter').addEventListener('change', (e) => { filters.state = e.target.value; render(); });
document.getElementById('search').addEventListener('input', (e) => { filters.search = e.target.value.trim().toLowerCase(); render(); });
document.getElementById('spoiler').addEventListener('change', (e) => { state.spoiler = e.target.checked; saveAndRender(); });
document.getElementById('export-btn').addEventListener('click', () => exportState(state));
document.getElementById('reset-btn').addEventListener('click', () => {
  state = { earned: {}, counts: {}, spoiler: state.spoiler };
  saveAndRender();
});
document.getElementById('import-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    state = await importStateFromFile(file);
    saveAndRender();
  } catch {
    document.getElementById('result-line').textContent = 'That import file could not be read as tracker JSON; nothing was changed.';
  }
  e.target.value = '';
});
document.getElementById('tab-checklist').addEventListener('click', () => { view = 'checklist'; render(); });
document.getElementById('tab-roadmap').addEventListener('click', () => { view = 'roadmap'; render(); });
document.getElementById('detail-close').addEventListener('click', closeDetail);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDetail(); });

// Deep links: #view=roadmap, #kind=missable, #trophy=<id>, combinable.
function applyHash() {
  const raw = location.hash.replace(/^#/, '');
  if (!raw) return;
  const params = new URLSearchParams(raw);
  if (params.get('view') === 'roadmap') view = 'roadmap';
  if (params.get('view') === 'checklist') view = 'checklist';
  const kind = params.get('kind');
  if (kind && KIND_CHIPS.some((c) => c.key === kind)) filters.kind = kind;
  const grade = params.get('grade');
  if (grade) { filters.grade = grade; document.getElementById('grade-filter').value = grade; }
  const trophyId = Number(params.get('trophy'));
  if (Number.isInteger(trophyId) && trophiesById.has(trophyId)) selected = trophiesById.get(trophyId);
}

applyHash();
window.addEventListener('hashchange', () => { applyHash(); render(); });
render();
if (selected) renderDetail(selected, state, handlers);
