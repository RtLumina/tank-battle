/* =========================================================
   TANK BATTLE
   A dependency-free HTML5 canvas arcade game.
   ========================================================= */

(() => {
  'use strict';

  // -------------------------------------------------------
  // Constants & helpers
  // -------------------------------------------------------

  const TILE = 32;
  const COLS = 25;
  const ROWS = 25;
  const W = COLS * TILE;
  const H = ROWS * TILE;
  const TAU = Math.PI * 2;
  const HALF_PI = Math.PI / 2;

  const T = Object.freeze({
    EMPTY: 0,
    BRICK: 1,
    STEEL: 2,
    WATER: 3,
    GRASS: 4,
  });

  const BASE = Object.freeze({
    col: 11,
    row: 23,
    cols: 2,
    rows: 2,
    x: 11 * TILE,
    y: 23 * TILE,
    w: TILE * 2,
    h: TILE * 2,
    cx: 12 * TILE,
    cy: 24 * TILE,
  });

  const PLAYER_SPAWN = Object.freeze({ col: 8, row: 23 });
  const SPAWN_POINTS = Object.freeze([
    { x: 1 * TILE + TILE / 2, y: TILE / 2, col: 1 },
    { x: 12 * TILE + TILE / 2, y: TILE / 2, col: 12 },
    { x: 23 * TILE + TILE / 2, y: TILE / 2, col: 23 },
  ]);

  const BASE_WALL_CELLS = Object.freeze([
    [10, 22], [11, 22], [12, 22], [13, 22],
    [10, 23], [13, 23],
    [10, 24], [13, 24],
  ]);

  const DIR = Object.freeze({
    up: { x: 0, y: -1, angle: 0, opposite: 'down' },
    right: { x: 1, y: 0, angle: HALF_PI, opposite: 'left' },
    down: { x: 0, y: 1, angle: Math.PI, opposite: 'up' },
    left: { x: -1, y: 0, angle: -HALF_PI, opposite: 'right' },
  });
  const DIR_NAMES = Object.keys(DIR);

  const TILETYPE = { B: T.BRICK, S: T.STEEL, W: T.WATER, G: T.GRASS };

  const PLAYER_LEVELS = Object.freeze([
    { fireDelay: 0.3, maxBullets: 2, bulletSpeed: 470, breakSteel: false },
    { fireDelay: 0.24, maxBullets: 2, bulletSpeed: 510, breakSteel: false },
    { fireDelay: 0.18, maxBullets: 3, bulletSpeed: 570, breakSteel: true },
  ]);

  const ENEMY_TYPES = Object.freeze({
    basic: {
      speed: 62, hp: 1, score: 100, bulletSpeed: 215,
      reload: [2.2, 3.4], body: '#aab7c2', dark: '#43525c', light: '#eaf4f8',
      accent: '#ff5f6d', tread: '#3a464e', label: '轻型',
    },
    fast: {
      speed: 100, hp: 1, score: 200, bulletSpeed: 245,
      reload: [2.3, 3.5], body: '#69d3eb', dark: '#276678', light: '#e2fbff',
      accent: '#f4fdff', tread: '#33545f', label: '高速',
    },
    power: {
      speed: 66, hp: 1, score: 300, bulletSpeed: 325,
      reload: [1.35, 2.05], body: '#76e695', dark: '#286640', light: '#dcffe7',
      accent: '#b6ff69', tread: '#33523d', label: '火力',
    },
    armor: {
      speed: 52, hp: 3, score: 400, bulletSpeed: 235,
      reload: [1.9, 2.9], body: '#e7b45c', dark: '#714817', light: '#ffedb9',
      accent: '#ff8350', tread: '#544631', label: '重甲',
    },
  });

  const PLAYER_PALETTE = Object.freeze({
    body: '#f7c85a', dark: '#855511', light: '#fff0af',
    accent: '#61e8ff', tread: '#554c37',
  });

  const POWERUP_DEFS = Object.freeze({
    star: { label: '火力升级', sub: '主炮威力提升', glyph: '★', color: '#ffc857', weight: 2.4 },
    shield: { label: '能量护盾', sub: '10 秒无敌防护', glyph: '⬢', color: '#61e8ff', weight: 2.1 },
    bomb: { label: '全屏爆破', sub: '摧毁所有在场敌军', glyph: '✹', color: '#ff5f6d', weight: 1.35 },
    life: { label: '备用战车', sub: '生命 +1', glyph: '✚', color: '#6ef3a5', weight: 1.05 },
    shovel: { label: '基地加固', sub: '老鹰防线临时钢化', glyph: '▤', color: '#c6d7dd', weight: 1.25 },
    clock: { label: '时间冻结', sub: '敌军停止行动 7 秒', glyph: '◷', color: '#8db8ff', weight: 1.3 },
  });

  const STAGES = [
    {
      name: 'OUTPOST',
      nameZh: '前哨站',
      theme: {
        bgTop: '#07151b', bgBottom: '#030a0d',
        glow: 'rgba(40, 157, 180, 0.14)', grid: 'rgba(97, 232, 255, 0.052)',
        line: 'rgba(97, 232, 255, 0.36)',
      },
      features: [
        ['B', 3, 3, 3, 2, true],
        ['B', 8, 2, 2, 4, true],
        ['S', 3, 7, 1, 3, true],
        ['B', 6, 8, 3, 1, true],
        ['G', 3, 11, 3, 2, true],
        ['B', 7, 11, 2, 2, true],
        ['B', 11, 5, 3, 1, false],
        ['G', 11, 7, 3, 3, false],
        ['B', 10, 12, 2, 1, true],
        ['S', 12, 12, 1, 1, false],
        ['W', 2, 16, 4, 3, true],
        ['B', 7, 16, 2, 2, true],
        ['B', 7, 19, 2, 2, true],
        ['G', 3, 13, 3, 2, true],
        ['G', 11, 15, 3, 3, false],
      ],
    },
    {
      name: 'FOUNDRY',
      nameZh: '熔炉',
      theme: {
        bgTop: '#17120c', bgBottom: '#080706',
        glow: 'rgba(206, 112, 33, 0.12)', grid: 'rgba(255, 188, 115, 0.045)',
        line: 'rgba(255, 184, 92, 0.3)',
      },
      features: [
        ['B', 2, 3, 3, 2, true],
        ['S', 7, 2, 1, 4, true],
        ['B', 4, 6, 3, 1, true],
        ['B', 2, 8, 2, 2, true],
        ['B', 7, 8, 2, 2, true],
        ['W', 1, 12, 3, 5, true],
        ['S', 12, 4, 1, 2, false],
        ['B', 10, 7, 4, 1, false],
        ['W', 10, 11, 5, 1, false],
        ['B', 11, 13, 3, 2, false],
        ['B', 7, 15, 2, 4, true],
        ['B', 4, 18, 3, 2, true],
        ['B', 8, 19, 1, 3, true],
        ['G', 4, 10, 2, 2, true],
        ['G', 4, 21, 2, 1, true],
      ],
    },
    {
      name: 'JUNGLE',
      nameZh: '丛林',
      theme: {
        bgTop: '#07140d', bgBottom: '#030906',
        glow: 'rgba(49, 153, 90, 0.12)', grid: 'rgba(110, 243, 165, 0.04)',
        line: 'rgba(110, 243, 165, 0.27)',
      },
      features: [
        ['G', 2, 2, 4, 4, true],
        ['B', 7, 2, 2, 3, true],
        ['S', 2, 7, 1, 2, true],
        ['G', 3, 8, 4, 3, true],
        ['B', 8, 7, 1, 4, true],
        ['B', 2, 13, 3, 2, true],
        ['W', 2, 18, 4, 2, true],
        ['G', 7, 15, 3, 4, true],
        ['B', 7, 11, 2, 2, true],
        ['S', 12, 5, 1, 2, false],
        ['B', 10, 8, 5, 1, false],
        ['G', 10, 9, 5, 2, false],
        ['B', 11, 13, 3, 1, false],
        ['S', 12, 20, 1, 1, false],
        ['B', 4, 21, 2, 1, true],
        ['G', 2, 20, 2, 1, true],
      ],
    },
  ];

  const DEFAULT_THEME = STAGES[0].theme;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (min = 0, max = 1) => min + Math.random() * (max - min);
  const randInt = (min, max) => Math.floor(rand(min, max + 1));
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const padScore = (value) => String(Math.max(0, Math.floor(value))).padStart(6, '0');
  const padStage = (value) => String(value).padStart(2, '0');
  const cellCenter = (index) => index * TILE + TILE / 2;
  const distSq = (x1, y1, x2, y2) => (x1 - x2) ** 2 + (y1 - y2) ** 2;

  function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function hash2(x, y) {
    let h = x * 374761393 + y * 668265263;
    h = (h ^ (h >> 13)) * 1274126177;
    return ((h ^ (h >> 16)) >>> 0) / 4294967295;
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function random() {
      a += 0x6D2B79F5;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function tankRect(tank) {
    return { x: tank.x - tank.w / 2, y: tank.y - tank.h / 2, w: tank.w, h: tank.h };
  }

  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function safeStorageGet(key, fallback = null) {
    try {
      const value = window.localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (error) {
      return fallback;
    }
  }

  function safeStorageSet(key, value) {
    try {
      window.localStorage.setItem(key, String(value));
    } catch (error) {
      // Storage can be unavailable in private mode. The game still works.
    }
  }

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  // -------------------------------------------------------
  // DOM
  // -------------------------------------------------------

  const $ = (selector) => document.querySelector(selector);
  const canvas = $('#game');
  const ctx = canvas.getContext('2d', { alpha: false });
  const screen = $('#game-screen');
  const scoreEl = $('#score');
  const highScoreEl = $('#high-score');
  const stageEl = $('#stage');
  const stageNameEl = $('#stage-name');
  const powerMeterEl = $('#power-meter');
  const livesEl = $('#lives');
  const enemyCountEl = $('#enemy-count');
  const enemyMeterFill = $('#enemy-meter-fill');
  const statusWrap = $('.deck__status');
  const statusTextEl = $('#status-text');
  const soundButton = $('#sound-button');
  const pauseButton = $('#pause-button');
  const fullscreenButton = $('#fullscreen-button');
  const startButton = $('#start-button');
  const stageBanner = $('#stage-banner');
  const bannerStage = $('#banner-stage');
  const bannerName = $('#banner-name');
  const toastEl = $('#toast');
  const toastGlyph = $('#toast-glyph');
  const toastTitle = $('#toast-title');
  const toastSub = $('#toast-sub');
  const overlays = new Map(
    Array.from(document.querySelectorAll('[data-overlay]')).map((el) => [el.dataset.overlay, el])
  );
  const touchControls = $('#touch-controls');
  const fireButton = $('#fire-button');

  // -------------------------------------------------------
  // Canvas sizing
  // -------------------------------------------------------

  let dpr = 1;

  function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.lineJoin = 'round';
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, { passive: true });

  // -------------------------------------------------------
  // Audio
  // -------------------------------------------------------

  const Sound = (() => {
    let audioContext = null;
    let master = null;
    let noiseBuffer = null;
    let enabled = safeStorageGet('tank-battle-muted', '0') !== '1';

    function init() {
      if (!enabled) return;
      if (audioContext) {
        if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
        return;
      }
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return;
      try {
        audioContext = new AudioCtor();
        master = audioContext.createGain();
        master.gain.value = 0.72;
        master.connect(audioContext.destination);

        const length = Math.floor(audioContext.sampleRate * 0.7);
        noiseBuffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
      } catch (error) {
        audioContext = null;
      }
    }

    function tone(frequency, endFrequency, duration, type = 'square', volume = 0.03, delay = 0) {
      if (!audioContext || !master || !enabled) return;
      const start = audioContext.currentTime + delay;
      const end = start + duration;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(Math.max(20, frequency), start);
      if (endFrequency) {
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), end);
      }
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(start);
      oscillator.stop(end + 0.03);
    }

    function noise(duration = 0.2, volume = 0.06, cutoff = 900, type = 'lowpass', delay = 0) {
      if (!audioContext || !master || !noiseBuffer || !enabled) return;
      const start = audioContext.currentTime + delay;
      const end = start + duration;
      const source = audioContext.createBufferSource();
      const filter = audioContext.createBiquadFilter();
      const gain = audioContext.createGain();
      source.buffer = noiseBuffer;
      filter.type = type;
      filter.frequency.setValueAtTime(cutoff, start);
      filter.Q.value = 0.7;
      gain.gain.setValueAtTime(volume, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      source.start(start);
      source.stop(end + 0.02);
    }

    function arpeggio(frequencies, step = 0.075, volume = 0.024) {
      frequencies.forEach((frequency, index) => {
        tone(frequency, frequency * 1.01, 0.1, 'square', volume, index * step);
      });
    }

    function play(name) {
      if (!enabled) return;
      if (!audioContext) init();
      if (!audioContext || audioContext.state === 'suspended') return;
      switch (name) {
        case 'shoot':
          tone(720, 190, 0.075, 'square', 0.024);
          break;
        case 'enemyShoot':
          tone(330, 105, 0.1, 'square', 0.015);
          break;
        case 'brick':
          noise(0.1, 0.055, 1250);
          tone(190, 60, 0.055, 'triangle', 0.018);
          break;
        case 'steel':
          tone(1750, 1150, 0.075, 'triangle', 0.018);
          noise(0.035, 0.014, 2800, 'highpass');
          break;
        case 'enemyHit':
          noise(0.07, 0.05, 1800);
          tone(220, 110, 0.08, 'square', 0.02);
          break;
        case 'explosion':
          noise(0.36, 0.12, 700);
          tone(110, 35, 0.36, 'sine', 0.075);
          break;
        case 'playerHit':
          noise(0.55, 0.16, 520);
          tone(90, 28, 0.5, 'sawtooth', 0.09);
          tone(170, 55, 0.24, 'square', 0.035);
          break;
        case 'shield':
          tone(900, 1450, 0.11, 'sine', 0.024);
          tone(1350, 720, 0.13, 'triangle', 0.016, 0.035);
          break;
        case 'pickup':
          arpeggio([523.25, 659.25, 987.77], 0.065, 0.026);
          break;
        case 'spawn':
          tone(250, 520, 0.12, 'sine', 0.018);
          break;
        case 'stageStart':
          arpeggio([261.63, 392.0, 523.25, 783.99], 0.095, 0.021);
          break;
        case 'stageClear':
          arpeggio([392, 523.25, 659.25, 783.99, 1046.5], 0.1, 0.023);
          break;
        case 'gameOver':
          tone(330, 220, 0.25, 'sawtooth', 0.035);
          tone(220, 110, 0.4, 'sawtooth', 0.037, 0.22);
          tone(110, 45, 0.65, 'triangle', 0.04, 0.5);
          break;
        case 'pause':
          tone(420, 420, 0.055, 'square', 0.018);
          tone(280, 280, 0.07, 'square', 0.014, 0.06);
          break;
        case 'extraLife':
          arpeggio([659.25, 783.99, 1046.5, 1318.5], 0.08, 0.028);
          break;
        case 'fortify':
          tone(190, 380, 0.2, 'triangle', 0.026);
          noise(0.12, 0.035, 420);
          break;
        default:
          break;
      }
    }

    function toggle() {
      enabled = !enabled;
      safeStorageSet('tank-battle-muted', enabled ? '0' : '1');
      if (enabled) {
        init();
        if (audioContext) audioContext.resume().catch(() => {});
      } else if (master && audioContext) {
        master.gain.setTargetAtTime(0, audioContext.currentTime, 0.02);
      }
      if (enabled && master && audioContext) {
        master.gain.setTargetAtTime(0.72, audioContext.currentTime, 0.02);
      }
      updateSoundButton();
      return enabled;
    }

    function setEnabled(value) {
      if (enabled !== value) toggle();
    }

    return { init, play, toggle, setEnabled, isEnabled: () => enabled };
  })();

  function updateSoundButton() {
    const muted = !Sound.isEnabled();
    soundButton.classList.toggle('is-muted', muted);
    soundButton.setAttribute('aria-pressed', String(!muted));
    soundButton.setAttribute('aria-label', muted ? '开启音效' : '关闭音效');
    soundButton.title = muted ? '开启音效 (M)' : '静音 (M)';
  }

  // -------------------------------------------------------
  // Tile sprites
  // -------------------------------------------------------

  const sprites = { brick: [], steel: [], grass: [], water: [] };

  function createCanvas(width, height) {
    const element = document.createElement('canvas');
    element.width = width;
    element.height = height;
    return element;
  }

  function buildBrickSprite(seed) {
    const surface = createCanvas(TILE, TILE);
    const g = surface.getContext('2d');
    const random = mulberry32(seed);
    g.fillStyle = '#150c09';
    g.fillRect(0, 0, TILE, TILE);

    const bodies = ['#993c2a', '#a6432e', '#8e3827'];
    for (let row = 0; row < 4; row += 1) {
      const offset = row % 2 === 0 ? 0 : 8;
      for (let x = -16; x < TILE; x += 16) {
        g.save();
        g.beginPath();
        g.rect(0, row * 8, TILE, 8);
        g.clip();
        const bx = x + offset + 1;
        const by = row * 8 + 1;
        g.fillStyle = bodies[Math.floor(random() * bodies.length)];
        g.fillRect(bx, by, 14, 6);
        g.fillStyle = 'rgba(239, 126, 84, 0.75)';
        g.fillRect(bx, by, 14, 1);
        g.fillStyle = 'rgba(82, 27, 18, 0.85)';
        g.fillRect(bx, by + 5, 14, 1);
        if (random() < 0.46) {
          g.fillStyle = 'rgba(58, 18, 14, 0.9)';
          g.fillRect(bx + 3 + Math.floor(random() * 8), by + 2, 1, 1 + Math.floor(random() * 2));
        }
        if (random() < 0.22) {
          g.fillStyle = 'rgba(255, 169, 105, 0.25)';
          g.fillRect(bx + 1, by + 2, 2, 1);
        }
        g.restore();
      }
    }
    g.fillStyle = 'rgba(255, 255, 255, 0.035)';
    g.fillRect(0, 0, TILE, 1);
    return surface;
  }

  function buildSteelSprite(seed) {
    const surface = createCanvas(TILE, TILE);
    const g = surface.getContext('2d');
    const random = mulberry32(seed);
    g.fillStyle = '#111c22';
    g.fillRect(0, 0, TILE, TILE);

    const gradient = g.createLinearGradient(2, 2, 29, 29);
    gradient.addColorStop(0, '#93a6af');
    gradient.addColorStop(0.45, '#637681');
    gradient.addColorStop(1, '#3e4d56');
    g.fillStyle = gradient;
    g.fillRect(2, 2, 28, 28);

    g.fillStyle = 'rgba(220, 238, 244, 0.68)';
    g.fillRect(3, 3, 26, 2);
    g.fillRect(3, 3, 2, 26);
    g.fillStyle = 'rgba(15, 24, 29, 0.82)';
    g.fillRect(3, 27, 26, 2);
    g.fillRect(27, 3, 2, 26);

    g.strokeStyle = 'rgba(20, 33, 39, 0.82)';
    g.lineWidth = 1;
    g.strokeRect(6.5, 6.5, 19, 19);

    const rivets = [[5.5, 5.5], [26.5, 5.5], [5.5, 26.5], [26.5, 26.5]];
    rivets.forEach(([x, y]) => {
      g.fillStyle = '#2e3d45';
      g.beginPath();
      g.arc(x, y, 1.55, 0, TAU);
      g.fill();
      g.fillStyle = 'rgba(231, 245, 248, 0.75)';
      g.fillRect(x - 0.8, y - 1.2, 1, 1);
    });

    if (random() > 0.45) {
      g.fillStyle = 'rgba(255, 255, 255, 0.09)';
      g.beginPath();
      g.moveTo(8, 24);
      g.lineTo(23, 8);
      g.lineTo(25, 10);
      g.lineTo(10, 25);
      g.closePath();
      g.fill();
    }
    return surface;
  }

  function buildGrassSprite(seed) {
    const surface = createCanvas(TILE, TILE);
    const g = surface.getContext('2d');
    const random = mulberry32(seed);
    g.fillStyle = 'rgba(5, 28, 17, 0.62)';
    g.fillRect(0, 0, TILE, TILE);

    for (let i = 0; i < 34; i += 1) {
      const x = Math.floor(random() * TILE);
      const y = Math.floor(random() * TILE);
      const dark = random() < 0.55;
      g.fillStyle = dark ? 'rgba(7, 48, 26, 0.95)' : 'rgba(25, 88, 42, 0.94)';
      g.fillRect(x, y, 1 + Math.floor(random() * 2), 2 + Math.floor(random() * 3));
      if (random() < 0.45) {
        g.fillStyle = 'rgba(106, 178, 93, 0.55)';
        g.fillRect(x, y, 1, 1);
      }
    }
    for (let i = 0; i < 7; i += 1) {
      const x = Math.floor(random() * (TILE - 6)) + 2;
      const y = Math.floor(random() * (TILE - 5)) + 2;
      const scale = 2 + Math.floor(random() * 3);
      g.strokeStyle = random() < 0.5 ? 'rgba(21, 75, 38, 0.9)' : 'rgba(15, 57, 31, 0.95)';
      g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(x, y + scale);
      g.lineTo(x + 1.5, y);
      g.lineTo(x + 3, y + scale);
      g.stroke();
    }
    return surface;
  }

  function buildWaterSprite(seed) {
    const surface = createCanvas(TILE, TILE);
    const g = surface.getContext('2d');
    const random = mulberry32(seed);
    const gradient = g.createLinearGradient(0, 0, 0, TILE);
    gradient.addColorStop(0, '#0a3549');
    gradient.addColorStop(0.55, '#072b3e');
    gradient.addColorStop(1, '#041f30');
    g.fillStyle = gradient;
    g.fillRect(0, 0, TILE, TILE);
    g.fillStyle = 'rgba(1, 11, 18, 0.26)';
    g.fillRect(0, 0, TILE, 1);
    g.fillRect(0, 0, 1, TILE);
    for (let i = 0; i < 5; i += 1) {
      g.fillStyle = `rgba(96, 222, 255, ${0.035 + random() * 0.045})`;
      g.fillRect(Math.floor(random() * 18), Math.floor(random() * TILE), 4 + Math.floor(random() * 10), 1);
    }
    return surface;
  }

  function initTileSprites() {
    sprites.brick = [buildBrickSprite(1841), buildBrickSprite(7731), buildBrickSprite(2917)];
    sprites.steel = [buildSteelSprite(141), buildSteelSprite(9103)];
    sprites.grass = [buildGrassSprite(91), buildGrassSprite(4501), buildGrassSprite(8803)];
    sprites.water = [buildWaterSprite(3201), buildWaterSprite(6247)];
  }
  initTileSprites();

  // -------------------------------------------------------
  // Game state
  // -------------------------------------------------------

  const game = {
    state: 'title',
    time: 0,
    stage: 1,
    mapConfig: STAGES[0],
    map: [],
    player: null,
    enemies: [],
    bullets: [],
    particles: [],
    rings: [],
    floaters: [],
    powerups: [],
    flow: null,
    flowDirty: false,
    base: { alive: true, flash: 0 },
    score: 0,
    highScore: Number(safeStorageGet('tank-battle-high-score', '0')) || 0,
    lives: 3,
    playerLevel: 1,
    introTimer: 0,
    endTimer: 0,
    endReason: '',
    clearStarted: false,
    clearTimer: 0,
    respawnTimer: 0,
    stageSettings: null,
    totalEnemies: 0,
    spawnedCount: 0,
    defeatedCount: 0,
    maxAlive: 3,
    spawnInterval: 2.4,
    spawnTimer: 0,
    spawnOrder: [0, 1, 2],
    spawnCursor: 0,
    carrierSpawns: new Set(),
    freezeTimer: 0,
    fortifyTimer: 0,
    shake: 0,
    flash: 0,
    stageScoreStart: 0,
    hasStartedOnce: false,
  };

  const input = {
    directions: [],
    fireKeys: new Set(),
    firePointers: new Set(),
  };

  let lastFrame = 0;
  let toastTimeout = 0;
  let bannerTimeout = 0;
  let groundDust = [];

  // -------------------------------------------------------
  // Map creation
  // -------------------------------------------------------

  function buildMap(config) {
    const map = Array.from({ length: ROWS }, () => new Uint8Array(COLS));

    const stamp = (kind, x, y, w, h) => {
      const type = TILETYPE[kind];
      if (type === undefined) return;
      for (let row = y; row < y + h; row += 1) {
        for (let col = x; col < x + w; col += 1) {
          if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
            map[row][col] = type;
          }
        }
      }
    };

    config.features.forEach(([kind, x, y, w = 1, h = 1, mirror = false]) => {
      stamp(kind, x, y, w, h);
      if (mirror) stamp(kind, COLS - x - w, y, w, h);
    });

    // Base structure is always carved last so the layout can never smother it.
    for (let row = BASE.row; row < BASE.row + BASE.rows; row += 1) {
      for (let col = BASE.col; col < BASE.col + BASE.cols; col += 1) {
        map[row][col] = T.EMPTY;
      }
    }

    BASE_WALL_CELLS.forEach(([col, row]) => {
      map[row][col] = T.BRICK;
    });

    // Keep the player's deployment cell and both spawn lanes clear.
    for (let row = 22; row <= 24; row += 1) {
      for (let col = PLAYER_SPAWN.col - 1; col <= PLAYER_SPAWN.col + 1; col += 1) {
        if (map[row] && map[row][col] !== undefined) map[row][col] = T.EMPTY;
      }
    }
    for (let row = 0; row <= 1; row += 1) {
      map[row].fill(T.EMPTY);
    }

    return map;
  }

  function isBlockingTile(type) {
    return type === T.BRICK || type === T.STEEL || type === T.WATER;
  }

  function neighborCells() {
    return DIR_NAMES.map((name) => {
      const info = DIR[name];
      return { col: info.x, row: info.y, dir: name };
    });
  }

  // Weighted Dijkstra flow field from the eagle. Brick walls are expensive but
  // traversable (enemies can shoot through them); steel and water are not.
  function rebuildFlowField() {
    const size = COLS * ROWS;
    const distances = new Float32Array(size);
    distances.fill(Infinity);
    const heap = [];

    const push = (index, distance) => {
      heap.push({ index, distance });
      let position = heap.length - 1;
      while (position > 0) {
        const parent = (position - 1) >> 1;
        if (heap[parent].distance <= heap[position].distance) break;
        [heap[parent], heap[position]] = [heap[position], heap[parent]];
        position = parent;
      }
    };

    const pop = () => {
      if (!heap.length) return null;
      const top = heap[0];
      const end = heap.pop();
      if (heap.length && end) {
        heap[0] = end;
        let position = 0;
        while (true) {
          const left = position * 2 + 1;
          const right = left + 1;
          let smallest = position;
          if (left < heap.length && heap[left].distance < heap[smallest].distance) smallest = left;
          if (right < heap.length && heap[right].distance < heap[smallest].distance) smallest = right;
          if (smallest === position) break;
          [heap[position], heap[smallest]] = [heap[smallest], heap[position]];
          position = smallest;
        }
      }
      return top;
    };

    for (let row = BASE.row; row < BASE.row + BASE.rows; row += 1) {
      for (let col = BASE.col; col < BASE.col + BASE.cols; col += 1) {
        const index = row * COLS + col;
        distances[index] = 0;
        push(index, 0);
      }
    }

    const moves = neighborCells();
    const visited = new Uint8Array(size);

    while (heap.length) {
      const node = pop();
      if (!node) break;
      const { index, distance } = node;
      if (visited[index] || distance !== distances[index]) continue;
      visited[index] = 1;
      const col = index % COLS;
      const row = Math.floor(index / COLS);

      for (const move of moves) {
        const nextCol = col + move.col;
        const nextRow = row + move.row;
        if (nextCol < 0 || nextCol >= COLS || nextRow < 0 || nextRow >= ROWS) continue;
        const tile = game.map[nextRow][nextCol];
        if (tile === T.STEEL || tile === T.WATER) continue;
        const nextIndex = nextRow * COLS + nextCol;
        if (visited[nextIndex]) continue;
        const weight = tile === T.BRICK ? 10 : 1;
        const nextDistance = distance + weight;
        if (nextDistance < distances[nextIndex]) {
          distances[nextIndex] = nextDistance;
          push(nextIndex, nextDistance);
        }
      }
    }

    const flow = new Array(size).fill(null);
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const index = row * COLS + col;
        if (!Number.isFinite(distances[index])) continue;
        let best = distances[index];
        let bestDir = null;
        for (const move of moves) {
          const nextCol = col + move.col;
          const nextRow = row + move.row;
          if (nextCol < 0 || nextCol >= COLS || nextRow < 0 || nextRow >= ROWS) continue;
          const nextIndex = nextRow * COLS + nextCol;
          if (distances[nextIndex] < best) {
            best = distances[nextIndex];
            bestDir = move.dir;
          }
        }
        flow[index] = bestDir;
      }
    }

    game.flow = flow;
    game.flowDirty = false;
  }

  function getMapTileAt(x, y) {
    const col = Math.floor(x / TILE);
    const row = Math.floor(y / TILE);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return T.STEEL;
    return game.map[row][col];
  }

  // -------------------------------------------------------
  // Entity helpers
  // -------------------------------------------------------

  function allTanks() {
    const tanks = [];
    if (game.player && game.player.alive) tanks.push(game.player);
    game.enemies.forEach((enemy) => {
      if (enemy.alive) tanks.push(enemy);
    });
    return tanks;
  }

  function makePlayer() {
    return {
      team: 'player',
      type: 'player',
      x: cellCenter(PLAYER_SPAWN.col),
      y: cellCenter(PLAYER_SPAWN.row),
      dir: 'up',
      speed: 148,
      w: 26,
      h: 26,
      alive: true,
      hp: 1,
      maxHp: 1,
      spawnTimer: 0.72,
      spawnMax: 0.72,
      shield: 3.8,
      fireCooldown: 0,
      recoil: 0,
      tread: 0,
      hitFlash: 0,
      isCarrier: false,
      scoreValue: 0,
    };
  }

  function makeEnemy(type, carrier, settings) {
    const config = ENEMY_TYPES[type];
    return {
      team: 'enemy',
      type,
      x: 0,
      y: 0,
      dir: 'down',
      speed: config.speed * settings.speedScale,
      w: 26,
      h: 26,
      alive: true,
      hp: config.hp,
      maxHp: config.hp,
      spawnTimer: 0.85,
      spawnMax: 0.85,
      shield: 0,
      fireCooldown: rand(0.9, 1.8),
      reload: config.reload,
      bulletSpeed: config.bulletSpeed,
      aiTimer: rand(0.15, 0.6),
      recoil: 0,
      tread: 0,
      hitFlash: 0,
      isCarrier: carrier,
      scoreValue: config.score,
    };
  }

  function spawnPlayer(initial = false) {
    const player = makePlayer();
    if (!canOccupy(player, player.x, player.y)) return false;
    if (!initial) {
      player.spawnTimer = 0.75;
      player.spawnMax = 0.75;
      player.shield = 3.8;
    }
    game.player = player;
    game.respawnTimer = 0;
    addSpawnBurst(player.x, player.y, '#61e8ff');
    if (!initial) Sound.play('spawn');
    updateHUD();
    return true;
  }

  function canOccupy(tank, x, y, ignoreTanks = false) {
    const halfW = tank.w / 2;
    const halfH = tank.h / 2;
    if (x - halfW < 1 || x + halfW > W - 1 || y - halfH < 1 || y + halfH > H - 1) return false;

    const left = Math.max(0, Math.floor((x - halfW) / TILE));
    const right = Math.min(COLS - 1, Math.floor((x + halfW - 0.01) / TILE));
    const top = Math.max(0, Math.floor((y - halfH) / TILE));
    const bottom = Math.min(ROWS - 1, Math.floor((y + halfH - 0.01) / TILE));

    for (let row = top; row <= bottom; row += 1) {
      for (let col = left; col <= right; col += 1) {
        if (isBlockingTile(game.map[row][col])) return false;
      }
    }

    if (game.base.alive) {
      if (rectsOverlap(
        { x: x - halfW, y: y - halfH, w: tank.w, h: tank.h },
        { x: BASE.x, y: BASE.y, w: BASE.w, h: BASE.h }
      )) return false;
    }

    if (!ignoreTanks) {
      for (const other of allTanks()) {
        if (other === tank || !other.alive) continue;
        if (
          Math.abs(x - other.x) < (tank.w + other.w) / 2 - 2 &&
          Math.abs(y - other.y) < (tank.h + other.h) / 2 - 2
        ) {
          return false;
        }
      }
    }
    return true;
  }

  function setTankDirection(tank, direction) {
    const previous = tank.dir;
    const wasVertical = previous === 'up' || previous === 'down';
    const isVertical = direction === 'up' || direction === 'down';
    tank.dir = direction;

    if (wasVertical !== isVertical) {
      if (isVertical) {
        const snapped = Math.round((tank.x - TILE / 2) / TILE) * TILE + TILE / 2;
        if (Math.abs(snapped - tank.x) > 0.1 && canOccupy(tank, snapped, tank.y)) {
          tank.x = snapped;
        }
      } else {
        const snapped = Math.round((tank.y - TILE / 2) / TILE) * TILE + TILE / 2;
        if (Math.abs(snapped - tank.y) > 0.1 && canOccupy(tank, tank.x, snapped)) {
          tank.y = snapped;
        }
      }
    }
  }

  function moveTank(tank, dt) {
    const direction = DIR[tank.dir];
    const distance = tank.speed * dt;
    const nextX = tank.x + direction.x * distance;
    const nextY = tank.y + direction.y * distance;
    if (!canOccupy(tank, nextX, nextY)) return false;
    tank.x = nextX;
    tank.y = nextY;
    tank.tread += distance;
    return true;
  }

  function tankCenter(tank) {
    return { x: tank.x, y: tank.y };
  }

  function activeBulletsOf(owner) {
    let count = 0;
    for (const bullet of game.bullets) {
      if (!bullet.dead && bullet.owner === owner) count += 1;
    }
    return count;
  }

  function fireTank(tank) {
    if (!tank || !tank.alive || tank.spawnTimer > 0) return false;
    if (tank.fireCooldown > 0) return false;
    const isPlayer = tank.team === 'player';
    const maxBullets = isPlayer ? PLAYER_LEVELS[game.playerLevel - 1].maxBullets : 1;
    if (activeBulletsOf(tank) >= maxBullets) return false;

    const direction = DIR[tank.dir];
    const speed = isPlayer ? PLAYER_LEVELS[game.playerLevel - 1].bulletSpeed : tank.bulletSpeed;
    const muzzle = 17;
    const bullet = {
      x: tank.x + direction.x * muzzle,
      y: tank.y + direction.y * muzzle,
      dir: tank.dir,
      speed,
      team: tank.team,
      owner: tank,
      w: 6,
      h: 6,
      dead: false,
      power: isPlayer && PLAYER_LEVELS[game.playerLevel - 1].breakSteel,
      color: isPlayer ? '#ffd166' : '#ff5f6d',
      life: 0,
    };
    game.bullets.push(bullet);

    if (isPlayer) {
      tank.fireCooldown = PLAYER_LEVELS[game.playerLevel - 1].fireDelay;
      Sound.play('shoot');
    } else {
      const reloadScale = game.stageSettings?.reloadScale ?? 1;
      tank.fireCooldown = rand(tank.reload[0], tank.reload[1]) * reloadScale;
      Sound.play('enemyShoot');
    }
    tank.recoil = 0.09;
    addMuzzleFlash(bullet.x, bullet.y, tank.dir, isPlayer ? '#ffd166' : '#ff7b86');
    return true;
  }

  // -------------------------------------------------------
  // Game flow
  // -------------------------------------------------------

  function getStageSettings(stage) {
    return {
      total: Math.min(20, 10 + stage * 2),
      maxAlive: Math.min(6, 3 + Math.floor((stage + 1) / 2)),
      spawnInterval: Math.max(1.15, 2.45 - (stage - 1) * 0.08),
      speedScale: 1 + Math.min(0.32, (stage - 1) * 0.032),
      reloadScale: Math.max(0.62, 1 - (stage - 1) * 0.045),
    };
  }

  function getCarrierSpawns(total) {
    return new Set([
      4,
      Math.min(total - 1, Math.ceil(total / 2) + 2),
      total,
    ]);
  }

  function startNewGame() {
    Sound.init();
    hideAllOverlays();
    clearInput();
    clearTimeout(toastTimeout);
    toastEl.classList.remove('is-visible');
    game.score = 0;
    game.lives = 3;
    game.playerLevel = 1;
    game.highScore = Number(safeStorageGet('tank-battle-high-score', '0')) || game.highScore;
    game.hasStartedOnce = true;
    startStage(1);
  }

  function startStage(stageNumber) {
    const config = STAGES[(stageNumber - 1) % STAGES.length];
    const settings = getStageSettings(stageNumber);

    game.stage = stageNumber;
    game.mapConfig = config;
    game.map = buildMap(config);
    game.stageSettings = settings;
    game.state = 'playing';
    game.score = game.score || 0;
    game.playerLevel = 1;
    game.stageScoreStart = game.score;
    game.player = null;
    game.enemies = [];
    game.bullets = [];
    game.particles = [];
    game.rings = [];
    game.floaters = [];
    game.powerups = [];
    game.base.alive = true;
    game.base.flash = 0;
    game.introTimer = 2.15;
    game.endTimer = 0;
    game.endReason = '';
    game.clearStarted = false;
    game.clearTimer = 0;
    game.respawnTimer = 0;
    game.totalEnemies = settings.total;
    game.spawnedCount = 0;
    game.defeatedCount = 0;
    game.maxAlive = settings.maxAlive;
    game.spawnInterval = settings.spawnInterval;
    game.spawnTimer = 0.45;
    game.spawnOrder = shuffle([0, 1, 2]);
    game.spawnCursor = 0;
    game.carrierSpawns = getCarrierSpawns(settings.total);
    game.freezeTimer = 0;
    game.fortifyTimer = 0;
    game.shake = 0;
    game.flash = 0;

    buildGroundDust();
    rebuildFlowField();
    spawnPlayer(true);
    hideAllOverlays();
    clearInput();
    clearTimeout(toastTimeout);
    toastEl.classList.remove('is-visible');
    showStageBanner();
    updateSoundButton();
    setPauseEnabled(true);
    updateHUD();
    setStatus('DEPLOYING', 'live');
    Sound.play('stageStart');
    focusGame();
  }

  function focusGame() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    try {
      canvas.focus({ preventScroll: true });
    } catch (error) {
      // Focus is a convenience; ignore browsers that reject it.
    }
  }

  function beginGameOver(reason) {
    if (game.state !== 'playing' || game.endTimer > 0) return;
    game.endReason = reason;
    game.endTimer = 1.5;
    game.clearStarted = false;
    clearInput();
    setPauseEnabled(false);
    setStatus('CRITICAL', 'over');
    hideStageBanner();
  }

  function showGameOver() {
    if (game.state !== 'playing') return;
    game.endTimer = 0;
    game.state = 'gameover';
    game.clearStarted = false;
    if (game.score > game.highScore) {
      game.highScore = game.score;
      safeStorageSet('tank-battle-high-score', game.highScore);
    }
    setOverlay('over');
    $('#gameover-reason').textContent = game.endReason || '基地失守。';
    $('#final-score').textContent = padScore(game.score);
    $('#final-high').textContent = padScore(game.highScore);
    $('#final-stage').textContent = padStage(game.stage);
    setPauseEnabled(false);
    setStatus('SIGNAL LOST', 'over');
    hideStageBanner();
    toastEl.classList.remove('is-visible');
    updateHUD();
    Sound.play('gameOver');
  }

  function finishStage() {
    if (game.state !== 'playing' || game.endTimer > 0) return;
    const bonus = 500 + game.stage * 150;
    game.score += bonus;
    if (game.score > game.highScore) {
      game.highScore = game.score;
      safeStorageSet('tank-battle-high-score', game.highScore);
    }
    game.state = 'stageclear';
    game.clearStarted = false;
    game.clearTimer = 0;
    clearInput();
    hideStageBanner();
    clearTimeout(toastTimeout);
    toastEl.classList.remove('is-visible');
    $('#clear-score').textContent = padScore(game.score);
    $('#clear-bonus').textContent = `+${String(bonus).padStart(4, '0')}`;
    $('#clear-next-stage').textContent = `NEXT · STAGE ${padStage(game.stage + 1)}`;
    setOverlay('clear');
    setPauseEnabled(false);
    setStatus('SECTOR CLEAR', 'clear');
    updateHUD();
    Sound.play('stageClear');
  }

  function startNextStage() {
    if (game.state !== 'stageclear') return;
    hideAllOverlays();
    clearInput();
    startStage(game.stage + 1);
  }

  function goToTitle() {
    clearInput();
    hideStageBanner();
    toastEl.classList.remove('is-visible');
    clearTimeout(toastTimeout);
    game.state = 'title';
    game.score = 0;
    game.lives = 3;
    game.stage = 1;
    game.playerLevel = 1;
    game.mapConfig = STAGES[0];
    game.map = buildMap(STAGES[0]);
    game.base.alive = true;
    game.base.flash = 0;
    game.enemies = [];
    game.bullets = [];
    game.particles = [];
    game.rings = [];
    game.floaters = [];
    game.powerups = [];
    game.totalEnemies = 0;
    game.defeatedCount = 0;
    game.spawnedCount = 0;
    game.introTimer = 0;
    game.endTimer = 0;
    game.endReason = '';
    game.clearStarted = false;
    game.freezeTimer = 0;
    game.fortifyTimer = 0;
    game.shake = 0;
    game.flash = 0;
    game.player = makePlayer();
    game.player.spawnTimer = 0;
    game.player.shield = 0;
    buildGroundDust();
    rebuildFlowField();
    setOverlay('title');
    setPauseEnabled(false);
    setStatus('STANDBY', 'idle');
    updateHUD();
  }

  function togglePause() {
    if (game.state === 'playing' && game.endTimer <= 0) {
      game.state = 'paused';
      game.shake = 0;
      clearInput();
      setOverlay('pause');
      setPauseEnabled(true);
      setStatus('PAUSED', 'pause');
      Sound.play('pause');
    } else if (game.state === 'paused') {
      game.state = 'playing';
      hideAllOverlays();
      clearInput();
      setPauseEnabled(true);
      setStatus(game.introTimer > 0 ? 'DEPLOYING' : 'IN COMBAT', 'live');
      Sound.play('pause');
      focusGame();
    }
  }

  function autoPause() {
    if (game.state === 'playing' && game.endTimer <= 0) {
      togglePause();
    }
  }

  function setPauseEnabled(enabled) {
    pauseButton.disabled = !enabled;
    pauseButton.classList.toggle('is-paused', game.state === 'paused');
    pauseButton.setAttribute('aria-label', game.state === 'paused' ? '继续游戏' : '暂停游戏');
    pauseButton.title = game.state === 'paused' ? '继续 (P)' : '暂停 (P)';
  }

  function setStatus(text, tone = 'live') {
    statusTextEl.textContent = text;
    statusWrap.dataset.tone = tone;
  }

  // -------------------------------------------------------
  // Overlays, toast, banner, HUD
  // -------------------------------------------------------

  function setOverlay(name) {
    overlays.forEach((element, key) => {
      const active = key === name;
      element.classList.toggle('is-active', active);
      element.setAttribute('aria-hidden', String(!active));
    });
  }

  function hideAllOverlays() {
    overlays.forEach((element) => {
      element.classList.remove('is-active');
      element.setAttribute('aria-hidden', 'true');
    });
  }

  function showToast(glyph, title, sub, color) {
    clearTimeout(toastTimeout);
    toastGlyph.textContent = glyph;
    toastTitle.textContent = title;
    toastSub.textContent = sub;
    toastEl.style.setProperty('--toast-color', color);
    toastEl.classList.remove('is-visible');
    // Force the entry transition to replay for consecutive pickups.
    void toastEl.offsetWidth;
    toastEl.classList.add('is-visible');
    toastTimeout = window.setTimeout(() => {
      toastEl.classList.remove('is-visible');
    }, 2200);
  }

  function showStageBanner() {
    clearTimeout(bannerTimeout);
    bannerStage.textContent = `STAGE ${padStage(game.stage)}`;
    bannerName.textContent = game.mapConfig.nameZh;
    stageBanner.classList.remove('is-visible');
    void stageBanner.offsetWidth;
    stageBanner.classList.add('is-visible');
    bannerTimeout = window.setTimeout(() => {
      stageBanner.classList.remove('is-visible');
    }, 2300);
  }

  function hideStageBanner() {
    clearTimeout(bannerTimeout);
    stageBanner.classList.remove('is-visible');
  }

  function lifeIconMarkup() {
    return `
      <svg class="life-tank" viewBox="0 0 20 16" aria-hidden="true">
        <rect x="1" y="5" width="4" height="10" rx="1" fill="currentColor" opacity=".7"/>
        <rect x="15" y="5" width="4" height="10" rx="1" fill="currentColor" opacity=".7"/>
        <path d="M5 6h10v8H5z" fill="currentColor"/>
        <path d="M8 2h4v5H8zM9 0h2v4H9z" fill="currentColor"/>
        <path d="M5 8h10v2H5z" fill="#071114" opacity=".5"/>
      </svg>`;
  }

  function updateHUD() {
    scoreEl.textContent = padScore(game.score);
    highScoreEl.textContent = padScore(game.highScore);
    stageEl.textContent = padStage(game.stage);
    stageNameEl.textContent = game.mapConfig?.name ?? 'OUTPOST';

    Array.from(powerMeterEl.children).forEach((pip, index) => {
      pip.classList.toggle('is-on', index < game.playerLevel);
    });

    const iconCount = Math.min(game.lives, 4);
    let livesMarkup = '';
    for (let i = 0; i < iconCount; i += 1) livesMarkup += lifeIconMarkup();
    if (game.lives > 4) livesMarkup += `<span class="life-extra">+${game.lives - 4}</span>`;
    if (!livesMarkup) livesMarkup = '<span class="life-extra" style="color: var(--red)">—</span>';
    livesEl.innerHTML = livesMarkup;
    livesEl.setAttribute('aria-label', `剩余生命 ${game.lives}`);

    const remaining = Math.max(0, game.totalEnemies - game.defeatedCount);
    enemyCountEl.textContent = String(Math.min(remaining, 99)).padStart(2, '0');
    enemyMeterFill.style.width = game.totalEnemies
      ? `${(remaining / game.totalEnemies) * 100}%`
      : '0%';
  }

  // -------------------------------------------------------
  // Input
  // -------------------------------------------------------

  const KEY_DIRECTIONS = Object.freeze({
    ArrowUp: 'up',
    KeyW: 'up',
    ArrowRight: 'right',
    KeyD: 'right',
    ArrowDown: 'down',
    KeyS: 'down',
    ArrowLeft: 'left',
    KeyA: 'left',
  });

  function addDirection(id, direction) {
    const index = input.directions.findIndex((entry) => entry.id === id);
    if (index >= 0) {
      if (input.directions[index].direction === direction) return;
      input.directions.splice(index, 1);
    }
    input.directions.push({ id, direction });
  }

  function removeDirection(id) {
    const index = input.directions.findIndex((entry) => entry.id === id);
    if (index >= 0) input.directions.splice(index, 1);
  }

  function heldDirection() {
    if (!input.directions.length) return null;
    return input.directions[input.directions.length - 1].direction;
  }

  function isFiring() {
    return input.fireKeys.size > 0 || input.firePointers.size > 0;
  }

  function clearInput() {
    input.directions.length = 0;
    input.fireKeys.clear();
    input.firePointers.clear();
    document.querySelectorAll('.dpad__key.is-active, .fire-button.is-active').forEach((element) => {
      element.classList.remove('is-active');
    });
  }

  function overlayButtonIsFocused() {
    return document.activeElement instanceof HTMLButtonElement &&
      Boolean(document.querySelector('.overlay.is-active'));
  }

  function handleKeyDown(event) {
    const code = event.code;
    const direction = KEY_DIRECTIONS[code];

    if (direction) {
      if (game.state === 'playing') {
        event.preventDefault();
        addDirection(`key:${code}`, direction);
      } else if (game.state === 'paused') {
        event.preventDefault();
      }
      return;
    }

    if (code === 'Space') {
      if (overlayButtonIsFocused()) return;
      if (game.state === 'title') {
        event.preventDefault();
        startNewGame();
        return;
      }
      if (game.state === 'stageclear') {
        event.preventDefault();
        startNextStage();
        return;
      }
      if (game.state === 'gameover') {
        event.preventDefault();
        startNewGame();
        return;
      }
      if (game.state === 'playing') {
        event.preventDefault();
        input.fireKeys.add('Space');
        requestPlayerFire();
      }
      return;
    }

    if (code === 'Enter') {
      if (overlayButtonIsFocused()) return;
      if (game.state === 'title') {
        event.preventDefault();
        startNewGame();
      } else if (game.state === 'paused') {
        event.preventDefault();
        togglePause();
      } else if (game.state === 'stageclear') {
        event.preventDefault();
        startNextStage();
      } else if (game.state === 'gameover') {
        event.preventDefault();
        startNewGame();
      }
      return;
    }

    if (code === 'KeyJ' && game.state === 'playing') {
      event.preventDefault();
      input.fireKeys.add('KeyJ');
      requestPlayerFire();
      return;
    }

    if (code === 'KeyP' || code === 'Escape') {
      if (event.repeat) return;
      if (game.state === 'playing' || game.state === 'paused') {
        event.preventDefault();
        togglePause();
      }
      return;
    }

    if (code === 'KeyM' && !event.repeat) {
      Sound.toggle();
    }
  }

  function handleKeyUp(event) {
    const code = event.code;
    removeDirection(`key:${code}`);
    input.fireKeys.delete(code);
  }

  window.addEventListener('keydown', handleKeyDown, { passive: false });
  window.addEventListener('keyup', handleKeyUp);

  // Unlock WebAudio on the first deliberate gesture.
  function unlockAudio() {
    Sound.init();
  }
  window.addEventListener('pointerdown', unlockAudio, { once: true, capture: true });
  window.addEventListener('keydown', unlockAudio, { once: true, capture: true });

  // Keyboard layout: the whole page is the controller during play.
  document.addEventListener('contextmenu', (event) => {
    if (screen.contains(event.target) || touchControls.contains(event.target)) {
      event.preventDefault();
    }
  });

  // Touch D-pad
  document.querySelectorAll('[data-dir]').forEach((button) => {
    const direction = button.dataset.dir;

    const press = (event) => {
      if (game.state !== 'playing') return;
      event.preventDefault();
      try {
        button.setPointerCapture(event.pointerId);
      } catch (error) {
        // Synthetic pointer events (and a few embedded browsers) cannot be
        // captured, but they should still control the game.
      }
      button.classList.add('is-active');
      addDirection(`touch:${event.pointerId}`, direction);
    };

    const release = (event) => {
      event.preventDefault();
      button.classList.remove('is-active');
      removeDirection(`touch:${event.pointerId}`);
    };

    button.addEventListener('pointerdown', press);
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
  });

  // Touch fire
  if (fireButton) {
    const pressFire = (event) => {
      if (game.state !== 'playing') return;
      event.preventDefault();
      try {
        fireButton.setPointerCapture(event.pointerId);
      } catch (error) {
        // See the D-pad handler above.
      }
      fireButton.classList.add('is-active');
      input.firePointers.add(event.pointerId);
      requestPlayerFire();
    };
    const releaseFire = (event) => {
      event.preventDefault();
      fireButton.classList.remove('is-active');
      input.firePointers.delete(event.pointerId);
    };
    fireButton.addEventListener('pointerdown', pressFire);
    fireButton.addEventListener('pointerup', releaseFire);
    fireButton.addEventListener('pointercancel', releaseFire);
    fireButton.addEventListener('lostpointercapture', releaseFire);
  }

  // Overlay / dialog buttons
  document.addEventListener('click', (event) => {
    const actionButton = event.target.closest('[data-action]');
    if (!actionButton) return;
    const action = actionButton.dataset.action;
    actionButton.blur();
    switch (action) {
      case 'start':
      case 'restart':
        startNewGame();
        break;
      case 'resume':
        togglePause();
        break;
      case 'next':
        startNextStage();
        break;
      case 'quit':
        goToTitle();
        break;
      default:
        break;
    }
  });

  soundButton.addEventListener('click', () => {
    Sound.toggle();
    soundButton.blur();
  });

  pauseButton.addEventListener('click', () => {
    togglePause();
  });

  if (!document.documentElement.requestFullscreen) {
    fullscreenButton.hidden = true;
  } else {
    fullscreenButton.addEventListener('click', async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        } else {
          await document.exitFullscreen();
        }
      } catch (error) {
        // Fullscreen may be blocked by browser policy; fail silently.
      }
      fullscreenButton.blur();
    });
    document.addEventListener('fullscreenchange', () => {
      fullscreenButton.setAttribute(
        'aria-label',
        document.fullscreenElement ? '退出全屏' : '切换全屏'
      );
    });
  }

  window.addEventListener('blur', autoPause);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) autoPause();
  });

  // -------------------------------------------------------
  // Update
  // -------------------------------------------------------

  function updateAmbient(dt) {
    game.time += dt;
    game.shake = Math.max(0, game.shake - dt * 18);
    game.flash = Math.max(0, game.flash - dt * 1.9);
    updateParticles(dt);
    updateRings(dt);
    updateFloaters(dt);
  }

  function requestPlayerFire() {
    if (game.state !== 'playing' || game.introTimer > 0 || game.endTimer > 0 || game.clearStarted) {
      return;
    }
    fireTank(game.player);
  }

  function updateGame(dt) {
    game.time += dt;
    updateAmbientEffects(dt);

    if (game.state !== 'playing') return;

    if (game.introTimer > 0) {
      game.introTimer = Math.max(0, game.introTimer - dt);
      if (game.introTimer === 0) setStatus('IN COMBAT', 'live');
      return;
    }

    if (game.endTimer > 0) {
      game.endTimer = Math.max(0, game.endTimer - dt);
      if (game.endTimer === 0) showGameOver();
      return;
    }

    if (game.clearStarted) {
      game.clearTimer -= dt;
      if (game.clearTimer <= 0) finishStage();
      return;
    }

    updateTimers(dt);
    updatePlayer(dt);
    updateRespawn(dt);
    updateEnemies(dt);
    updateBullets(dt);

    if (game.endTimer <= 0) {
      updatePowerups(dt);
      updateSpawner(dt);
    }

    cleanupEntities();
    if (game.flowDirty) rebuildFlowField();
    checkStageProgress(dt);
  }

  function updateAmbientEffects(dt) {
    game.shake = Math.max(0, game.shake - dt * 21);
    game.flash = Math.max(0, game.flash - dt * 2.1);
    updateParticles(dt);
    updateRings(dt);
    updateFloaters(dt);
  }

  function updateTimers(dt) {
    if (game.freezeTimer > 0) {
      game.freezeTimer = Math.max(0, game.freezeTimer - dt);
    }

    if (game.fortifyTimer > 0) {
      game.fortifyTimer = Math.max(0, game.fortifyTimer - dt);
      if (game.fortifyTimer === 0) {
        BASE_WALL_CELLS.forEach(([col, row]) => {
          if (game.map[row] && game.map[row][col] !== undefined) {
            game.map[row][col] = T.BRICK;
          }
        });
        game.flowDirty = true;
        Sound.play('brick');
        showToast('▤', '基地装甲解除', '砖墙重新暴露', '#c6d7dd');
      }
    }

    if (game.player) {
      game.player.recoil = Math.max(0, game.player.recoil - dt);
    }
  }

  function updatePlayer(dt) {
    const player = game.player;
    if (!player || !player.alive) return;

    player.fireCooldown = Math.max(0, player.fireCooldown - dt);
    player.hitFlash = Math.max(0, player.hitFlash - dt);
    if (player.shield > 0) player.shield = Math.max(0, player.shield - dt);

    if (player.spawnTimer > 0) {
      player.spawnTimer = Math.max(0, player.spawnTimer - dt);
      return;
    }

    const direction = heldDirection();
    if (direction) {
      if (direction !== player.dir) setTankDirection(player, direction);
      moveTank(player, dt);
    }

    if (isFiring()) {
      fireTank(player);
    }
  }

  function updateRespawn(dt) {
    if (game.player || game.lives <= 0 || game.endTimer > 0) return;
    if (game.respawnTimer <= 0) return;
    game.respawnTimer -= dt;
    if (game.respawnTimer <= 0) {
      if (!spawnPlayer()) {
        game.respawnTimer = 0.4;
      } else {
        setStatus('IN COMBAT', 'live');
      }
    }
  }

  function updateEnemies(dt) {
    for (const enemy of game.enemies) {
      if (!enemy.alive) continue;
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
      enemy.recoil = Math.max(0, enemy.recoil - dt);

      if (enemy.spawnTimer > 0) {
        enemy.spawnTimer = Math.max(0, enemy.spawnTimer - dt);
        continue;
      }

      if (game.freezeTimer > 0) continue;

      enemy.fireCooldown = Math.max(0, enemy.fireCooldown - dt);
      enemy.aiTimer -= dt;

      if (enemy.aiTimer <= 0) {
        const direction = chooseEnemyDirection(enemy);
        if (direction && direction !== enemy.dir) setTankDirection(enemy, direction);
        enemy.aiTimer = rand(0.45, 0.95);
      }

      if (enemy.fireCooldown <= 0) {
        const aim = findAimDirection(enemy);
        if (aim) {
          if (enemy.dir !== aim) setTankDirection(enemy, aim);
          fireTank(enemy);
        } else if (frontTileIsBrick(enemy)) {
          fireTank(enemy);
        } else if (Math.random() < 0.55) {
          fireTank(enemy);
        }
      }

      const moved = moveTank(enemy, dt);
      if (!moved) {
        enemy.aiTimer = Math.min(enemy.aiTimer, 0.08);
        if (frontTileIsBrick(enemy) && enemy.fireCooldown <= 0) {
          fireTank(enemy);
        }
      }
    }
  }

  function findAimDirection(enemy) {
    const targets = [];
    if (game.player && game.player.alive) targets.push(game.player);
    targets.push({ x: BASE.cx, y: BASE.cy });

    for (const target of targets) {
      const dx = target.x - enemy.x;
      const dy = target.y - enemy.y;
      if (Math.abs(dx) <= 18 && Math.abs(dy) > 12) {
        return dy > 0 ? 'down' : 'up';
      }
      if (Math.abs(dy) <= 18 && Math.abs(dx) > 12) {
        return dx > 0 ? 'right' : 'left';
      }
    }
    return null;
  }

  function chooseEnemyDirection(enemy) {
    const col = clamp(Math.floor(enemy.x / TILE), 0, COLS - 1);
    const row = clamp(Math.floor(enemy.y / TILE), 0, ROWS - 1);
    const flowDirection = game.flow[row * COLS + col];
    const options = [];

    if (flowDirection) options.push(flowDirection);

    if (game.player && game.player.alive && Math.random() < 0.18) {
      const dx = game.player.x - enemy.x;
      const dy = game.player.y - enemy.y;
      const horizontal = dx > 0 ? 'right' : 'left';
      const vertical = dy > 0 ? 'down' : 'up';
      if (Math.abs(dx) > Math.abs(dy)) {
        options.push(horizontal, vertical);
      } else {
        options.push(vertical, horizontal);
      }
    }

    if (flowDirection && Math.random() < 0.24) {
      const perp = flowDirection === 'up' || flowDirection === 'down'
        ? (Math.random() < 0.5 ? 'left' : 'right')
        : (Math.random() < 0.5 ? 'up' : 'down');
      options.unshift(perp);
    }

    options.push(...shuffle(DIR_NAMES));

    for (const direction of options) {
      if (direction === DIR[enemy.dir].opposite && Math.random() < 0.55) continue;
      if (!hardBlockedAhead(enemy, direction)) return direction;
    }

    return enemy.dir;
  }

  function hardBlockedAhead(tank, direction) {
    const vector = DIR[direction];
    const probeDistance = 13;
    const probeX = tank.x + vector.x * probeDistance;
    const probeY = tank.y + vector.y * probeDistance;
    const half = tank.w / 2;

    if (probeX - half < 1 || probeX + half > W - 1 || probeY - half < 1 || probeY + half > H - 1) {
      return true;
    }

    const left = clamp(Math.floor((probeX - half) / TILE), 0, COLS - 1);
    const right = clamp(Math.floor((probeX + half - 0.01) / TILE), 0, COLS - 1);
    const top = clamp(Math.floor((probeY - half) / TILE), 0, ROWS - 1);
    const bottom = clamp(Math.floor((probeY + half - 0.01) / TILE), 0, ROWS - 1);

    for (let row = top; row <= bottom; row += 1) {
      for (let col = left; col <= right; col += 1) {
        const tile = game.map[row][col];
        if (tile === T.STEEL || tile === T.WATER) return true;
      }
    }

    if (game.base.alive) {
      if (rectsOverlap(
        { x: probeX - half, y: probeY - half, w: tank.w, h: tank.h },
        { x: BASE.x, y: BASE.y, w: BASE.w, h: BASE.h }
      )) return true;
    }

    for (const other of allTanks()) {
      if (other === tank || !other.alive) continue;
      if (
        Math.abs(probeX - other.x) < (tank.w + other.w) / 2 - 2 &&
        Math.abs(probeY - other.y) < (tank.h + other.h) / 2 - 2
      ) {
        return true;
      }
    }
    return false;
  }

  function frontTileIsBrick(tank) {
    const vector = DIR[tank.dir];
    const frontX = tank.x + vector.x * 18;
    const frontY = tank.y + vector.y * 18;
    return getMapTileAt(frontX, frontY) === T.BRICK;
  }

  function updateBullets(dt) {
    for (const bullet of game.bullets) {
      if (bullet.dead) continue;
      bullet.life += dt;
      const vector = DIR[bullet.dir];
      let remaining = bullet.speed * dt;

      while (remaining > 0 && !bullet.dead) {
        const step = Math.min(6, remaining);
        bullet.x += vector.x * step;
        bullet.y += vector.y * step;
        remaining -= step;

        if (bullet.x < -4 || bullet.x > W + 4 || bullet.y < -4 || bullet.y > H + 4) {
          bullet.dead = true;
          break;
        }

        if (bulletHitsTerrain(bullet)) break;
        if (bulletHitsBase(bullet)) break;
        if (bulletHitsTank(bullet)) break;
      }
    }

    // Player and enemy shells cancel each other out.
    for (let i = 0; i < game.bullets.length; i += 1) {
      const a = game.bullets[i];
      if (a.dead) continue;
      for (let j = i + 1; j < game.bullets.length; j += 1) {
        const b = game.bullets[j];
        if (b.dead || a.team === b.team) continue;
        if (
          Math.abs(a.x - b.x) < 7 &&
          Math.abs(a.y - b.y) < 7
        ) {
          a.dead = true;
          b.dead = true;
          addSparks((a.x + b.x) / 2, (a.y + b.y) / 2, 5, '#ffe3a0');
          break;
        }
      }
    }

    game.bullets = game.bullets.filter((bullet) => !bullet.dead);
  }

  function bulletHitsTerrain(bullet) {
    const col = Math.floor(bullet.x / TILE);
    const row = Math.floor(bullet.y / TILE);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false;
    const tile = game.map[row][col];

    if (tile === T.BRICK) {
      game.map[row][col] = T.EMPTY;
      game.flowDirty = true;
      addBrickDebris(bullet.x, bullet.y, bullet.dir);
      game.shake = Math.max(game.shake, 1.4);
      Sound.play('brick');
      bullet.dead = true;
      return true;
    }

    if (tile === T.STEEL) {
      if (bullet.power) {
        game.map[row][col] = T.EMPTY;
        game.flowDirty = true;
        addSparks(bullet.x, bullet.y, 12, '#ffd166');
        game.shake = Math.max(game.shake, 2.3);
        Sound.play('explosion');
      } else {
        addSparks(bullet.x, bullet.y, 7, '#cde9f1');
        game.shake = Math.max(game.shake, 0.8);
        Sound.play('steel');
      }
      bullet.dead = true;
      return true;
    }

    return false;
  }

  function bulletHitsBase(bullet) {
    if (!game.base.alive) return false;
    if (!rectsOverlap(
      { x: bullet.x - 3, y: bullet.y - 3, w: 6, h: 6 },
      { x: BASE.x, y: BASE.y, w: BASE.w, h: BASE.h }
    )) return false;
    bullet.dead = true;
    destroyBase();
    return true;
  }

  function bulletHitsTank(bullet) {
    if (bullet.team === 'player') {
      for (const enemy of game.enemies) {
        if (!enemy.alive || enemy.spawnTimer > 0) continue;
        if (!rectsOverlap(
          { x: bullet.x - 3, y: bullet.y - 3, w: 6, h: 6 },
          tankRect(enemy)
        )) continue;
        bullet.dead = true;
        damageEnemy(enemy);
        return true;
      }
    } else {
      const player = game.player;
      if (!player || !player.alive || player.spawnTimer > 0) return false;
      if (!rectsOverlap(
        { x: bullet.x - 3, y: bullet.y - 3, w: 6, h: 6 },
        tankRect(player)
      )) return false;
      bullet.dead = true;
      hitPlayer();
      return true;
    }
    return false;
  }

  function damageEnemy(enemy) {
    if (!enemy.alive) return;
    enemy.hp -= 1;
    enemy.hitFlash = 0.12;
    if (enemy.hp <= 0) {
      killEnemy(enemy);
      return;
    }
    addSparks(enemy.x, enemy.y, 7, '#ffd166');
    game.shake = Math.max(game.shake, 1.2);
    Sound.play('enemyHit');
  }

  function killEnemy(enemy, options = {}) {
    if (!enemy.alive) return;
    enemy.alive = false;
    game.defeatedCount += 1;
    addExplosion(enemy.x, enemy.y, 1, ENEMY_TYPES[enemy.type].accent);
    addScore(enemy.scoreValue, enemy.x, enemy.y);
    game.shake = Math.max(game.shake, 4.4);
    Sound.play('explosion');

    if (!options.noDrop && (enemy.isCarrier || Math.random() < 0.045)) {
      dropPowerup(enemy.x, enemy.y);
    }
    updateHUD();
  }

  function hitPlayer() {
    const player = game.player;
    if (!player || !player.alive) return;

    if (player.shield > 0) {
      addSparks(player.x, player.y, 8, '#61e8ff');
      addRing(player.x, player.y, '#61e8ff', 16, 34);
      Sound.play('shield');
      return;
    }

    player.alive = false;
    game.player = null;
    game.lives -= 1;
    game.playerLevel = 1;
    game.bullets = game.bullets.filter((bullet) => bullet.team !== 'player');
    addExplosion(player.x, player.y, 1.35, '#ffc857');
    game.shake = Math.max(game.shake, 8);
    game.flash = Math.max(game.flash, 0.42);
    Sound.play('playerHit');
    updateHUD();

    if (game.lives <= 0) {
      beginGameOver('战车全部损毁，行动终止。');
    } else {
      game.respawnTimer = 1.45;
      setStatus('RESPAWNING', 'pause');
    }
  }

  function destroyBase() {
    if (!game.base.alive) return;
    game.base.alive = false;
    addExplosion(BASE.cx, BASE.cy, 2.35, '#ffc857');
    addExplosion(BASE.cx - 15, BASE.cy - 8, 0.9, '#ff5f6d');
    game.shake = Math.max(game.shake, 11);
    game.flash = Math.max(game.flash, 0.65);
    Sound.play('playerHit');
    beginGameOver('基地老鹰被摧毁，防线失守。');
  }

  function updatePowerups(dt) {
    const player = game.player;
    for (const powerup of game.powerups) {
      powerup.age += dt;
      if (powerup.age >= powerup.ttl) {
        powerup.dead = true;
        continue;
      }
      if (!player || !player.alive) continue;
      if (
        Math.abs(player.x - powerup.x) < 22 &&
        Math.abs(player.y - powerup.y) < 22
      ) {
        collectPowerup(powerup);
      }
    }
    game.powerups = game.powerups.filter((powerup) => !powerup.dead);
  }

  function collectPowerup(powerup) {
    if (powerup.dead) return;
    powerup.dead = true;
    const def = POWERUP_DEFS[powerup.type];
    addScore(200, powerup.x, powerup.y);
    addRing(powerup.x, powerup.y, def.color, 8, 42);
    addSparks(powerup.x, powerup.y, 16, def.color);
    let toastSub = def.sub;

    switch (powerup.type) {
      case 'star':
        if (game.playerLevel < 3) {
          game.playerLevel += 1;
          if (game.playerLevel === 3) toastSub = '钢铁穿透弹已解锁';
        } else {
          addScore(500, powerup.x, powerup.y);
          toastSub = '已满级 · 额外 +500';
        }
        break;
      case 'shield':
        if (game.player) game.player.shield = Math.max(game.player.shield, 10);
        break;
      case 'bomb': {
        const targets = game.enemies.filter((enemy) => enemy.alive);
        targets.forEach((enemy) => killEnemy(enemy, { noDrop: true }));
        game.bullets = game.bullets.filter((bullet) => bullet.team === 'player');
        game.shake = Math.max(game.shake, 10);
        game.flash = Math.max(game.flash, 0.33);
        toastSub = targets.length ? `摧毁 ${targets.length} 辆敌军坦克` : '战场上暂时没有敌人';
        break;
      }
      case 'life':
        game.lives = Math.min(9, game.lives + 1);
        Sound.play('extraLife');
        break;
      case 'shovel':
        fortifyBase(16);
        break;
      case 'clock':
        game.freezeTimer = Math.max(game.freezeTimer, 7);
        break;
      default:
        break;
    }

    Sound.play('pickup');
    showToast(def.glyph, def.label, toastSub, def.color);
    updateHUD();
  }

  function fortifyBase(duration) {
    game.fortifyTimer = duration;
    BASE_WALL_CELLS.forEach(([col, row]) => {
      if (game.map[row] && game.map[row][col] !== undefined) {
        game.map[row][col] = T.STEEL;
      }
    });
    game.flowDirty = true;
    Sound.play('fortify');
    addRing(BASE.cx, BASE.cy, '#c6d7dd', 22, 64);
  }

  function updateSpawner(dt) {
    if (game.spawnedCount >= game.totalEnemies) return;
    if (game.enemies.length >= game.maxAlive) return;

    game.spawnTimer -= dt;
    if (game.spawnTimer > 0) return;

    const spawnChoices = [];
    for (let index = 0; index < game.spawnOrder.length; index += 1) {
      const spawnIndex = game.spawnOrder[(game.spawnCursor + index) % game.spawnOrder.length];
      const point = SPAWN_POINTS[spawnIndex];
      if (spawnPointClear(point.x, point.y)) spawnChoices.push({ spawnIndex, point });
    }

    if (!spawnChoices.length) {
      game.spawnTimer = 0.35;
      return;
    }

    const chosen = spawnChoices[0];
    game.spawnOrder = game.spawnOrder.filter((value) => value !== chosen.spawnIndex);
    game.spawnOrder.push(chosen.spawnIndex);
    game.spawnCursor = 0;

    spawnEnemy(chosen.point);
    game.spawnTimer = game.spawnInterval * rand(0.88, 1.12);
  }

  function spawnPointClear(x, y) {
    if (Math.abs(x - BASE.cx) < BASE.w / 2 + 20 && Math.abs(y - BASE.cy) < BASE.h / 2 + 20) {
      return false;
    }
    for (const tank of allTanks()) {
      if (distSq(x, y, tank.x, tank.y) < 36 * 36) return false;
    }
    return true;
  }

  function chooseEnemyType(spawnNumber) {
    if (spawnNumber === 1) return 'basic';
    const stage = game.stage;
    const armorChance = Math.min(0.24, Math.max(0, (stage - 1) * 0.045));
    const powerChance = Math.min(0.23, 0.025 + (stage - 1) * 0.038);
    const fastChance = Math.min(0.33, 0.2 + (stage - 1) * 0.022);
    const roll = Math.random();

    if (roll < armorChance) return 'armor';
    if (roll < armorChance + powerChance) return 'power';
    if (roll < armorChance + powerChance + fastChance) return 'fast';
    return 'basic';
  }

  function spawnEnemy(point) {
    game.spawnedCount += 1;
    const spawnNumber = game.spawnedCount;
    const type = chooseEnemyType(spawnNumber);
    const isCarrier = game.carrierSpawns.has(spawnNumber);
    const enemy = makeEnemy(type, isCarrier, game.stageSettings);
    enemy.x = point.x;
    enemy.y = point.y;
    game.enemies.push(enemy);
    addSpawnBurst(point.x, point.y, isCarrier ? '#ffc857' : '#ff5f6d');
    addRing(point.x, point.y, isCarrier ? '#ffc857' : '#ff5f6d', 10, 52);
    Sound.play('spawn');
  }

  function checkStageProgress(dt) {
    if (game.endTimer > 0) return;

    if (
      !game.clearStarted &&
      game.base.alive &&
      game.spawnedCount >= game.totalEnemies &&
      game.enemies.length === 0
    ) {
      game.clearStarted = true;
      game.clearTimer = 1.15;
      setStatus('SECTOR CLEAR', 'clear');
      return;
    }

    if (game.clearStarted) {
      game.clearTimer -= dt;
      if (game.clearTimer <= 0) finishStage();
    }
  }

  function cleanupEntities() {
    game.enemies = game.enemies.filter((enemy) => enemy.alive);
    game.bullets = game.bullets.filter((bullet) => !bullet.dead);
    if (game.flowDirty) rebuildFlowField();
  }

  function addScore(amount, x, y) {
    game.score += amount;
    if (game.score > game.highScore) {
      game.highScore = game.score;
      safeStorageSet('tank-battle-high-score', game.highScore);
    }
    addFloater(x, y, `+${amount}`, '#ffd166');
    updateHUD();
  }

  // -------------------------------------------------------
  // Power-up drops
  // -------------------------------------------------------

  function choosePowerupType() {
    const weights = [];
    Object.entries(POWERUP_DEFS).forEach(([key, definition]) => {
      let weight = definition.weight;
      if (key === 'star' && game.playerLevel >= 3) weight *= 0.25;
      if (key === 'life' && game.lives >= 8) weight *= 0.2;
      if (key === 'shovel' && game.fortifyTimer > 5) weight *= 0.3;
      weights.push({ key, weight });
    });
    const total = weights.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * total;
    for (const item of weights) {
      roll -= item.weight;
      if (roll <= 0) return item.key;
    }
    return 'shield';
  }

  function dropPowerup(sourceX, sourceY) {
    if (game.powerups.length >= 3) return;
    const position = findPowerupPosition(sourceX, sourceY);
    if (!position) return;
    const type = choosePowerupType();
    game.powerups.push({
      x: position.x,
      y: position.y,
      type,
      age: 0,
      ttl: 15,
      phase: rand(0, TAU),
      dead: false,
    });
    addRing(position.x, position.y, POWERUP_DEFS[type].color, 7, 34);
    Sound.play('spawn');
  }

  function findPowerupPosition(sourceX, sourceY) {
    const baseCol = clamp(Math.floor(sourceX / TILE), 0, COLS - 1);
    const baseRow = clamp(Math.floor(sourceY / TILE), 0, ROWS - 1);

    for (let radius = 0; radius <= 4; radius += 1) {
      const candidates = [];
      for (let row = baseRow - radius; row <= baseRow + radius; row += 1) {
        for (let col = baseCol - radius; col <= baseCol + radius; col += 1) {
          if (col < 0 || col >= COLS || row < 0 || row >= ROWS) continue;
          if (Math.max(Math.abs(row - baseRow), Math.abs(col - baseCol)) !== radius) continue;
          const tile = game.map[row][col];
          if (tile !== T.EMPTY && tile !== T.GRASS) continue;
          if (
            col >= BASE.col && col < BASE.col + BASE.cols &&
            row >= BASE.row && row < BASE.row + BASE.rows
          ) continue;
          const x = cellCenter(col);
          const y = cellCenter(row);
          if (allTanks().some((tank) => distSq(x, y, tank.x, tank.y) < 28 * 28)) continue;
          if (game.powerups.some((powerup) => Math.abs(powerup.x - x) < 12 && Math.abs(powerup.y - y) < 12)) continue;
          candidates.push({ x, y });
        }
      }
      if (candidates.length) return pick(candidates);
    }
    return null;
  }

  // -------------------------------------------------------
  // Effects
  // -------------------------------------------------------

  function addParticle(particle) {
    game.particles.push({
      x: 0, y: 0, vx: 0, vy: 0, gravity: 0, drag: 0.97,
      life: 0.5, maxLife: 0.5, size: 2, color: '#fff', kind: 'spark',
      ...particle,
    });
  }

  function addExplosion(x, y, scale = 1, color = '#ffc857') {
    addRing(x, y, color, 8 * scale, (34 + 18 * scale), 2.2 * scale);
    const sparkCount = Math.floor(16 * scale);
    for (let i = 0; i < sparkCount; i += 1) {
      const angle = rand(0, TAU);
      const speed = rand(35, 175) * scale;
      addParticle({
        x: x + rand(-4, 4),
        y: y + rand(-4, 4),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 28,
        gravity: 110,
        drag: 0.955,
        life: rand(0.3, 0.9),
        maxLife: 0.9,
        size: rand(1.4, 3.8) * scale,
        color: pick(['#fff2bd', '#ffd166', '#ff963d', '#ff5f3d', color]),
        kind: 'spark',
      });
    }
    const smokeCount = Math.floor(7 * scale);
    for (let i = 0; i < smokeCount; i += 1) {
      const angle = rand(0, TAU);
      const speed = rand(8, 55) * scale;
      addParticle({
        x: x + rand(-5, 5),
        y: y + rand(-5, 5),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 22,
        gravity: -20,
        drag: 0.94,
        life: rand(0.45, 1.25),
        maxLife: 1.25,
        size: rand(4, 10) * scale,
        color: pick(['#1d2628', '#283235', '#343e3e', '#4a4237']),
        kind: 'smoke',
      });
    }
  }

  function addSpawnBurst(x, y, color) {
    addRing(x, y, color, 12, 46, 1.7);
    for (let i = 0; i < 10; i += 1) {
      const angle = rand(0, TAU);
      addParticle({
        x,
        y,
        vx: Math.cos(angle) * rand(40, 90),
        vy: Math.sin(angle) * rand(40, 90),
        gravity: 0,
        drag: 0.92,
        life: rand(0.25, 0.6),
        maxLife: 0.6,
        size: rand(1, 2.5),
        color,
        kind: 'spark',
      });
    }
  }

  function addMuzzleFlash(x, y, direction, color) {
    const vector = DIR[direction];
    for (let i = 0; i < 4; i += 1) {
      addParticle({
        x: x + rand(-3, 3),
        y: y + rand(-3, 3),
        vx: vector.x * rand(30, 90) + rand(-25, 25),
        vy: vector.y * rand(30, 90) + rand(-25, 25),
        gravity: 0,
        drag: 0.86,
        life: rand(0.08, 0.18),
        maxLife: 0.18,
        size: rand(1.2, 2.6),
        color,
        kind: 'spark',
      });
    }
    addRing(x, y, color, 2, 13, 1.1);
  }

  function addBrickDebris(x, y, direction) {
    const vector = DIR[direction];
    addRing(x, y, '#ffb57e', 3, 16, 0.8);
    for (let i = 0; i < 10; i += 1) {
      addParticle({
        x,
        y,
        vx: vector.x * rand(20, 80) + rand(-85, 85),
        vy: vector.y * rand(20, 80) + rand(-95, 45),
        gravity: 250,
        drag: 0.985,
        life: rand(0.25, 0.65),
        maxLife: 0.65,
        size: rand(1.5, 3.8),
        color: pick(['#c05236', '#963a28', '#6c281d', '#e0704d']),
        kind: 'debris',
      });
    }
  }

  function addSparks(x, y, count, color) {
    for (let i = 0; i < count; i += 1) {
      const angle = rand(0, TAU);
      const speed = rand(40, 170);
      addParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 160,
        drag: 0.95,
        life: rand(0.12, 0.4),
        maxLife: 0.4,
        size: rand(1, 2.2),
        color: Math.random() < 0.4 ? '#ffffff' : color,
        kind: 'spark',
      });
    }
  }

  function addRing(x, y, color, startRadius, maxRadius, width = 2) {
    game.rings.push({
      x, y, color, radius: startRadius, maxRadius,
      life: 0.4, maxLife: 0.4, width,
    });
  }

  function addFloater(x, y, text, color) {
    game.floaters.push({
      x: x + rand(-4, 4),
      y: y - 8,
      text,
      color,
      life: 0.85,
      maxLife: 0.85,
    });
  }

  function updateParticles(dt) {
    for (const particle of game.particles) {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += particle.gravity * dt;
      const drag = Math.pow(particle.drag, dt * 60);
      particle.vx *= drag;
      particle.vy *= drag;
    }
    if (game.particles.length > 420) game.particles.splice(0, game.particles.length - 420);
    game.particles = game.particles.filter((particle) => particle.life > 0);
  }

  function updateRings(dt) {
    for (const ring of game.rings) {
      ring.life -= dt;
      ring.radius = lerp(ring.radius, ring.maxRadius, 1 - Math.pow(0.0001, dt));
    }
    game.rings = game.rings.filter((ring) => ring.life > 0);
  }

  function updateFloaters(dt) {
    for (const floater of game.floaters) {
      floater.life -= dt;
      floater.y -= 28 * dt;
    }
    game.floaters = game.floaters.filter((floater) => floater.life > 0);
  }

  // -------------------------------------------------------
  // Rendering
  // -------------------------------------------------------

  const groundSpecks = Array.from({ length: 190 }, () => ({
    x: rand(0, W),
    y: rand(0, H),
    size: rand(0.6, 2),
    alpha: rand(0.025, 0.12),
  }));

  function buildGroundDust() {
    groundDust = Array.from({ length: 24 }, (_, index) => ({
      x: hash2(index, 19) * W,
      y: hash2(index, 71) * H,
      speed: 4 + hash2(index, 41) * 10,
      size: 0.7 + hash2(index, 17) * 1.4,
      phase: hash2(index, 9) * TAU,
    }));
  }
  buildGroundDust();

  function drawGround() {
    const theme = game.mapConfig?.theme ?? DEFAULT_THEME;
    const background = ctx.createLinearGradient(0, 0, 0, H);
    background.addColorStop(0, theme.bgTop);
    background.addColorStop(1, theme.bgBottom);
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, W, H);

    const glow = ctx.createRadialGradient(W * 0.5, H * 0.4, 20, W * 0.5, H * 0.5, W * 0.7);
    glow.addColorStop(0, theme.glow);
    glow.addColorStop(0.65, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    for (let col = 1; col < COLS; col += 1) {
      ctx.moveTo(col * TILE + 0.5, 0);
      ctx.lineTo(col * TILE + 0.5, H);
    }
    for (let row = 1; row < ROWS; row += 1) {
      ctx.moveTo(0, row * TILE + 0.5);
      ctx.lineTo(W, row * TILE + 0.5);
    }
    ctx.stroke();

    // Faint targeting rings at the center of the operations zone.
    ctx.save();
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 108, 0, TAU);
    ctx.arc(W / 2, H / 2, 112, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W / 2 - 128, H / 2);
    ctx.lineTo(W / 2 - 90, H / 2);
    ctx.moveTo(W / 2 + 90, H / 2);
    ctx.lineTo(W / 2 + 128, H / 2);
    ctx.moveTo(W / 2, H / 2 - 128);
    ctx.lineTo(W / 2, H / 2 - 90);
    ctx.moveTo(W / 2, H / 2 + 90);
    ctx.lineTo(W / 2, H / 2 + 128);
    ctx.stroke();
    ctx.restore();

    for (const speck of groundSpecks) {
      ctx.fillStyle = `rgba(195, 235, 238, ${speck.alpha})`;
      ctx.fillRect(speck.x, speck.y, speck.size, speck.size);
    }

    // Corner bracket markings keep the arena feeling like a real cabinet screen.
    ctx.save();
    ctx.strokeStyle = theme.line;
    ctx.globalAlpha = 0.36;
    ctx.lineWidth = 1.5;
    const inset = 10;
    const length = 24;
    const corners = [
      [inset, inset, 1, 1],
      [W - inset, inset, -1, 1],
      [inset, H - inset, 1, -1],
      [W - inset, H - inset, -1, -1],
    ];
    for (const [x, y, sx, sy] of corners) {
      ctx.beginPath();
      ctx.moveTo(x + sx * length, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + sy * length);
      ctx.stroke();
    }

    // Edge warning ticks, offset from the corner brackets.
    ctx.globalAlpha = 0.18;
    for (let x = 64; x < W - 64; x += 64) {
      ctx.fillStyle = theme.line;
      ctx.fillRect(x, 8, 10, 1);
      ctx.fillRect(x, H - 9, 10, 1);
    }
    for (let y = 64; y < H - 64; y += 64) {
      ctx.fillStyle = theme.line;
      ctx.fillRect(8, y, 1, 10);
      ctx.fillRect(W - 9, y, 1, 10);
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 5; i += 1) {
      const y = H * 0.2 + i * H * 0.15;
      ctx.fillStyle = theme.line;
      ctx.beginPath();
      ctx.moveTo(W * 0.015, y);
      ctx.lineTo(W * 0.09, y + 10);
      ctx.lineTo(W * 0.09, y + 14);
      ctx.lineTo(W * 0.015, y + 24);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawWaterTile(col, row, x, y) {
    ctx.drawImage(sprites.water[(col + row) % sprites.water.length], x, y);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, TILE, TILE);
    ctx.clip();
    const time = game.time * 1.5 + col * 0.8 + row * 1.35;
    for (let line = 0; line < 3; line += 1) {
      const baseY = y + 7 + line * 9 + Math.sin(time + line * 1.7) * 1.3;
      ctx.beginPath();
      for (let px = 0; px <= TILE; px += 4) {
        const waveY = baseY + Math.sin(time * 1.9 + px * 0.17 + col * 1.6) * 1.1;
        if (px === 0) ctx.moveTo(x + px, waveY);
        else ctx.lineTo(x + px, waveY);
      }
      ctx.strokeStyle = line === 1 ? 'rgba(108, 229, 255, 0.3)' : 'rgba(83, 200, 230, 0.16)';
      ctx.lineWidth = line === 1 ? 1.25 : 0.8;
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(180, 245, 255, 0.12)';
    const sparkleX = (col * 13 + Math.floor(game.time * 7)) % 27 + 3;
    const sparkleY = (row * 7 + Math.floor(game.time * 5)) % 27 + 3;
    ctx.fillRect(x + sparkleX, y + sparkleY, 2, 1);
    ctx.restore();
  }

  function drawTiles() {
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const tile = game.map[row][col];
        if (tile === T.EMPTY) continue;
        const x = col * TILE;
        const y = row * TILE;
        const variant = Math.floor(hash2(col, row) * 3);

        if (tile === T.BRICK) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
          ctx.fillRect(x + 2, y + 2, TILE - 2, TILE - 2);
          ctx.drawImage(sprites.brick[variant % sprites.brick.length], x, y);
        } else if (tile === T.STEEL) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.fillRect(x + 2, y + 2, TILE - 2, TILE - 2);
          ctx.drawImage(sprites.steel[variant % sprites.steel.length], x, y);
        } else if (tile === T.WATER) {
          drawWaterTile(col, row, x, y);
        } else if (tile === T.GRASS) {
          ctx.fillStyle = 'rgba(11, 46, 27, 0.34)';
          ctx.fillRect(x, y, TILE, TILE);
        }
      }
    }
  }

  function drawGrassOverlay() {
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        if (game.map[row][col] !== T.GRASS) continue;
        const variant = Math.floor(hash2(col + 17, row + 9) * 3) % sprites.grass.length;
        ctx.drawImage(sprites.grass[variant], col * TILE, row * TILE);
      }
    }
  }

  function drawSpawnMarkers() {
    if (game.state !== 'playing') return;
    if (game.spawnedCount >= game.totalEnemies) return;
    ctx.save();
    SPAWN_POINTS.forEach((point, index) => {
      const pulse = 0.26 + Math.sin(game.time * 3.2 + index * 1.3) * 0.1;
      ctx.strokeStyle = `rgba(255, 95, 109, ${pulse})`;
      ctx.fillStyle = `rgba(255, 95, 109, ${pulse * 0.5})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(point.x - 9, 4);
      ctx.lineTo(point.x, 12);
      ctx.lineTo(point.x + 9, 4);
      ctx.stroke();
      ctx.fillRect(point.x - 11, 2, 3, 1);
      ctx.fillRect(point.x + 8, 2, 3, 1);
    });
    ctx.restore();
  }

  function drawBase() {
    const x = BASE.x;
    const y = BASE.y;
    const time = game.time;
    ctx.save();

    // Baseplate
    const plate = ctx.createLinearGradient(x, y, x, y + BASE.h);
    plate.addColorStop(0, game.base.alive ? '#251b0e' : '#131316');
    plate.addColorStop(0.55, game.base.alive ? '#17120b' : '#0b0c0f');
    plate.addColorStop(1, '#050709');
    roundRect(ctx, x + 2, y + 2, BASE.w - 4, BASE.h - 4, 5);
    ctx.fillStyle = plate;
    ctx.fill();
    ctx.strokeStyle = game.base.alive ? 'rgba(190, 143, 59, 0.72)' : 'rgba(72, 75, 79, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.strokeStyle = game.base.alive ? 'rgba(255, 200, 87, 0.15)' : 'rgba(255, 95, 109, 0.11)';
    ctx.lineWidth = 1;
    roundRect(ctx, x + 6.5, y + 6.5, BASE.w - 13, BASE.h - 13, 3);
    ctx.stroke();

    if (game.base.alive) {
      const pulse = 0.5 + Math.sin(time * 2.4) * 0.5;
      ctx.save();
      ctx.shadowColor = `rgba(255, 200, 87, ${0.18 + pulse * 0.12})`;
      ctx.shadowBlur = 16;
      ctx.strokeStyle = `rgba(255, 200, 87, ${0.38 + pulse * 0.18})`;
      ctx.lineWidth = 1;
      roundRect(ctx, x + 9.5, y + 9.5, BASE.w - 19, BASE.h - 19, 2);
      ctx.stroke();
      ctx.restore();

      // Corner hazard bars
      ctx.fillStyle = 'rgba(255, 200, 87, 0.35)';
      ctx.fillRect(x + 5, y + 5, 7, 2);
      ctx.fillRect(x + 5, y + 5, 2, 7);
      ctx.fillRect(x + BASE.w - 12, y + BASE.h - 7, 7, 2);
      ctx.fillRect(x + BASE.w - 7, y + BASE.h - 12, 2, 7);

      ctx.save();
      ctx.translate(x + 8, y + 7);
      ctx.shadowColor = 'rgba(255, 183, 63, 0.38)';
      ctx.shadowBlur = 14 + pulse * 7;

      const eagleArt = [
        '................',
        '.......dd.......',
        '......dyyd......',
        '.....dywwyd.....',
        '....dykwwkyd....',
        '.dd.dyyooyyd.dd.',
        'dyddyywwwwyyddyd',
        'dyyyywwwwwwyyyyd',
        '.dyyyywwwwyyyyd.',
        '..dyyywwwwyyyd..',
        '...dyywwwwyyd...',
        '....dywwwwyd....',
        '.....dyyyyd.....',
        '....dyy..yyd....',
        '...dd......dd...',
        '................',
      ];
      const eagleColors = {
        d: '#5d3808',
        y: '#e2a63b',
        w: '#fff3cf',
        o: '#d8741b',
        k: '#1d1408',
      };
      const cell = 3;
      for (let row = 0; row < eagleArt.length; row += 1) {
        const line = eagleArt[row];
        for (let col = 0; col < line.length; col += 1) {
          const color = eagleColors[line[col]];
          if (!color) continue;
          ctx.fillStyle = color;
          ctx.fillRect(col * cell, row * cell, cell, cell);
          if (line[col] === 'w') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.fillRect(col * cell, row * cell, cell, 1);
          }
        }
      }

      // Tiny crest highlights and a regal underline.
      ctx.fillStyle = 'rgba(255, 238, 180, 0.8)';
      ctx.fillRect(23, 3, 2, 2);
      ctx.fillStyle = 'rgba(134, 82, 15, 0.75)';
      ctx.fillRect(13, 44, 22, 1.5);
      ctx.restore();

      ctx.fillStyle = 'rgba(255, 217, 132, 0.7)';
      ctx.font = '700 5.5px Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('EAGLE', x + BASE.w / 2, y + BASE.h - 6);
      ctx.textAlign = 'left';
    } else {
      const flicker = 0.55 + Math.sin(time * 7.3) * 0.2 + Math.sin(time * 13.1) * 0.1;
      const wreckGlow = ctx.createRadialGradient(x + 32, y + 30, 2, x + 32, y + 30, 30);
      wreckGlow.addColorStop(0, `rgba(255, 90, 70, ${0.2 + flicker * 0.1})`);
      wreckGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = wreckGlow;
      ctx.fillRect(x + 2, y + 2, BASE.w - 4, BASE.h - 4);

      ctx.strokeStyle = 'rgba(65, 52, 45, 0.95)';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x + 18, y + 20);
      ctx.lineTo(x + 46, y + 46);
      ctx.moveTo(x + 46, y + 20);
      ctx.lineTo(x + 20, y + 45);
      ctx.stroke();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255, 92, 61, 0.45)';
      ctx.beginPath();
      ctx.moveTo(x + 25, y + 23);
      ctx.lineTo(x + 40, y + 38);
      ctx.stroke();
      ctx.fillStyle = `rgba(255, 120, 58, ${flicker * 0.7})`;
      ctx.fillRect(x + 29, y + 49, 6, 2);
      ctx.fillRect(x + 36, y + 35, 2, 5);
    }

    ctx.restore();
  }

  function drawPlayerRespawnMarker() {
    if (game.player || game.lives <= 0 || game.respawnTimer <= 0) return;
    const x = cellCenter(PLAYER_SPAWN.col);
    const y = cellCenter(PLAYER_SPAWN.row);
    const progress = ((game.time * 0.9) % 1);
    ctx.save();
    ctx.strokeStyle = 'rgba(97, 232, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.arc(x, y, 20 + Math.sin(game.time * 4) * 2, -HALF_PI, -HALF_PI + progress * TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(217, 243, 247, 0.8)';
    ctx.font = '700 10px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(Math.max(1, Math.ceil(game.respawnTimer)), x, y + 4);
    ctx.textAlign = 'left';
    ctx.restore();
  }

  function drawTank(tank) {
    const isPlayer = tank.team === 'player';
    let palette = isPlayer ? PLAYER_PALETTE : ENEMY_TYPES[tank.type];
    const time = game.time;

    if (tank.isCarrier) {
      const flash = Math.floor(time * 9) % 2 === 0;
      palette = {
        ...palette,
        body: flash ? '#ff6b72' : '#ffd166',
        light: flash ? '#ffe0e1' : '#fff0b5',
      };
    }

    if (tank.hitFlash > 0) {
      palette = { ...palette, body: '#ffffff', light: '#ffffff', dark: '#a9b0b2' };
    }

    const spawnProgress = tank.spawnTimer > 0
      ? 1 - tank.spawnTimer / tank.spawnMax
      : 1;
    const alpha = tank.spawnTimer > 0 ? 0.45 + spawnProgress * 0.55 : 1;

    ctx.save();
    ctx.globalAlpha = alpha;

    if (tank.spawnTimer > 0) {
      const radius = 15 + Math.sin(spawnProgress * Math.PI) * 12;
      ctx.strokeStyle = isPlayer ? 'rgba(97, 232, 255, 0.7)' : 'rgba(255, 95, 109, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(tank.x, tank.y, radius, time * 4, time * 4 + TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      for (let i = 0; i < 4; i += 1) {
        const angle = time * 2.4 + i * HALF_PI;
        const px = tank.x + Math.cos(angle) * radius;
        const py = tank.y + Math.sin(angle) * radius;
        ctx.fillStyle = isPlayer ? '#61e8ff' : '#ff8b92';
        ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
      }
    }

    if (tank.isCarrier) {
      ctx.save();
      ctx.translate(tank.x, tank.y);
      ctx.rotate(time * 1.5);
      ctx.strokeStyle = Math.floor(time * 9) % 2 === 0
        ? 'rgba(255, 200, 87, 0.8)'
        : 'rgba(255, 95, 109, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 5]);
      ctx.strokeRect(-18.5, -18.5, 37, 37);
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(tank.x + 2, tank.y + 5, 13, 10, 0, 0, TAU);
    ctx.fill();

    ctx.translate(tank.x, tank.y);
    ctx.rotate(DIR[tank.dir].angle);

    const scale = tank.spawnTimer > 0 ? 0.7 + spawnProgress * 0.3 : 1;
    ctx.scale(scale, scale);

    // Tracks. The hull is deliberately narrow so both tread bands stay
    // readable at arcade scale.
    const treadOffset = (tank.tread * 0.9) % 5;
    for (const side of [-1, 1]) {
      const trackX = side < 0 ? -13.5 : 7;
      const trackW = 6.5;

      ctx.save();
      roundRect(ctx, trackX, -13, trackW, 26, 2);
      ctx.clip();
      ctx.fillStyle = palette.tread;
      ctx.fillRect(trackX, -13, trackW, 26);
      ctx.fillStyle = 'rgba(7, 13, 15, 0.44)';
      for (let y = -16 + treadOffset; y < 15; y += 5) {
        ctx.fillRect(trackX, y, trackW, 1.8);
      }
      ctx.fillStyle = 'rgba(228, 243, 244, 0.27)';
      for (let y = -14.5 + treadOffset; y < 15; y += 5) {
        ctx.fillRect(trackX + 1, y, trackW - 2, 0.9);
      }
      ctx.fillStyle = 'rgba(235, 250, 251, 0.2)';
      ctx.fillRect(trackX + (side < 0 ? 0.5 : trackW - 1.5), -13, 1, 26);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
      ctx.fillRect(trackX + trackW / 2 - 0.4, -13, 0.8, 26);
      ctx.restore();

      roundRect(ctx, trackX, -13, trackW, 26, 2);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.88)';
      ctx.lineWidth = 1.1;
      ctx.stroke();

      // A thin outer rail keeps the tracks separated from the dark arena.
      ctx.strokeStyle = 'rgba(205, 230, 234, 0.24)';
      ctx.lineWidth = 0.7;
      roundRect(ctx, trackX + 0.45, -12.5, trackW - 0.9, 25, 1.6);
      ctx.stroke();
    }

    // Hull
    const recoil = tank.recoil > 0 ? 1.4 : 0;
    ctx.translate(0, recoil);

    ctx.beginPath();
    ctx.moveTo(-8.2, -9.7);
    ctx.lineTo(8.2, -9.7);
    ctx.lineTo(9.2, -7);
    ctx.lineTo(9.2, 8);
    ctx.lineTo(6.2, 10.8);
    ctx.lineTo(-6.2, 10.8);
    ctx.lineTo(-9.2, 8);
    ctx.lineTo(-9.2, -7);
    ctx.closePath();
    ctx.fillStyle = palette.dark;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.lineWidth = 1.3;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-6.5, -8.4);
    ctx.lineTo(6.5, -8.4);
    ctx.lineTo(7.5, -5.8);
    ctx.lineTo(7.5, 6.8);
    ctx.lineTo(5.2, 9);
    ctx.lineTo(-5.2, 9);
    ctx.lineTo(-7.5, 6.8);
    ctx.lineTo(-7.5, -5.8);
    ctx.closePath();
    ctx.fillStyle = palette.body;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Front plate and side fenders
    ctx.fillStyle = palette.light;
    ctx.globalAlpha = alpha * 0.4;
    ctx.fillRect(-5.8, -7.4, 11.6, 1.5);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = palette.dark;
    ctx.fillRect(-8.8, -6.5, 1.6, 5);
    ctx.fillRect(7.2, -6.5, 1.6, 5);

    // Barrel sits behind the turret hub.
    const barrelLength = isPlayer ? 17.5 : 16.5;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    roundRect(ctx, -3.4, -barrelLength - 1, 6.8, barrelLength + 1, 1.5);
    ctx.fill();
    ctx.fillStyle = palette.dark;
    roundRect(ctx, -2.7, -barrelLength, 5.4, barrelLength - 1, 1.3);
    ctx.fill();
    ctx.fillStyle = palette.body;
    roundRect(ctx, -1.8, -barrelLength + 1, 3.6, barrelLength - 4, 0.8);
    ctx.fill();
    ctx.fillStyle = palette.light;
    ctx.fillRect(-1.1, -barrelLength + 1.5, 1.1, barrelLength - 7);
    ctx.fillStyle = palette.dark;
    roundRect(ctx, -3.8, -barrelLength - 1.5, 7.6, 3, 1);
    ctx.fill();
    ctx.fillStyle = palette.light;
    ctx.globalAlpha = alpha * 0.62;
    ctx.fillRect(-2.8, -barrelLength - 1.1, 5.6, 0.9);
    ctx.globalAlpha = alpha;

    // Turret
    ctx.beginPath();
    ctx.arc(0, 0.8, 6.7, 0, TAU);
    ctx.fillStyle = palette.dark;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0.2, 5.2, 0, TAU);
    ctx.fillStyle = palette.body;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-1.5, -1.1, 2.2, 0, TAU);
    ctx.fillStyle = palette.light;
    ctx.globalAlpha = alpha * 0.45;
    ctx.fill();
    ctx.globalAlpha = alpha;

    // Player insignia / enemy markings
    if (isPlayer) {
      ctx.fillStyle = palette.accent;
      ctx.globalAlpha = alpha * 0.8;
      ctx.beginPath();
      ctx.moveTo(0, -3);
      ctx.lineTo(1.2, -1);
      ctx.lineTo(3.1, -0.6);
      ctx.lineTo(1.6, 0.8);
      ctx.lineTo(2, 2.7);
      ctx.lineTo(0, 1.7);
      ctx.lineTo(-2, 2.7);
      ctx.lineTo(-1.6, 0.8);
      ctx.lineTo(-3.1, -0.6);
      ctx.lineTo(-1.2, -1);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = alpha;
    } else if (tank.type === 'fast') {
      ctx.strokeStyle = palette.accent;
      ctx.globalAlpha = alpha * 0.8;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-6, -3);
      ctx.lineTo(-3.5, -5);
      ctx.moveTo(6, -3);
      ctx.lineTo(3.5, -5);
      ctx.stroke();
      ctx.globalAlpha = alpha;
    } else if (tank.type === 'power') {
      ctx.fillStyle = palette.accent;
      ctx.beginPath();
      ctx.arc(0, 0.3, 2.4, 0, TAU);
      ctx.fill();
    } else if (tank.type === 'armor') {
      ctx.fillStyle = palette.accent;
      ctx.globalAlpha = alpha * 0.75;
      ctx.fillRect(-6.5, -5.5, 4, 1.4);
      ctx.fillRect(2.5, -5.5, 4, 1.4);
      ctx.globalAlpha = alpha;
    }

    ctx.restore();

    // Shield arcs. Broken arcs keep the tank silhouette readable while still
    // reading as an active energy barrier.
    if (tank.shield > 0) {
      const shieldPulse = 0.72 + Math.sin(time * 8) * 0.16;
      ctx.save();
      ctx.translate(tank.x, tank.y);
      ctx.shadowColor = 'rgba(97, 232, 255, 0.55)';
      ctx.shadowBlur = 7;
      ctx.strokeStyle = `rgba(151, 243, 255, ${0.68 * shieldPulse})`;
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i += 1) {
        const start = time * 0.85 + i * HALF_PI + 0.22;
        ctx.beginPath();
        ctx.arc(0, 0, 19.5, start, start + 0.56);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(199, 250, 255, 0.8)';
      for (let i = 0; i < 4; i += 1) {
        const angle = time * 0.85 + i * HALF_PI;
        const px = Math.cos(angle) * 19.5;
        const py = Math.sin(angle) * 19.5;
        ctx.fillRect(px - 1.2, py - 1.2, 2.4, 2.4);
      }
      ctx.restore();
    }

    if (game.freezeTimer > 0 && !isPlayer) {
      ctx.save();
      ctx.translate(tank.x, tank.y);
      ctx.strokeStyle = 'rgba(141, 184, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, 17, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = 'rgba(171, 214, 255, 0.55)';
      [[-13, -12], [12, -10], [-12, 13]].forEach(([x, y]) => {
        ctx.fillRect(x, y, 2, 4);
        ctx.fillRect(x - 1, y + 1, 4, 2);
      });
      ctx.restore();
    }

    // Armor health strip
    if (!isPlayer && tank.maxHp > 1) {
      const pipWidth = 5;
      const totalWidth = tank.maxHp * pipWidth + (tank.maxHp - 1) * 2;
      const startX = tank.x - totalWidth / 2;
      for (let i = 0; i < tank.maxHp; i += 1) {
        ctx.fillStyle = i < tank.hp ? palette.accent : 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(startX + i * (pipWidth + 2), tank.y - 20, pipWidth, 2);
      }
    }
  }

  function drawBullets() {
    for (const bullet of game.bullets) {
      ctx.save();
      ctx.translate(bullet.x, bullet.y);
      ctx.rotate(DIR[bullet.dir].angle);
      ctx.shadowColor = bullet.color;
      ctx.shadowBlur = 8;
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = bullet.color;
      roundRect(ctx, -1.5, 2, 3, 13, 1.5);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = bullet.color;
      roundRect(ctx, -2, -5, 4, 10, 2);
      ctx.fill();
      ctx.fillStyle = '#fff9df';
      ctx.fillRect(-0.8, -4, 1.6, 6);
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  function drawPowerups() {
    for (const powerup of game.powerups) {
      const def = POWERUP_DEFS[powerup.type];
      const bob = Math.sin(game.time * 3 + powerup.phase) * 2;
      const fading = powerup.ttl - powerup.age < 4;
      const blink = fading && Math.floor(powerup.age * 8) % 2 === 0;

      ctx.save();
      ctx.globalAlpha = blink ? 0.25 : 1;
      ctx.translate(powerup.x, powerup.y + bob);

      const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 26);
      glow.addColorStop(0, `${def.color}55`);
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(-28, -28, 56, 56);

      ctx.shadowColor = def.color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#071013';
      roundRect(ctx, -13, -13, 26, 26, 5);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = def.color;
      ctx.lineWidth = 1.4;
      roundRect(ctx, -13, -13, 26, 26, 5);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 0.8;
      roundRect(ctx, -10.5, -10.5, 21, 21, 3);
      ctx.stroke();

      const pulse = 0.6 + Math.sin(game.time * 4 + powerup.phase) * 0.2;
      ctx.strokeStyle = `${def.color}${Math.floor(pulse * 80 + 55).toString(16).padStart(2, '0')}`;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, 17, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);

      drawPowerupGlyph(powerup.type, def.color);
      ctx.restore();
    }
  }

  function drawPowerupGlyph(type, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    switch (type) {
      case 'star': {
        ctx.beginPath();
        for (let i = 0; i < 10; i += 1) {
          const radius = i % 2 === 0 ? 8 : 3.6;
          const angle = -HALF_PI + (i * Math.PI) / 5;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        break;
      }
      case 'shield': {
        ctx.beginPath();
        ctx.moveTo(0, -9);
        ctx.lineTo(7, -5.5);
        ctx.lineTo(6, 2);
        ctx.quadraticCurveTo(4, 7, 0, 9.5);
        ctx.quadraticCurveTo(-4, 7, -6, 2);
        ctx.lineTo(-7, -5.5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#071013';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-2.5, 0);
        ctx.lineTo(-0.2, 3);
        ctx.lineTo(3.8, -3.5);
        ctx.stroke();
        break;
      }
      case 'bomb': {
        ctx.beginPath();
        ctx.arc(-1, 1.5, 6.5, 0, TAU);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(3, -4);
        ctx.quadraticCurveTo(5, -8, 8, -9);
        ctx.stroke();
        ctx.fillStyle = '#fff4b8';
        ctx.fillRect(7, -10, 2, 2);
        ctx.fillRect(5, -11, 1, 1);
        break;
      }
      case 'life': {
        ctx.fillRect(-2.2, -8, 4.4, 16);
        ctx.fillRect(-8, -2.2, 16, 4.4);
        ctx.fillStyle = '#071013';
        ctx.fillRect(-1.3, -6, 2.6, 12);
        ctx.fillRect(-6, -1.3, 12, 2.6);
        break;
      }
      case 'shovel': {
        ctx.strokeRect(-8, -6, 16, 12);
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(8, 0);
        ctx.moveTo(0, -6);
        ctx.lineTo(0, 0);
        ctx.moveTo(-4, 0);
        ctx.lineTo(-4, 6);
        ctx.moveTo(4, 0);
        ctx.lineTo(4, 6);
        ctx.stroke();
        ctx.fillRect(-8, -8, 16, 2);
        break;
      }
      case 'clock': {
        ctx.beginPath();
        ctx.arc(0, 0, 8.2, 0, TAU);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -5);
        ctx.moveTo(0, 0);
        ctx.lineTo(4, 2);
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.fillRect(-1, -1, 2, 2);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -10.5);
        ctx.lineTo(0, -9);
        ctx.moveTo(0, 10.5);
        ctx.lineTo(0, 9);
        ctx.stroke();
        break;
      }
      default:
        break;
    }
    ctx.restore();
  }

  function drawParticles() {
    for (const particle of game.particles) {
      const alpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.globalAlpha = particle.kind === 'smoke' ? alpha * 0.32 : alpha;
      ctx.fillStyle = particle.color;
      if (particle.kind === 'smoke') {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * (1.6 - alpha * 0.6), 0, TAU);
        ctx.fill();
      } else if (particle.kind === 'debris') {
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.life * 5);
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        ctx.restore();
      } else {
        ctx.fillRect(
          particle.x - particle.size / 2,
          particle.y - particle.size / 2,
          particle.size,
          particle.size
        );
      }
    }
    ctx.globalAlpha = 1;

    for (const ring of game.rings) {
      const alpha = clamp(ring.life / ring.maxLife, 0, 1);
      ctx.strokeStyle = ring.color;
      ctx.globalAlpha = alpha * 0.68;
      ctx.lineWidth = ring.width;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, Math.max(0.1, ring.radius), 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawFloaters() {
    ctx.save();
    ctx.font = '700 11px Consolas, monospace';
    ctx.textAlign = 'center';
    for (const floater of game.floaters) {
      const alpha = clamp(floater.life / floater.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = floater.color;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(floater.text, floater.x, floater.y);
    }
    ctx.restore();
  }

  function drawAmbientDust() {
    if (reducedMotion) return;
    ctx.save();
    for (const mote of groundDust) {
      const y = (mote.y - game.time * mote.speed + H * 4) % H;
      const x = mote.x + Math.sin(game.time * 0.35 + mote.phase) * 6;
      ctx.globalAlpha = 0.07 + Math.abs(Math.sin(game.time * 0.7 + mote.phase)) * 0.07;
      ctx.fillStyle = '#b9ecf2';
      ctx.fillRect(x, y, mote.size, mote.size);
    }
    ctx.restore();
  }

  function drawFreezeTint() {
    if (game.state !== 'playing' || game.freezeTimer <= 0) return;
    const alpha = 0.04 + Math.sin(game.time * 3) * 0.015;
    ctx.fillStyle = `rgba(86, 153, 255, ${alpha})`;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.strokeStyle = 'rgba(130, 185, 255, 0.14)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, H - 2);
    ctx.restore();
  }

  function drawCanvasEdge() {
    const theme = game.mapConfig?.theme ?? DEFAULT_THEME;
    ctx.save();
    ctx.strokeStyle = theme.line;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

    // Tiny status readout, kept inside the simulated CRT.
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = theme.line;
    ctx.font = '700 6px Consolas, monospace';
    const defenseOnline = game.base.alive && game.state !== 'gameover';
    ctx.fillText(`DEFENSE GRID // ${defenseOnline ? 'ONLINE' : 'OFFLINE'}`, 17, H - 17);
    ctx.textAlign = 'right';
    ctx.fillText('SECTOR ' + padStage(game.stage), W - 17, H - 17);
    ctx.textAlign = 'left';
    ctx.restore();
  }

  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    drawGround();

    ctx.save();
    if (!reducedMotion && game.shake > 0.2) {
      ctx.translate(rand(-game.shake, game.shake), rand(-game.shake, game.shake));
    }

    drawTiles();
    drawBase();
    drawSpawnMarkers();
    drawPlayerRespawnMarker();

    game.enemies.forEach((enemy) => {
      if (enemy.alive) drawTank(enemy);
    });
    if (game.player && game.player.alive) drawTank(game.player);

    drawBullets();
    drawGrassOverlay();
    drawPowerups();
    drawParticles();
    drawFloaters();
    ctx.restore();

    drawAmbientDust();
    drawFreezeTint();
    drawCanvasEdge();

    if (game.flash > 0.01) {
      ctx.fillStyle = `rgba(255, 74, 66, ${game.flash * 0.6})`;
      ctx.fillRect(0, 0, W, H);
    }

    const vignette = ctx.createRadialGradient(W / 2, H / 2, W * 0.32, W / 2, H / 2, W * 0.72);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 4, 5, 0.42)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
  }

  // -------------------------------------------------------
  // Main loop & bootstrap
  // -------------------------------------------------------

  function frame(timestamp) {
    if (!lastFrame) lastFrame = timestamp;
    const dt = Math.min(0.05, Math.max(0, (timestamp - lastFrame) / 1000));
    lastFrame = timestamp;

    if (game.state === 'playing') {
      updateGame(dt);
    } else if (game.state !== 'paused') {
      updateAmbient(dt);
    }

    render();
    window.requestAnimationFrame(frame);
  }

  function initTitleScene() {
    game.map = buildMap(STAGES[0]);
    game.mapConfig = STAGES[0];
    game.base.alive = true;
    game.base.flash = 0;
    game.player = makePlayer();
    game.player.spawnTimer = 0;
    game.player.shield = 0;
    game.enemies = [];
    game.bullets = [];
    game.particles = [];
    game.rings = [];
    game.floaters = [];
    game.powerups = [];
    game.totalEnemies = 0;
    game.defeatedCount = 0;
    game.spawnedCount = 0;
    game.state = 'title';
    game.stage = 1;
    game.lives = 3;
    game.score = 0;
    buildGroundDust();
    rebuildFlowField();
    setOverlay('title');
    setPauseEnabled(false);
    setStatus('STANDBY', 'idle');
    updateSoundButton();
    updateHUD();
  }

  initTitleScene();
  window.requestAnimationFrame(frame);

  // A tiny debug surface for local development and automated smoke tests.
  if (new URLSearchParams(window.location.search).has('debug')) {
    window.__tankBattle = {
      start: startNewGame,
      startStage,
      nextStage: startNextStage,
      pause: togglePause,
      goToTitle,
      fire: requestPlayerFire,
      game,
      getSnapshot: () => ({
        state: game.state,
        stage: game.stage,
        score: game.score,
        lives: game.lives,
        baseAlive: game.base.alive,
        enemies: game.enemies.length,
        bullets: game.bullets.length,
        spawned: game.spawnedCount,
        defeated: game.defeatedCount,
        total: game.totalEnemies,
        player: game.player
          ? { x: Math.round(game.player.x), y: Math.round(game.player.y), dir: game.player.dir }
          : null,
        map: game.map.map((row) => Array.from(row)),
      }),
      killAllEnemies: () => {
        game.enemies.filter((enemy) => enemy.alive).forEach((enemy) => killEnemy(enemy));
      },
      damageBase: destroyBase,
    };
  }
})();
