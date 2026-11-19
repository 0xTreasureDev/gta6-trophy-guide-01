// Tracker state: earned flags, per-trophy counters and the spoiler setting.
// Everything lives in one localStorage record; export and import move that
// same record in and out as a JSON file. No cookies, no network, no eval.

const STORAGE_KEY = 'leonida-legend-tracker-v1';

export function emptyState() {
  return { earned: {}, counts: {}, spoiler: false };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    return normalizeState(parsed);
  } catch {
    return emptyState();
  }
}

// Accept both this app's record shape and a bare { earned: [...] } list, so an
// imported file from an older export still restores sensibly.
export function normalizeState(value) {
  const state = emptyState();
  if (!value || typeof value !== 'object') return state;
  if (Array.isArray(value.earned)) {
    for (const id of value.earned) state.earned[String(id)] = true;
  } else if (value.earned && typeof value.earned === 'object') {
    for (const [id, on] of Object.entries(value.earned)) {
      if (on) state.earned[String(id)] = true;
    }
  }
  if (value.counts && typeof value.counts === 'object') {
    for (const [id, n] of Object.entries(value.counts)) {
      const num = Number(n);
      if (Number.isFinite(num) && num > 0) state.counts[String(id)] = Math.floor(num);
    }
  }
  state.spoiler = value.spoiler === true;
  return state;
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function isEarned(state, id) {
  return state.earned[String(id)] === true;
}

export function setEarned(state, id, on) {
  if (on) state.earned[String(id)] = true;
  else delete state.earned[String(id)];
}

export function getCount(state, trophy) {
  const n = Number(state.counts[String(trophy.id)] ?? 0);
  if (!Number.isFinite(n) || n < 0) return 0;
  return trophy.count ? Math.min(n, trophy.count) : n;
}

export function setCount(state, trophy, value) {
  const clamped = Math.max(0, trophy.count ? Math.min(value, trophy.count) : value);
  if (clamped === 0) delete state.counts[String(trophy.id)];
  else state.counts[String(trophy.id)] = clamped;
  return clamped;
}

// Counter step: dollars-scale targets move in thousands, everything else by one.
export function countStep(trophy) {
  return trophy.count && trophy.count >= 10000 ? 1000 : 1;
}

export function exportState(state) {
  const payload = JSON.stringify(
    { app: 'leonida-legend-tracker', version: 1, exported: new Date().toISOString(), earned: state.earned, counts: state.counts, spoiler: state.spoiler },
    null,
    2,
  );
  const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gta6-trophy-progress.json';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function importStateFromFile(file) {
  const text = await file.text();
  return normalizeState(JSON.parse(text));
}
