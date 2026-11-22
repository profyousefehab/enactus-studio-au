import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputDir = path.join(process.cwd(), 'screenshots', 'admin');
fs.mkdirSync(outputDir, { recursive: true });

const targets = [
  { name: 'mobile-320', width: 320, height: 640, url: 'http://localhost:5173/admin?dev_admin=true' },
  { name: 'mobile-390', width: 390, height: 844, url: 'http://localhost:5173/admin?dev_admin=true' },
  { name: 'tablet-768', width: 768, height: 1024, url: 'http://localhost:5173/admin?dev_admin=true' },
  { name: 'desktop-1024', width: 1024, height: 768, url: 'http://localhost:5173/admin?dev_admin=true' },
  { name: 'desktop-1280', width: 1280, height: 900, url: 'http://localhost:5173/admin?dev_admin=true' },
  { name: 'desktop-attendance', width: 1280, height: 900, url: 'http://localhost:5173/admin?dev_admin=true&tab=attendance' },
  { name: 'desktop-points', width: 1280, height: 900, url: 'http://localhost:5173/admin?dev_admin=true&tab=points' },
  { name: 'mobile-attendance', width: 390, height: 844, url: 'http://localhost:5173/admin?dev_admin=true&tab=attendance' },
  { name: 'mobile-points', width: 390, height: 844, url: 'http://localhost:5173/admin?dev_admin=true&tab=points' },
  { name: 'mobile-hr-panel', width: 390, height: 844, url: 'http://localhost:5173/hr?dev_hr=true' },
  { name: 'desktop-hr-panel', width: 1280, height: 900, url: 'http://localhost:5173/hr?dev_hr=true' },
  { name: 'desktop-hr-accounts', width: 1280, height: 900, url: 'http://localhost:5173/admin?dev_admin=true&tab=hr-accounts' },
];

function capture(target) {
  return new Promise((resolve, reject) => {
    const tmpDir = path.join(os.tmpdir(), `chrome-cap-${target.name}-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    const outFile = path.join(outputDir, `${target.name}.png`);

    const args = [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--virtual-time-budget=3000',
      `--user-data-dir=${tmpDir}`,
      `--window-size=${target.width},${target.height}`,
      `--screenshot=${outFile}`,
      target.url,
    ];

    const proc = spawn(chromePath, args);
    let done = false;

    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        try { proc.kill('SIGKILL'); } catch {}
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
        if (fs.existsSync(outFile)) {
          console.log(`✓ Captured (timeout) ${target.name} (${target.width}x${target.height}) -> ${outFile}`);
          resolve();
        } else {
          reject(new Error(`Timed out capturing ${target.name}`));
        }
      }
    }, 5000);

    proc.on('close', (code) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
      if (code === 0 && fs.existsSync(outFile)) {
        console.log(`✓ Captured ${target.name} (${target.width}x${target.height}) -> ${outFile}`);
        resolve();
      } else {
        reject(new Error(`Failed to capture ${target.name}, exit code ${code}`));
      }
    });
  });
}

async function run() {
  for (const t of targets) {
    await capture(t);
  }
  console.log('All screenshots captured successfully!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
