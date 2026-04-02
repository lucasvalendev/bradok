import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ROOT = process.cwd();
const BASE_URL = process.env.BRADOK_URL ?? 'http://127.0.0.1:5173';
const OUTPUT_ROOT = path.join(ROOT, 'output', 'bradok-tour');
const RAW_DIR = path.join(OUTPUT_ROOT, 'raw');
const TRIM_DIR = path.join(OUTPUT_ROOT, 'trimmed');
const FINAL_DIR = path.join(OUTPUT_ROOT, 'final');
const TMP_VIDEO_DIR = path.join(OUTPUT_ROOT, 'tmp-video');
const VIEWPORT = { width: 1920, height: 1080 };
const FPS = 25;
const TRANSITION_SECONDS = 0.35;
const CURSOR_IDLE = { x: 1500, y: 910 };

const CAPTURE_UI_SCRIPT = `
(() => {
  if (window.__bradokCapture) return;

  document.documentElement.setAttribute('data-bradok-capture', '1');

  const style = document.createElement('style');
  style.textContent = \`
    html[data-bradok-capture="1"], html[data-bradok-capture="1"] * {
      cursor: none !important;
    }

    #__bradok-capture-cover {
      position: fixed;
      inset: 0;
      z-index: 2147483646;
      pointer-events: none;
      background: #000;
      opacity: 0;
      transition: opacity 280ms ease, background-color 280ms ease;
    }

    #__bradok-capture-cursor {
      position: fixed;
      left: 0;
      top: 0;
      width: 18px;
      height: 18px;
      margin-left: -9px;
      margin-top: -9px;
      border-radius: 999px;
      pointer-events: none;
      z-index: 2147483647;
      opacity: 0;
      transform: translate3d(0px, 0px, 0) scale(1);
      transition: opacity 180ms ease, transform 120ms ease;
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.14), 0 12px 28px rgba(0, 0, 0, 0.18);
      background: rgba(255, 255, 255, 0.96);
    }

    #__bradok-capture-cursor::after {
      content: '';
      position: absolute;
      inset: -9px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.38);
      opacity: 0.72;
    }
  \`;
  document.head.appendChild(style);

  const cover = document.createElement('div');
  cover.id = '__bradok-capture-cover';

  const cursor = document.createElement('div');
  cursor.id = '__bradok-capture-cursor';

  document.body.append(cover, cursor);

  window.__bradokCapture = {
    moveCursor({ x, y, opacity = 1, scale = 1, pressed = false }) {
      cursor.style.opacity = String(opacity);
      cursor.style.transform = \`translate3d(\${x}px, \${y}px, 0) scale(\${pressed ? scale * 0.88 : scale})\`;
    },
    showCover({ color = '#000', opacity = 1 }) {
      cover.style.backgroundColor = color;
      cover.style.opacity = String(opacity);
    },
    hideCover() {
      cover.style.opacity = '0';
    },
  };
})();
`;

const TAKES = [
  {
    id: '01-hero',
    path: '/?demo=recording&take=hero',
    trimStart: 0.28,
    trimDuration: 8.7,
    async run(page, h) {
      await h.installUi();
      await h.setCursor(CURSOR_IDLE, { opacity: 0.95 });
      await h.pause(700);
      await h.moveCursor({ x: 960, y: 860 }, { duration: 420, opacity: 0.95 });
      await h.pause(120);
      await h.wheel(760, { steps: 8, delay: 80 });
      await h.setCursor({ x: 1020, y: 920 }, { opacity: 0 });
      await h.waitForDataset('demoHeroState', 'playing', 2500);
      await h.waitForDataset('demoHeroState', 'done', 12000);
      await h.pause(180);
    },
  },
  {
    id: '02-structure',
    path: '/?demo=recording&take=structure',
    trimStart: 0.9,
    async run(page, h) {
      await h.installUi();
      await h.showCover('#000');
      await h.setCursor(CURSOR_IDLE, { opacity: 0 });
      await h.jumpToSelector('#estrutura', -24);
      await h.pause(350);
      await h.hideCover();
      await h.setCursor({ x: 980, y: 880 }, { opacity: 0.95 });
      await h.pause(260);
      await h.smoothScrollBy(2400, { steps: 90, delay: 42 });
      await h.pause(300);
      await h.smoothScrollBy(1180, { steps: 44, delay: 40 });
      await h.pause(1200);
    },
  },
  {
    id: '03-reels-units-team',
    path: '/?demo=recording&take=reels',
    trimStart: 0.9,
    async run(page, h) {
      await h.installUi();
      await h.showCover('#090909');
      await h.setCursor(CURSOR_IDLE, { opacity: 0 });
      await h.jumpToSelector('#experiencia', -100);
      await h.pause(350);
      await h.hideCover();
      await h.setCursor({ x: 1480, y: 900 }, { opacity: 0.95 });
      await h.pause(360);

      await h.hover('[data-testid="reel-card-2"]', { hold: 2200, duration: 420 });

      await h.scrollToSelector('#unidades', { offset: -40, steps: 58, delay: 34, duration: 1900 });
      await h.pause(500);
      await h.hover('[data-testid="unit-preview-galo"]', { hold: 1800 });
      await h.pause(220);
      await h.click('#unit-tab-setville');
      await h.waitForDataset('demoActiveUnit', 'setville', 2500);
      await h.pause(350);
      await h.hover('[data-testid="unit-preview-setville"]', { hold: 2000 });

      await h.scrollToSelector('#equipe', { offset: -70, steps: 64, delay: 34, duration: 2100 });
      await h.pause(450);
      await h.hover('[data-testid="team-dna-card"]', { hold: 1400 });
      await h.hover('[data-testid="team-drone-card"]', { hold: 1500 });
      await h.pause(300);
    },
  },
  {
    id: '04-social-cta-faq',
    path: '/?demo=recording&take=social',
    trimStart: 0.9,
    async run(page, h) {
      await h.installUi();
      await h.showCover('#fafafa');
      await h.setCursor(CURSOR_IDLE, { opacity: 0 });
      await h.jumpToSelector('#depoimentos', -60);
      await h.pause(350);
      await h.hideCover();
      await h.setCursor({ x: 1580, y: 920 }, { opacity: 0.78 });
      await h.pause(2200);

      await h.scrollToSelector('#cta', { offset: -70, steps: 48, delay: 32 });
      await h.pause(1800);

      await h.scrollToSelector('#duvidas', { offset: -70, steps: 56, delay: 32 });
      await h.pause(450);
      await h.click('[data-testid="faq-item-3"]');
      await h.waitForDataset('demoOpenFaq', '3', 2500);
      await h.pause(2200);

      await h.smoothScrollBy(220, { steps: 20, delay: 28 });
      await h.pause(1200);
    },
  },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runCommand = (command, args, label) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(
        new Error(
          `${label} failed with code ${code}\n${stdout}\n${stderr}`.trim(),
        ),
      );
    });
  });

const ensureDirs = async () => {
  await Promise.all([
    fs.mkdir(RAW_DIR, { recursive: true }),
    fs.mkdir(TRIM_DIR, { recursive: true }),
    fs.mkdir(FINAL_DIR, { recursive: true }),
    fs.mkdir(TMP_VIDEO_DIR, { recursive: true }),
  ]);
};

const waitForServer = async () => {
  for (let attempt = 0; attempt < 25; attempt++) {
    try {
      const response = await fetch(BASE_URL);
      if (response.ok) return;
    } catch {
      // Keep retrying until the local server answers.
    }

    await sleep(1000);
  }

  throw new Error(`Server not responding at ${BASE_URL}`);
};

const installUi = async (page) => {
  await page.evaluate(CAPTURE_UI_SCRIPT);
};

const setCursor = async (page, point, options = {}) => {
  if (options.syncMouse !== false) {
    await page.mouse.move(point.x, point.y);
  }
  await page.evaluate(
    ({ point, options }) => {
      document.documentElement.dataset.demoCursorX = String(Math.round(point.x));
      document.documentElement.dataset.demoCursorY = String(Math.round(point.y));
      window.__bradokCapture.moveCursor({
        x: point.x,
        y: point.y,
        opacity: options.opacity ?? 1,
        scale: options.scale ?? 1,
        pressed: options.pressed ?? false,
      });
    },
    { point, options },
  );
};

const moveCursor = async (page, from, to, options = {}) => {
  const steps = options.steps ?? Math.max(12, Math.round((options.duration ?? 420) / 24));
  const delay = Math.max(8, Math.round((options.duration ?? 420) / steps));
  const syncMouse = options.syncMouse !== false;

  for (let index = 1; index <= steps; index++) {
    const progress = index / steps;
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    const x = from.x + (to.x - from.x) * eased;
    const y = from.y + (to.y - from.y) * eased;

    if (syncMouse) {
      await page.mouse.move(x, y);
    }
    await setCursor(page, { x, y }, {
      opacity: options.opacity ?? 1,
      scale: options.scale ?? 1,
      syncMouse: false,
    });
    await page.waitForTimeout(delay);
  }
};

const wheel = async (page, totalY, options = {}) => {
  const steps = options.steps ?? 8;
  const delay = options.delay ?? 70;
  const delta = totalY / steps;

  for (let index = 0; index < steps; index++) {
    await page.mouse.wheel(0, delta);
    await page.waitForTimeout(delay);
  }
};

const smoothScrollBy = async (page, totalY, options = {}) => {
  const duration = options.duration ?? (options.steps ?? 40) * (options.delay ?? 32);

  await page.evaluate(
    async ({ totalY, duration }) => {
      const startY = window.scrollY;
      const targetY = startY + totalY;
      const easeInOutCubic = (progress) =>
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      await new Promise((resolve) => {
        const start = performance.now();

        const step = (now) => {
          const progress = Math.min(1, (now - start) / duration);
          const eased = easeInOutCubic(progress);
          window.scrollTo(0, startY + (targetY - startY) * eased);

          if (progress < 1) {
            window.requestAnimationFrame(step);
            return;
          }

          resolve();
        };

        window.requestAnimationFrame(step);
      });
    },
    { totalY, duration },
  );

  await page.waitForTimeout(60);
};

const jumpToSelector = async (page, selector, offset = 0) => {
  await page.evaluate(
    ({ selector, offset }) => {
      const element = document.querySelector(selector);
      if (!element) {
        throw new Error(`Selector not found for jump: ${selector}`);
      }

      const targetTop = Math.max(0, element.getBoundingClientRect().top + window.scrollY + offset);
      window.scrollTo(0, targetTop);
    },
    { selector, offset },
  );
};

const scrollToSelector = async (page, selector, options = {}) => {
  const targetY = await page.evaluate(
    ({ selector, offset }) => {
      const element = document.querySelector(selector);
      if (!element) {
        throw new Error(`Selector not found for scroll: ${selector}`);
      }

      return Math.max(0, element.getBoundingClientRect().top + window.scrollY + offset);
    },
    { selector, offset: options.offset ?? 0 },
  );

  const currentY = await page.evaluate(() => window.scrollY);
  await smoothScrollBy(page, targetY - currentY, {
    steps: options.steps ?? 48,
    delay: options.delay ?? 32,
    duration: options.duration,
  });
};

const elementCenter = async (page, selector) => {
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: 'visible', timeout: 5000 });
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();

  if (!box) {
    throw new Error(`Could not resolve bounding box for ${selector}`);
  }

  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  };
};

const hover = async (page, selector, options = {}) => {
  const current = await page.evaluate(() => ({
    x: Number(document.documentElement.dataset.demoCursorX || 1500),
    y: Number(document.documentElement.dataset.demoCursorY || 910),
  }));
  const target = await elementCenter(page, selector);
  await page.mouse.move(CURSOR_IDLE.x, CURSOR_IDLE.y);
  await moveCursor(page, current, target, {
    duration: options.duration ?? 520,
    opacity: 0.95,
    syncMouse: false,
  });
  await page.mouse.move(target.x, target.y);
  await page.locator(selector).first().hover();
  await page.evaluate(({ x, y }) => {
    document.documentElement.dataset.demoCursorX = String(Math.round(x));
    document.documentElement.dataset.demoCursorY = String(Math.round(y));
  }, target);
  await page.waitForTimeout(options.hold ?? 1200);
};

const click = async (page, selector) => {
  const current = await page.evaluate(() => ({
    x: Number(document.documentElement.dataset.demoCursorX || 1500),
    y: Number(document.documentElement.dataset.demoCursorY || 910),
  }));
  const target = await elementCenter(page, selector);
  await page.mouse.move(CURSOR_IDLE.x, CURSOR_IDLE.y);
  await moveCursor(page, current, target, { duration: 520, opacity: 0.98, syncMouse: false });
  await page.mouse.move(target.x, target.y);
  await setCursor(page, target, { opacity: 0.98, pressed: true, syncMouse: false });
  await page.mouse.down();
  await page.waitForTimeout(70);
  await page.mouse.up();
  await setCursor(page, target, { opacity: 0.98, pressed: false, syncMouse: false });
  await page.evaluate(({ x, y }) => {
    document.documentElement.dataset.demoCursorX = String(Math.round(x));
    document.documentElement.dataset.demoCursorY = String(Math.round(y));
  }, target);
};

const showCover = async (page, color) => {
  await page.evaluate((color) => {
    window.__bradokCapture.showCover({ color, opacity: 1 });
  }, color);
};

const hideCover = async (page) => {
  await page.evaluate(() => {
    window.__bradokCapture.hideCover();
  });
  await page.waitForTimeout(320);
};

const waitForDataset = async (page, key, value, timeout) => {
  await page.waitForFunction(
    ({ key, value }) => document.documentElement.dataset[key] === value,
    { key, value },
    { timeout },
  );
};

const trimTake = async (inputPath, outputPath, trimStart, trimDuration) => {
  const args = [
    '-y',
    '-ss',
    String(trimStart),
    '-i',
    inputPath,
  ];

  if (typeof trimDuration === 'number') {
    args.push('-t', String(trimDuration));
  }

  args.push(
    '-r',
    String(FPS),
    '-an',
    '-c:v',
    'libx264',
    '-preset',
    'slow',
    '-crf',
    '18',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    outputPath,
  );

  await runCommand('ffmpeg', args, `trim ${path.basename(inputPath)}`);
};

const ffprobeDuration = async (filePath) => {
  const { stdout } = await runCommand(
    'ffprobe',
    [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      filePath,
    ],
    `ffprobe ${path.basename(filePath)}`,
  );

  return Number.parseFloat(stdout.trim());
};

const composeFinalVideo = async (clips) => {
  const durations = [];
  for (const clip of clips) {
    durations.push(await ffprobeDuration(clip.trimmedPath));
  }

  const filterParts = [];
  let currentLabel = '[0:v]';
  let currentTimelineLength = durations[0];

  for (let index = 1; index < clips.length; index++) {
    const nextLabel = `[${index}:v]`;
    const outputLabel = `[v${index}]`;
    const offset = currentTimelineLength - TRANSITION_SECONDS;
    filterParts.push(
      `${currentLabel}${nextLabel}xfade=transition=fade:duration=${TRANSITION_SECONDS}:offset=${offset}${outputLabel}`,
    );
    currentLabel = outputLabel;
    currentTimelineLength += durations[index] - TRANSITION_SECONDS;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const finalPath = path.join(FINAL_DIR, `bradok-tour-${timestamp}.mp4`);
  const args = [
    '-y',
    ...clips.flatMap((clip) => ['-i', clip.trimmedPath]),
    '-filter_complex',
    filterParts.join(';'),
    '-map',
    currentLabel,
    '-r',
    String(FPS),
    '-an',
    '-c:v',
    'libx264',
    '-preset',
    'slow',
    '-crf',
    '18',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    finalPath,
  ];

  await runCommand('ffmpeg', args, 'compose final video');
  return finalPath;
};

const captureTake = async (browser, take) => {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    recordVideo: {
      dir: TMP_VIDEO_DIR,
      size: VIEWPORT,
    },
  });

  const page = await context.newPage();
  const video = page.video();

  await page.goto(new URL(take.path, BASE_URL).toString(), {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForLoadState('load');
  await page.waitForTimeout(1200);

  const helpers = {
    installUi: () => installUi(page),
    setCursor: (point, options) => setCursor(page, point, options),
    moveCursor: (point, options) =>
      page.evaluate(() => ({
        x: Number(document.documentElement.dataset.demoCursorX || 1500),
        y: Number(document.documentElement.dataset.demoCursorY || 910),
      })).then((from) => moveCursor(page, from, point, options)),
    wheel: (totalY, options) => wheel(page, totalY, options),
    smoothScrollBy: (totalY, options) => smoothScrollBy(page, totalY, options),
    scrollToSelector: (selector, options) => scrollToSelector(page, selector, options),
    jumpToSelector: (selector, offset) => jumpToSelector(page, selector, offset),
    hover: (selector, options) => hover(page, selector, options),
    click: (selector) => click(page, selector),
    showCover: (color) => showCover(page, color),
    hideCover: () => hideCover(page),
    waitForDataset: (key, value, timeout) => waitForDataset(page, key, value, timeout),
    pause: (ms) => page.waitForTimeout(ms),
  };

  await page.evaluate(({ x, y }) => {
    document.documentElement.dataset.demoCursorX = String(x);
    document.documentElement.dataset.demoCursorY = String(y);
  }, CURSOR_IDLE);

  console.log(`Recording take ${take.id}...`);
  await take.run(page, helpers);

  const rawPath = path.join(RAW_DIR, `${take.id}.webm`);
  const trimmedPath = path.join(TRIM_DIR, `${take.id}.mp4`);

  await context.close();
  await video.saveAs(rawPath);
  try {
    await video.delete();
  } catch {
    // Ignore cleanup failures from the temporary Playwright artifact.
  }

  await trimTake(rawPath, trimmedPath, take.trimStart, take.trimDuration);
  return {
    id: take.id,
    rawPath,
    trimmedPath,
  };
};

const main = async () => {
  await ensureDirs();
  await waitForServer();

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--force-device-scale-factor=1',
      '--disable-gpu-rasterization',
      '--disable-gpu-compositing',
    ],
  });

  try {
    const clips = [];
    for (const take of TAKES) {
      clips.push(await captureTake(browser, take));
    }

    const finalPath = await composeFinalVideo(clips);
    console.log(`Final video ready at ${finalPath}`);
  } finally {
    await browser.close();
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
