// timer.js
// Modul countdown reusable: initTimer(), countdown(sec), cancelCountdown(), isCounting()

let state = {
  active: false,
  interval: null,
  resolver: null,
  hud: null,
  num: null,
  cancelled: false,
};

function ensureHUD(hudSelector = '#countdown-hud', numSelector = '#count-num') {
  let hud = document.querySelector(hudSelector);
  let num = document.querySelector(numSelector);

  // Kalau elemen HUD belum ada, bikin otomatis & taruh di .photobooth (fallback: body)
  if (!hud) {
    hud = document.createElement('div');
    hud.id = 'countdown-hud';
    hud.className = 'countdown-hud';
    hud.style.display = 'none';

    num = document.createElement('div');
    num.id = 'count-num';
    num.className = 'count-num';
    num.textContent = '3';

    hud.appendChild(num);
    (document.querySelector('.photobooth') || document.body).appendChild(hud);
  }

  state.hud = hud;
  state.num = num;
}

export function initTimer(opts = {}) {
  const { hudSelector = '#countdown-hud', numSelector = '#count-num' } = opts;
  ensureHUD(hudSelector, numSelector);
}

function finish(completed) {
  if (state.hud) state.hud.style.display = 'none';
  state.active = false;
  const r = state.resolver;
  state.resolver = null;
  if (typeof r === 'function') r(completed && !state.cancelled);
}

export function cancelCountdown() {
  if (!state.active) return;
  state.cancelled = true;
  if (state.interval) {
    clearInterval(state.interval);
    state.interval = null;
  }
  finish(false);
}

export function isCounting() {
  return state.active;
}

export async function countdown(sec = 3) {
  if (!state.hud || !state.num) ensureHUD();
  if (state.active) return false;

  state.active = true;
  state.cancelled = false;

  state.num.textContent = sec;
  state.hud.style.display = 'flex';

  return new Promise((resolve) => {
    state.resolver = resolve;
    let remaining = sec;

    state.interval = setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        state.num.textContent = remaining;
      } else {
        clearInterval(state.interval);
        state.interval = null;
        state.num.textContent = '📸';
        setTimeout(() => finish(true), 120);
      }
    }, 1000);
  });
}
