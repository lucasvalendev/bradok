import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ROOT = process.cwd();
const BASE_URL = process.env.BRADOK_URL ?? 'http://127.0.0.1:5173';
const OUTPUT_ROOT = path.join(ROOT, 'output', 'hero-fusion-bake');
const FRAMES_DIR = path.join(OUTPUT_ROOT, 'frames');
const REVIEW_DIR = path.join(OUTPUT_ROOT, 'review');
const VIEWPORT = { width: 1920, height: 1080 };

const HERO_SOURCE_FRAME_RATE = 60;
const TRANSITION_START_FRAME = 147;
const TRANSITION_START_SECONDS = TRANSITION_START_FRAME / HERO_SOURCE_FRAME_RATE;
const TRANSITION_ACTIVATION_LEAD_SECONDS = 0.06;
const HERO_TAGLINE_DELAY_SECONDS = 6;
const CAPTURE_FPS = 30;

const PRE_SCROLL_DELAY_MS = 1000;
const BAKE_START_DELAY_MS = (TRANSITION_START_SECONDS - TRANSITION_ACTIVATION_LEAD_SECONDS) * 1000;
const BAKE_DURATION_SECONDS = HERO_TAGLINE_DELAY_SECONDS - (TRANSITION_START_SECONDS - TRANSITION_ACTIVATION_LEAD_SECONDS);
const FRAME_INTERVAL_MS = 1000 / CAPTURE_FPS;
const FRAME_COUNT = Math.ceil(BAKE_DURATION_SECONDS * CAPTURE_FPS);
const REVIEW_STILLS = [
  { name: 'start.png', frame: 1 },
  { name: 'mid.png', frame: Math.floor(FRAME_COUNT * 0.45) },
  { name: 'end.png', frame: FRAME_COUNT - 2 },
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

      reject(new Error(`${label} failed with code ${code}\n${stderr || stdout}`));
    });
  });

const ensureDirs = async () => {
  await fs.mkdir(FRAMES_DIR, { recursive: true });
  await fs.mkdir(REVIEW_DIR, { recursive: true });
  await fs.mkdir(path.join(ROOT, 'web', 'src', 'assets'), { recursive: true });
};

const cleanFrames = async () => {
  const entries = await fs.readdir(FRAMES_DIR, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .map((entry) => fs.unlink(path.join(FRAMES_DIR, entry.name))),
  );
};

const waitForServer = async () => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(BASE_URL, { redirect: 'manual' });
      if (response.ok || response.status === 304) return;
    } catch {
      // Retry.
    }

    await sleep(500);
  }

  throw new Error(`Timed out waiting for ${BASE_URL}`);
};

const encodeBakeClip = async (assetPath) => {
  await runCommand(
    'ffmpeg',
    [
      '-y',
      '-framerate',
      `${CAPTURE_FPS}`,
      '-i',
      path.join(FRAMES_DIR, 'frame-%04d.jpg'),
      '-an',
      '-c:v',
      'libx264',
      '-preset',
      'slow',
      '-crf',
      '16',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      assetPath,
    ],
    'encode baked hero fusion clip',
  );
};

const exportReviewStills = async () => {
  for (const still of REVIEW_STILLS) {
    const framePath = path.join(FRAMES_DIR, `frame-${String(still.frame).padStart(4, '0')}.jpg`);
    await fs.copyFile(framePath, path.join(REVIEW_DIR, still.name));
  }
};

const captureFrames = async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--force-device-scale-factor=1'],
  });

  try {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    await page.goto(new URL('/?demo=recording&take=hero&bake=hero-fusion', BASE_URL).toString(), {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForLoadState('load');
    await page.addStyleTag({
      content: 'html, body, * { cursor: none !important; }',
    });

    await page.waitForTimeout(PRE_SCROLL_DELAY_MS);
    await page.mouse.wheel(0, 760);
    await page.waitForFunction(
      () => document.documentElement.dataset.demoHeroState === 'playing',
      { timeout: 3000 },
    );
    await page.waitForTimeout(BAKE_START_DELAY_MS);

    const captureStart = Date.now();
    for (let frameIndex = 0; frameIndex < FRAME_COUNT; frameIndex += 1) {
      const targetTimestamp = captureStart + frameIndex * FRAME_INTERVAL_MS;
      const remaining = targetTimestamp - Date.now();
      if (remaining > 0) {
        await page.waitForTimeout(remaining);
      }

      await page.screenshot({
        path: path.join(FRAMES_DIR, `frame-${String(frameIndex + 1).padStart(4, '0')}.jpg`),
        type: 'jpeg',
        quality: 95,
      });
    }

    await context.close();
  } finally {
    await browser.close();
  }
};

const main = async () => {
  await ensureDirs();
  await cleanFrames();
  await waitForServer();
  await captureFrames();

  const bakedAssetPath = path.join(ROOT, 'web', 'src', 'assets', 'hero_fusion_baked.mp4');
  await encodeBakeClip(bakedAssetPath);
  await exportReviewStills();

  console.log(`Baked hero fusion clip ready at ${bakedAssetPath}`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
