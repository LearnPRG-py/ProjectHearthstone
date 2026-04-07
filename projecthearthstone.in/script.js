// UPDATES
let TRACK;
const LEFT_BTN_SELECTOR = '.nav-btn.left';
const RIGHT_BTN_SELECTOR = '.nav-btn.right';

let LEFT_BTN, RIGHT_BTN;
let updates = [];
let activeIndex = 0;

const GAP = 20;

async function init() {
  TRACK = document.getElementById('updates-track');
  LEFT_BTN = document.querySelector(LEFT_BTN_SELECTOR);
  RIGHT_BTN = document.querySelector(RIGHT_BTN_SELECTOR);

  if (!TRACK) {
    console.error('updates-track element not found.');
    return;
  }
  if (!LEFT_BTN || !RIGHT_BTN) {
    console.error('Navigation buttons not found.');
    return;
  }

  const resp = await fetch('updates.json');
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  updates = await resp.json();

  renderCards();
  activeIndex = 0;

  requestAnimationFrame(() => updatePosition(0));
  attachListeners();
}

function renderCards() {
  TRACK.innerHTML = '';
  updates.forEach((u, i) => {
    const card = document.createElement('article');
    const importance = u.importance;
    let colorClass = '';

    if (importance === 1) colorClass = 'importance-1';
    else if (importance === 2) colorClass = 'importance-2';
    else if (importance === 3) colorClass = 'importance-3';

    card.className = `update-card ${colorClass}`;
    card.setAttribute('role', 'listitem');
    card.dataset.index = i;

    const imgDiv = document.createElement('div');
    imgDiv.className = 'thumb';

    const img = document.createElement('img');
    img.src = u.image;
    img.alt = u.title || `Update ${i + 1}`;
    img.loading = 'lazy';
    imgDiv.appendChild(img);

    const meta = document.createElement('div');
    meta.className = 'meta';

    const h3 = document.createElement('h3');
    h3.textContent = u.title;

    const p = document.createElement('p');
    p.textContent = u.description;

    const time = document.createElement('time');
    const parsedDate = new Date(u.date);
    time.setAttribute('datetime', u.date);
    time.textContent =isNaN(parsedDate) ? u.date: parsedDate.toLocaleDateString();

    meta.appendChild(h3);
    meta.appendChild(p);
    meta.appendChild(time);

    card.appendChild(imgDiv);
    card.appendChild(meta);

    TRACK.appendChild(card);

    img.addEventListener('error', () => {
      imgDiv.style.backgroundColor = 'rgba(255,255,255,0.02)';
      img.remove();
    });
  });

  requestAnimationFrame(() => {
    TRACK.style.paddingLeft = '0px';
    TRACK.style.paddingRight = '0px';
    setCenterClass();
  });
}

function cardDimensions() {
  const card = TRACK.querySelector('.update-card');
  if (!card) return { w: 320, gap: GAP };
  const w = Math.round(card.getBoundingClientRect().width);
  const gap = GAP;
  return { w, gap };
}

function updatePosition(animate = true) {
  const { w, gap } = cardDimensions();
  const step = w + gap;

  const mask = TRACK.closest('.updates-mask');
  if (!mask) return;

  const maskWidth = mask.getBoundingClientRect().width;
  const centerX = maskWidth / 2;

  const translateX = Math.round(
    centerX - w / 2 - activeIndex * step
  );

  if (!animate) {
    TRACK.style.transition = 'none';
    TRACK.style.transform = `translateX(${translateX}px)`;
    void TRACK.offsetWidth;
    TRACK.style.transition = '';
  } else {
    TRACK.style.transform = `translateX(${translateX}px)`;
  }

  setCenterClass();
}

function setCenterClass() {
  const cards = Array.from(TRACK.querySelectorAll('.update-card'));
  cards.forEach(c => c.classList.remove('center'));

  const centerCard = TRACK.querySelector(
    `.update-card[data-index="${activeIndex}"]`
  );

  if (centerCard) centerCard.classList.add('center');
}

function attachListeners() {
  LEFT_BTN.addEventListener('click', () => {
    if (activeIndex > 0) {
      activeIndex -= 1;
      updatePosition(true);
    }
  });

  RIGHT_BTN.addEventListener('click', () => {
    if (activeIndex < updates.length - 1) {
      activeIndex += 1;
      updatePosition(true);
    }
  });

  setupDrag();

  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') LEFT_BTN.click();
    if (e.key === 'ArrowRight') RIGHT_BTN.click();
  });
}

function setupDrag() {
  let startX = 0;
  let dragging = false;
  let startTranslate = 0;
  const mask = TRACK.parentElement;

  mask.addEventListener('pointerdown', e => {
    dragging = true;
    startX = e.clientX;

    TRACK.style.transition = 'none';

    const style = window.getComputedStyle(TRACK);
    const matrix = new DOMMatrixReadOnly(style.transform);
    startTranslate = matrix.m41 || 0;

    mask.setPointerCapture?.(e.pointerId);
  });

  mask.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    TRACK.style.transform = `translateX(${Math.round(startTranslate + dx)}px)`;
  });

  mask.addEventListener('pointerup', e => {
    if (!dragging) return;
    dragging = false;

    TRACK.style.transition = '';

    const dx = e.clientX - startX;
    const { w, gap } = cardDimensions();
    const step = w + gap;

    const deltaIndex = Math.round(-dx / step);
    activeIndex = Math.max(
      0,
      Math.min(updates.length - 1, activeIndex + deltaIndex)
    );

    updatePosition(true);
  });

  mask.addEventListener('pointercancel', () => {
    dragging = false;
    updatePosition(true);
  });
}

window.addEventListener('resize', () => updatePosition(false));

function safeInit() {
    init().catch(err => {
        console.error('Failed to initialize updates carousel:', err);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeInit);
} else {
    safeInit();
}