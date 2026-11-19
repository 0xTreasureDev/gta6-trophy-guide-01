// Rendering: header progress, the checklist rows, the roadmap stages and the
// detail panel. Pure DOM building with textContent, so trophy text from the
// data file is never interpreted as markup.

import { getCount, isEarned } from './state.js';

export const STAGES = [
  { n: 1, title: 'Story opening · Chapters 1 and 2', blurb: 'Start the campaign and clear the opening chapters and their named missions. Nothing in this stage can be passed permanently, so settle in and learn Leonida.' },
  { n: 2, title: 'Story · Chapters 3 and 4, heists and VCIA', blurb: 'Continue the campaign through the heist missions and the VCIA Takedown. This stage holds the one story missable, so read its warning before the airport mission.' },
  { n: 3, title: 'Story finale and stranger strands', blurb: 'Finish the remaining named missions, close every stranger strand (Andy, Kenton, Billy, Randy, Tyrone and Bret) and then complete the final mission to end the story.' },
  { n: 4, title: 'Collectibles and exploration', blurb: 'With the map fully open, sweep the collectible-style trophies: meditation spots, card sets, WAiNK locations, vehicles, areas, gang operations, garages and Scooter Bros registrations.' },
  { n: 5, title: 'Activities, challenges and money', blurb: 'Grind the repeatable systems: stunts, shooting range golds, drone races, races, challenges, bank vaults, bowling and laundering marked bills.' },
  { n: 6, title: 'Free-roam feats and clean-up', blurb: 'Mop up the one-off feats, partner trophies and the cryptic hidden trophies. Several missable warnings live here because their descriptions point at single moments, so keep saves before big scenes.' },
  { n: 7, title: '100 percent and the platinum', blurb: 'Close out 100 percent completion, then the platinum itself unlocks once all 54 other trophies are earned.' },
];

export function isMasked(trophy, state) {
  if (!state.spoiler) return false;
  if (isEarned(state, trophy.id)) return false;
  return trophy.kind === 'story' || trophy.hidden === true;
}

export function displayName(trophy, state) {
  return isMasked(trophy, state) ? '▒▒▒ Hidden trophy ▒▒▒' : trophy.name;
}

export function displayDescription(trophy, state) {
  return isMasked(trophy, state)
    ? 'Spoiler protection is on: this name and description stay hidden until the trophy is earned.'
    : trophy.description;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function pill(text, className) {
  return el('span', `pill ${className}`, text);
}

export function renderHeader(doc, state) {
  const trophies = doc.trophies;
  const earnedCount = trophies.filter((t) => isEarned(state, t.id)).length;
  const pct = Math.round((earnedCount / trophies.length) * 100);
  document.getElementById('earned-count').textContent = String(earnedCount);
  document.getElementById('percent').textContent = `${pct}%`;
  const bar = document.getElementById('platinum-bar');
  bar.style.width = `${pct}%`;
  document.getElementById('platinum-bar-wrap').setAttribute('aria-valuenow', String(pct));
  document.getElementById('platinum-note').textContent =
    earnedCount === trophies.length
      ? 'Platinum earned. You are a Leonida Legend.'
      : `Platinum progress · ${trophies.length - earnedCount} trophies to go`;
  const stats = document.getElementById('grade-stats');
  stats.replaceChildren();
  for (const grade of ['platinum', 'gold', 'silver', 'bronze']) {
    const all = trophies.filter((t) => t.grade === grade);
    const got = all.filter((t) => isEarned(state, t.id)).length;
    stats.append(el('li', '', `${grade}: ${got}/${all.length}`));
  }
}

export function buildCounter(trophy, state, onChange) {
  const wrap = el('span', 'counter');
  const step = trophy.count >= 10000 ? 1000 : 1;
  const minus = el('button', '', '−');
  minus.type = 'button';
  minus.setAttribute('aria-label', `Decrease progress for ${trophy.name}`);
  const label = el('strong', '', `${getCount(state, trophy).toLocaleString('en-US')} / ${trophy.count.toLocaleString('en-US')}`);
  const plus = el('button', '', '+');
  plus.type = 'button';
  plus.setAttribute('aria-label', `Increase progress for ${trophy.name}`);
  minus.addEventListener('click', (ev) => { ev.stopPropagation(); onChange(getCount(state, trophy) - step); });
  plus.addEventListener('click', (ev) => { ev.stopPropagation(); onChange(getCount(state, trophy) + step); });
  wrap.append(minus, label, plus);
  return wrap;
}

export function buildTrophyRow(trophy, state, handlers) {
  const li = el('li', `trophy${isEarned(state, trophy.id) ? ' is-earned' : ''}`);
  li.dataset.trophyId = String(trophy.id);
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = isEarned(state, trophy.id);
  box.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
  box.addEventListener('click', (ev) => ev.stopPropagation());
  box.addEventListener('change', () => handlers.onToggle(trophy, box.checked));

  const main = el('div', 'trophy-main');
  const name = el('div', 'trophy-name');
  name.append(el('span', 'num', `#${trophy.id}`), document.createTextNode(displayName(trophy, state)));
  if (isMasked(trophy, state)) name.classList.add('masked');
  main.append(name);
  main.append(el('div', 'trophy-desc', displayDescription(trophy, state)));

  const meta = el('div', 'trophy-meta');
  meta.append(pill(trophy.grade, `grade-${trophy.grade}`));
  meta.append(pill(trophy.kind, 'kind'));
  meta.append(pill(`Stage ${trophy.stage}`, 'stage'));
  if (trophy.missable) meta.append(pill('Missable', 'missable'));
  if (trophy.hidden) meta.append(pill('Hidden', 'hidden-pill'));
  if (trophy.count) meta.append(buildCounter(trophy, state, (v) => handlers.onCount(trophy, v)));
  main.append(meta);

  li.append(box, main);
  li.addEventListener('click', () => handlers.onOpen(trophy));
  return li;
}

export function renderRoadmap(doc, state, onOpen) {
  const host = document.getElementById('roadmap');
  host.replaceChildren();
  for (const stage of STAGES) {
    const items = doc.trophies.filter((t) => t.stage === stage.n);
    if (!items.length) continue;
    const block = el('section', 'stage-block');
    const earnedHere = items.filter((t) => isEarned(state, t.id)).length;
    const h = el('h2', '', `${stage.n}. ${stage.title} `);
    h.append(el('span', 'stage-count', `· ${earnedHere}/${items.length} earned`));
    block.append(h);
    block.append(el('p', 'stage-blurb', stage.blurb));
    const missables = items.filter((t) => t.missable);
    if (missables.length) {
      const warn = el('p', 'stage-warn', `Missable warning: ${missables.map((t) => t.name).join(', ')}. Handle these inside this stage, before moving on, and keep a save first.`);
      block.append(warn);
    }
    const ul = el('ul');
    for (const t of items) {
      const li = el('li');
      const mark = isEarned(state, t.id) ? '☑ ' : '☐ ';
      li.append(el('span', 'st-name', `${mark}${displayName(t, state)}`));
      li.append(document.createTextNode(' · '));
      li.append(el('span', 'st-desc', displayDescription(t, state)));
      li.append(document.createTextNode(' '), pill(t.grade, `grade-${t.grade}`), document.createTextNode(' '), pill(t.kind, 'kind'));
      if (t.missable) li.append(document.createTextNode(' '), pill('Missable', 'missable'));
      li.addEventListener('click', () => onOpen(t));
      ul.append(li);
    }
    block.append(ul);
    host.append(block);
  }
}

export function renderDetail(trophy, state, handlers) {
  const panel = document.getElementById('detail');
  const body = document.getElementById('detail-body');
  body.replaceChildren();
  const masked = isMasked(trophy, state);

  body.append(el('p', 'kicker', `Trophy #${trophy.id} · Stage ${trophy.stage}`));
  body.append(el('h2', '', displayName(trophy, state)));
  body.append(el('p', 'd-desc', displayDescription(trophy, state)));

  const facts = el('dl', 'd-facts');
  const rows = [
    ['Grade', trophy.grade],
    ['Kind', trophy.kind],
    ['Missable', trophy.missable ? 'Yes · flagged MISSABLE' : 'No'],
    ['Hidden on PSN', trophy.hidden ? 'Yes' : 'No'],
    ['Earned', isEarned(state, trophy.id) ? 'Yes' : 'Not yet'],
  ];
  if (trophy.count) rows.push(['Tracked count', trophy.count.toLocaleString('en-US')]);
  for (const [k, v] of rows) {
    facts.append(el('dt', '', k), el('dd', '', v));
  }
  body.append(facts);

  body.append(el('h3', '', 'Guide'));
  body.append(el('p', 'd-guide', masked
    ? 'Spoiler protection is on, so the guide for this unearned trophy stays hidden until it is earned. Turn spoiler protection off in the controls to read it now.'
    : trophy.guide));

  if (trophy.count) {
    const counterHost = el('div', 'd-counter');
    counterHost.append(el('span', '', 'Progress: '), buildCounter(trophy, state, (v) => handlers.onCount(trophy, v)));
    body.append(counterHost);
  }

  const toggle = el('button', '', isEarned(state, trophy.id) ? 'Mark as not earned' : 'Mark as earned');
  toggle.type = 'button';
  toggle.style.marginTop = '16px';
  toggle.addEventListener('click', () => handlers.onToggle(trophy, !isEarned(state, trophy.id)));
  body.append(toggle);

  body.append(el('h3', '', 'Sources'));
  const list = el('ul', 'sources');
  for (const s of trophy.sources ?? []) {
    const li = el('li');
    const a = el('a', '', s.name);
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    li.append(a);
    list.append(li);
  }
  body.append(list);
  body.append(el('p', 'd-desc', 'Source links open only when followed; the app itself loads nothing over the network.'));
  panel.hidden = false;
}
