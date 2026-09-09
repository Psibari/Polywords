import { chromium } from 'playwright';

const source = 'file:///C:/Users/pdiba/Downloads/flytest.MP4';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 520, height: 980 } });

await page.goto(source, { waitUntil: 'load' });
const video = page.locator('video');
await video.waitFor({ state: 'visible' });
const metadata = await video.evaluate(async element => {
  const media = /** @type {HTMLVideoElement} */ (element);
  media.pause();
  if (media.readyState < 1) {
    await new Promise(resolve => media.addEventListener('loadedmetadata', resolve, { once: true }));
  }
  return {
    duration: media.duration,
    width: media.videoWidth,
    height: media.videoHeight,
  };
});

const frameCount = 16;
for (let index = 0; index < frameCount; index += 1) {
  const time = (metadata.duration * index) / (frameCount - 1);
  await video.evaluate(async (element, nextTime) => {
    const media = /** @type {HTMLVideoElement} */ (element);
    await new Promise(resolve => {
      media.addEventListener('seeked', resolve, { once: true });
      media.currentTime = nextTime;
    });
  }, time);
  await page.screenshot({ path: `tools/dev/flytest-edge-frame-${String(index).padStart(2, '0')}.png` });
}

console.log(JSON.stringify(metadata));
await browser.close();
