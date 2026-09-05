import { chromium } from 'playwright-core';
const edgePath = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const browser = await chromium.launch({ executablePath: edgePath, headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('response', r => { if (r.status() >= 400) console.log('4xx:', r.status(), r.url()); });
await page.goto('http://localhost:4173/quiz.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
await browser.close();
