const body = document.body;
const btn = document.getElementById('btn');
const typedTitle = document.getElementById('typedTitle');
const board = document.getElementById('board');
const cards = Array.from(document.querySelectorAll('#documentation .doc-card'));

const title = 'Anga360';
let titleIndex = 0;
let currentIndex = 0;
let wheelLocked = false;
let touchStartX = 0;
let touchStartY = 0;

// ---------- hero typing ----------
function typeTitle() {
  if (!typedTitle) return;
  typedTitle.textContent = title.slice(0, titleIndex);
  if (titleIndex < title.length) {
    titleIndex++;
    setTimeout(typeTitle, 115);
  }
}
typeTitle();

// ---------- departures board nav (built from the cards) ----------
const boardButtons = cards.map((card, i) => {
  const b = document.createElement('button');
  b.innerHTML = `<b>${String(i + 1).padStart(2, '0')}</b>${(card.dataset.short || '').toUpperCase()}`;
  b.setAttribute('aria-label', card.dataset.short || `Section ${i + 1}`);
  b.addEventListener('click', () => goTo(i));
  board.appendChild(b);
  return b;
});

// ---------- open / close ----------
function openDocumentation(index = 0) {
  body.classList.add('docs-open');
  currentIndex = Math.max(0, Math.min(index, cards.length - 1));
  renderDeck();
}

function closeDocumentation() {
  body.classList.remove('docs-open');
  currentIndex = 0;
  renderDeck();
}

// ---------- shrink content slightly if a card overflows ----------
function fitCardContent(card) {
  const bodyEl = card.querySelector('.card-body');
  const inner = bodyEl?.querySelector('.doc-inner');
  if (!bodyEl || !inner) return;
  bodyEl.style.zoom = '1';
  const available = bodyEl.clientHeight - 8;
  let scale = 1;
  while (inner.scrollHeight > available && scale > 0.78) {
    scale = Math.max(0.78, scale - 0.03);
    bodyEl.style.zoom = String(scale);
  }
  bodyEl.style.overflowY = inner.scrollHeight > bodyEl.clientHeight ? 'auto' : 'hidden';
}

// ---------- deck rendering: each card is offset from the active one ----------
function renderDeck() {
  cards.forEach((card, i) => {
    const offset = i - currentIndex;
    card.style.setProperty('--o', offset);
    card.style.setProperty('--a', Math.min(Math.abs(offset), 2));
    card.style.zIndex = 100 - Math.abs(offset);
    card.classList.toggle('active', offset === 0);
    card.classList.toggle('is-behind', offset !== 0);
    card.classList.toggle('far', Math.abs(offset) > 1);
  });

  boardButtons.forEach((b, i) => {
    b.classList.toggle('active', i === currentIndex);
    b.setAttribute('aria-current', i === currentIndex ? 'page' : 'false');
  });
  boardButtons[currentIndex]?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });

  const active = cards[currentIndex];
  const titleText = active.querySelector('h2')?.textContent || '';
  document.title = `${titleText} — Anga360`;
  window.requestAnimationFrame(() => fitCardContent(active));
}

function goTo(index) {
  if (!body.classList.contains('docs-open')) {
    openDocumentation(index);
    return;
  }
  const next = Math.max(0, Math.min(index, cards.length - 1));
  if (next === currentIndex) return;
  currentIndex = next;
  renderDeck();
}

const nextPage = () => goTo(currentIndex + 1);
const previousPage = () => goTo(currentIndex - 1);

// ---------- input: wheel, keys, touch ----------
document.addEventListener('wheel', (event) => {
  if (!body.classList.contains('docs-open')) {
    if (Math.abs(event.deltaY) > 5 || Math.abs(event.deltaX) > 5) {
      openDocumentation(0);
      event.preventDefault();
    }
    return;
  }

  // Let a card scroll its own overflowing content before flipping.
  const bodyEl = cards[currentIndex].querySelector('.card-body');
  if (bodyEl && bodyEl.scrollHeight > bodyEl.clientHeight + 2) {
    const atTop = bodyEl.scrollTop <= 0;
    const atEnd = bodyEl.scrollTop + bodyEl.clientHeight >= bodyEl.scrollHeight - 2;
    if ((event.deltaY > 0 && !atEnd) || (event.deltaY < 0 && !atTop)) return;
  }

  event.preventDefault();
  if (wheelLocked) return;
  const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
  if (Math.abs(delta) < 8) return;

  wheelLocked = true;
  delta > 0 ? nextPage() : previousPage();
  setTimeout(() => { wheelLocked = false; }, 700);
}, { passive: false });

document.addEventListener('keydown', (event) => {
  if (!body.classList.contains('docs-open')) {
    if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(event.key)) {
      openDocumentation(0);
      event.preventDefault();
    }
    return;
  }
  if (['ArrowRight', 'ArrowDown', 'PageDown'].includes(event.key)) {
    nextPage(); event.preventDefault();
  } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(event.key)) {
    previousPage(); event.preventDefault();
  } else if (event.key === 'Home') {
    goTo(0); event.preventDefault();
  } else if (event.key === 'End') {
    goTo(cards.length - 1); event.preventDefault();
  } else if (event.key === 'Escape') {
    closeDocumentation(); event.preventDefault();
  }
});

document.addEventListener('touchstart', (event) => {
  touchStartX = event.touches[0].clientX;
  touchStartY = event.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', (event) => {
  if (!body.classList.contains('docs-open')) return;
  const dx = event.changedTouches[0].clientX - touchStartX;
  const dy = event.changedTouches[0].clientY - touchStartY;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 45) return;
  // Horizontal swipes flip cards; vertical ones are left for in-card scrolling.
  if (Math.abs(dx) > Math.abs(dy)) dx < 0 ? nextPage() : previousPage();
}, { passive: true });

// ---------- header + hero links ----------
document.querySelectorAll('header a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const id = link.getAttribute('href');
    event.preventDefault();
    if (id === '#home') return closeDocumentation();
    if (id === '#documentation') return openDocumentation(0);
    const index = cards.indexOf(document.querySelector(id));
    openDocumentation(index >= 0 ? index : 0);
  });
});

btn?.addEventListener('click', (event) => {
  event.preventDefault();
  openDocumentation(0);
});

renderDeck();
