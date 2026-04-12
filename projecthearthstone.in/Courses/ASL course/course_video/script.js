(function() {
  const canvas = document.getElementById('star-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, stars = [];
  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    stars = [];
    const n = Math.floor(W * H / 2800);
    for (let i = 0; i < n; i++) {
      const t = Math.random();
      stars.push({
        x: Math.random()*W, y: Math.random()*H,
        r: t>0.92?1.3+Math.random()*0.7:t>0.7?0.7+Math.random()*0.4:0.2+Math.random()*0.35,
        a: 0.1+Math.random()*0.6, sp: 0.4+Math.random()*2.2, ph: Math.random()*Math.PI*2,
        col: Math.random()>0.88?[180,200,255]:Math.random()>0.8?[200,160,255]:[215,215,238],
      });
    }
  }
  window.addEventListener('resize', resize); resize();
  let f = 0;
  (function draw() {
    ctx.clearRect(0,0,W,H);
    const t = f++ * 0.016;
    stars.forEach(s => {
      const al = s.a*(0.45+0.55*Math.sin(t*s.sp+s.ph));
      const [r,g,b] = s.col;
      ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(${r},${g},${b},${al.toFixed(3)})`; ctx.fill();
    });
    requestAnimationFrame(draw);
  })();
})();

const LS_VIDEO_PROGRESS  = 'asl_video_progress_v2';
const LS_PORTAL_PROGRESS = 'asl_progress_v2';

function lsGet(key) { try { return localStorage.getItem(key); } catch(e) { return null; } }
function lsSet(key, val) { try { localStorage.setItem(key, val); } catch(e) {} }

function loadCompletedVideos() {
  try {
    const raw = lsGet(LS_VIDEO_PROGRESS);
    return raw ? JSON.parse(raw) : [];
  } catch(e) { return []; }
}
function saveCompletedVideos(arr) { lsSet(LS_VIDEO_PROGRESS, JSON.stringify(arr)); }
function markVideoComplete(videoId) {
  const done = loadCompletedVideos();
  if (!done.includes(videoId)) { done.push(videoId); saveCompletedVideos(done); }
}
function isVideoCompleted(videoId) { return loadCompletedVideos().includes(videoId); }

function buildGlobalVideoList(sections) {
  const list = [];
  sections.forEach(sec => sec.videos.forEach(v => list.push({ ...v, sectionKey: sec.key })));
  return list;
}
function isVideoUnlocked(videoId, globalList) {
  const idx = globalList.findIndex(v => v.id === videoId);
  if (idx === 0) return true;
  return isVideoCompleted(globalList[idx - 1].id);
}

let courseData = null;
let currentSection = null;
let currentVideoIdx = 0;
let globalVideoList = [];

function applyTheme(section) {
  const root = document.documentElement;
  root.style.setProperty('--col', section.color);
  root.style.setProperty('--col-dim', hexToRgba(section.color, 0.15));
  const [r,g,b] = section.portalColor.split(',').map(Number);
  root.style.setProperty('--col-shadow', `rgba(${r},${g},${b},0.18)`);
  const name = document.getElementById('sidebar-section-name');
  name.textContent = section.label;
  name.style.color = section.color;
  name.style.textShadow = `0 0 28px ${section.color}`;
  document.getElementById('sidebar-section-desc').textContent = section.description;
  document.title = `ASL Mastery — ${section.label}`;
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function updateProgressBar() {}

function buildSectionTabs(activeSection) {
  const container = document.getElementById('section-tabs');
  container.innerHTML = '';
  courseData.sections.forEach(sec => {
    const isLocked = !isVideoUnlocked(sec.videos[0].id, globalVideoList);
    const isActive = sec.key === activeSection.key;
    const btn = document.createElement('button');
    btn.className = 'section-tab' + (isActive ? ' active' : '') + (isLocked ? ' locked' : '');
    const dot = document.createElement('span');
    dot.className = 'tab-dot';
    dot.style.background = isLocked ? 'transparent' : sec.color;
    dot.style.borderColor = sec.color;
    dot.style.color = sec.color;
    const label = document.createElement('span');
    label.className = 'tab-label';
    label.textContent = sec.label;
    btn.appendChild(dot);
    btn.appendChild(label);
    if (isLocked) {
      const lockIcon = document.createElement('span');
      lockIcon.className = 'tab-lock-icon';
      lockIcon.innerHTML = `<svg width="11" height="13" viewBox="0 0 11 13" fill="none">
        <path d="M3 6V4.5a2.5 2.5 0 015 0V6" stroke="rgba(255,255,255,0.5)" stroke-width="1.4" stroke-linecap="round"/>
        <rect x="1" y="6" width="9" height="6.5" rx="2" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.35)" stroke-width="1.2"/>
        <circle cx="5.5" cy="9.2" r="1.2" fill="rgba(255,255,255,0.4)"/>
      </svg>`;
      btn.appendChild(lockIcon);
    } else {
      btn.addEventListener('click', () => switchSection(sec));
    }
    container.appendChild(btn);
  });
}

function buildVideoList(section, activeIdx) {
  const container = document.getElementById('video-list');
  container.innerHTML = '';
  section.videos.forEach((video, i) => {
    const unlocked = isVideoUnlocked(video.id, globalVideoList);
    const completed = isVideoCompleted(video.id);
    const isActive = i === activeIdx;
    const btn = document.createElement('button');
    btn.className = 'video-item' + (isActive ? ' active' : '') + (!unlocked ? ' locked' : '');
    const num = document.createElement('span');
    num.className = 'video-num';
    num.textContent = String(i + 1).padStart(2, '0');
    const info = document.createElement('div');
    info.className = 'video-info';
    const title = document.createElement('div');
    title.className = 'video-title';
    title.textContent = video.title;
    const dur = document.createElement('div');
    dur.className = 'video-dur';
    dur.textContent = video.duration;
    info.appendChild(title);
    info.appendChild(dur);
    const statusWrap = document.createElement('div');
    statusWrap.className = 'video-status';
    if (!unlocked) {
      statusWrap.innerHTML = `<span class="vstat-lock"><svg width="10" height="12" viewBox="0 0 10 12" fill="none">
        <path d="M2.5 5.5V4A2.5 2.5 0 017.5 4v1.5" stroke="rgba(255,255,255,0.5)" stroke-width="1.3" stroke-linecap="round"/>
        <rect x="0.5" y="5.5" width="9" height="6" rx="1.5" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.3)" stroke-width="1.1"/>
        <circle cx="5" cy="8.5" r="1" fill="rgba(255,255,255,0.35)"/>
      </svg></span>`;
    } else if (isActive) {
      statusWrap.innerHTML = `<span class="vstat-dot"></span>`;
    } else if (completed) {
      statusWrap.innerHTML = `<span class="vstat-check done"><svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 6.5l2.5 2.5 5.5-5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg></span>`;
    } else {
      statusWrap.innerHTML = `<span class="vstat-check"><svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="4.5" stroke="rgba(255,255,255,0.15)" stroke-width="1.2"/>
      </svg></span>`;
    }
    btn.appendChild(num);
    btn.appendChild(info);
    btn.appendChild(statusWrap);
    if (unlocked) btn.addEventListener('click', () => loadVideo(section, i));
    container.appendChild(btn);
  });
}

const arrowSvg = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2l4.5 5L5 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function loadVideo(section, idx) {
  currentSection = section;
  currentVideoIdx = idx;
  const video = section.videos[idx];
  const unlocked = isVideoUnlocked(video.id, globalVideoList);
  const frame = document.getElementById('video-frame');
  const lockedOverlay = document.getElementById('video-locked-overlay');
  const completeBtnWrap = document.getElementById('complete-btn-wrap');
  if (unlocked) {
    const url = video.youtube.includes('?')
      ? video.youtube + '&rel=0&modestbranding=1&enablejsapi=1'
      : video.youtube + '?rel=0&modestbranding=1&enablejsapi=1';
    frame.src = url;
    lockedOverlay.classList.remove('visible');
    completeBtnWrap.classList.remove('visible');
    if (!isVideoCompleted(video.id)) {
      clearTimeout(window._completeBtnTimer);
      window._completeBtnTimer = setTimeout(() => completeBtnWrap.classList.add('visible'), 3000);
    }
  } else {
    frame.src = '';
    lockedOverlay.classList.add('visible');
    completeBtnWrap.classList.remove('visible');
  }
  document.getElementById('current-video-title').textContent = video.title;
  document.getElementById('current-video-meta').textContent = `${section.label} · ${video.duration}`;
  const globalIdx = globalVideoList.findIndex(v => v.id === video.id);
  const prevExists = globalIdx > 0;
  const nextExists = globalIdx < globalVideoList.length - 1;
  const nextUnlocked = nextExists && isVideoUnlocked(globalVideoList[globalIdx+1].id, globalVideoList);
  document.getElementById('btn-prev-vid').disabled = !prevExists;
  const nextBtn = document.getElementById('btn-next-vid');
  nextBtn.disabled = !nextExists || !nextUnlocked;
  if (nextExists) {
    const nextVid = globalVideoList[globalIdx + 1];
    if (nextVid.sectionKey !== section.key) {
      const nextSec = courseData.sections.find(s => s.key === nextVid.sectionKey);
      nextBtn.innerHTML = `Next Section: ${nextSec ? nextSec.label : 'Next'} ${arrowSvg}`;
    } else {
      nextBtn.innerHTML = `Next Lesson ${arrowSvg}`;
    }
  } else {
    nextBtn.innerHTML = `Next Lesson ${arrowSvg}`;
  }
  lsSet('asl_current_section', section.key);
  lsSet('asl_current_video', video.id);
  buildVideoList(section, idx);
  buildSectionTabs(section);
}

function completeCurrentLesson() {
  const video = currentSection.videos[currentVideoIdx];
  markVideoComplete(video.id);
  document.getElementById('complete-btn-wrap').classList.remove('visible');
  const globalIdx = globalVideoList.findIndex(v => v.id === video.id);
  let unlockedLabel = null;
  let unlockedSection = null;
  if (globalIdx < globalVideoList.length - 1) {
    const nextVid = globalVideoList[globalIdx + 1];
    if (nextVid.sectionKey !== currentSection.key) {
      const nextSec = courseData.sections.find(s => s.key === nextVid.sectionKey);
      unlockedLabel = `Section unlocked: ${nextSec ? nextSec.label : 'Next'}`;
      unlockedSection = nextSec || null;
      const secIdx = courseData.sections.findIndex(s => s.key === nextVid.sectionKey);
      const current = parseInt(lsGet(LS_PORTAL_PROGRESS) || '1', 10);
      if (secIdx + 1 > current) lsSet(LS_PORTAL_PROGRESS, String(secIdx + 1));
    }
  }
  buildVideoList(currentSection, currentVideoIdx);
  buildSectionTabs(currentSection);
  const vidGlobalIdx = globalVideoList.findIndex(v => v.id === video.id);
  if (vidGlobalIdx < globalVideoList.length - 1) {
    document.getElementById('btn-next-vid').disabled = false;
  }
  if (unlockedLabel) showToast(unlockedLabel, unlockedSection);
}

function showToast(text, section) {
  const toast = document.getElementById('unlock-toast');
  document.getElementById('unlock-toast-text').textContent = text;
  const color = section ? section.color : 'rgba(170,85,255,1)';
  const [r, g, b] = section ? section.portalColor.split(',').map(Number) : [170, 85, 255];
  toast.style.borderColor = color;
  toast.style.color = color;
  toast.style.background = `rgba(${r},${g},${b},0.08)`;
  toast.style.boxShadow = `0 0 32px rgba(${r},${g},${b},0.28), 0 8px 32px rgba(0,0,0,0.6)`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

function switchSection(section) {
  applyTheme(section);
  const savedVideoId = lsGet('asl_current_video');
  const savedIdx = section.videos.findIndex(v => v.id === savedVideoId);
  const targetIdx = (savedIdx >= 0 && section.key === lsGet('asl_current_section')) ? savedIdx : 0;
  buildVideoList(section, targetIdx);
  loadVideo(section, targetIdx);
  const url = new URL(window.location);
  url.searchParams.set('section', section.key);
  window.history.replaceState({}, '', url);
}

window.addEventListener('message', (e) => {
  try {
    const data = JSON.parse(e.data);
    if (data.event === 'onStateChange' && data.info === 0) {
      document.getElementById('complete-btn-wrap').classList.add('visible');
    }
  } catch(e) {}
});

document.getElementById('btn-prev-vid').addEventListener('click', () => {
  const globalIdx = globalVideoList.findIndex(v => v.id === currentSection.videos[currentVideoIdx].id);
  if (globalIdx > 0) {
    const prev = globalVideoList[globalIdx - 1];
    const prevSec = courseData.sections.find(s => s.key === prev.sectionKey);
    const prevVidIdx = prevSec.videos.findIndex(v => v.id === prev.id);
    if (prevSec.key !== currentSection.key) applyTheme(prevSec);
    buildVideoList(prevSec, prevVidIdx);
    buildSectionTabs(prevSec);
    loadVideo(prevSec, prevVidIdx);
  }
});

document.getElementById('btn-next-vid').addEventListener('click', () => {
  const globalIdx = globalVideoList.findIndex(v => v.id === currentSection.videos[currentVideoIdx].id);
  if (globalIdx < globalVideoList.length - 1) {
    const next = globalVideoList[globalIdx + 1];
    if (!isVideoUnlocked(next.id, globalVideoList)) return;
    const nextSec = courseData.sections.find(s => s.key === next.sectionKey);
    const nextVidIdx = nextSec.videos.findIndex(v => v.id === next.id);
    if (nextSec.key !== currentSection.key) applyTheme(nextSec);
    buildSectionTabs(nextSec);
    buildVideoList(nextSec, nextVidIdx);
    loadVideo(nextSec, nextVidIdx);
  }
});

document.getElementById('complete-btn').addEventListener('click', completeCurrentLesson);

async function init() {
  courseData = await (await fetch('../course-data.json')).json();
  globalVideoList = buildGlobalVideoList(courseData.sections);
  const params = new URLSearchParams(window.location.search);
  const urlSection = params.get('section');
  const savedSection = lsGet('asl_current_section');
  const savedVideo   = lsGet('asl_current_video');
  let section = courseData.sections.find(s => s.key === (urlSection || savedSection)) || courseData.sections[0];
  if (!isVideoUnlocked(section.videos[0].id, globalVideoList)) section = courseData.sections[0];
  let vidIdx = 0;
  if (savedVideo) {
    const found = section.videos.findIndex(v => v.id === savedVideo);
    if (found >= 0 && isVideoUnlocked(section.videos[found].id, globalVideoList)) vidIdx = found;
  }
  applyTheme(section);
  buildSectionTabs(section);
  buildVideoList(section, vidIdx);
  loadVideo(section, vidIdx);
  document.getElementById('loading-overlay').classList.add('hidden');
}

init();
