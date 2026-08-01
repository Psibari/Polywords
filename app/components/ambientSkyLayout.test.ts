// app/components/ambientSkyLayout.test.ts
// Run with: npx.cmd -y tsx app/components/ambientSkyLayout.test.ts
import { computeGroundLayout, GROUND_CROP_FRACTION } from './ambientSkyLayout';

function eq(actual: number, expected: number, label: string): void {
  if (Math.abs(actual - expected) > 0.001) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

const atSourceWidth = computeGroundLayout(1024);
eq(atSourceWidth.imageHeight, 1536, 'image height at native width');
eq(atSourceWidth.bandHeight, 768, 'band height is half the image at native width');
eq(atSourceWidth.imageOffsetY, -768, 'image shifts up by exactly the hidden top half');

const atPhoneWidth = computeGroundLayout(390);
eq(atPhoneWidth.imageHeight, 585, 'image height scales proportionally');
eq(atPhoneWidth.bandHeight, 292.5, 'band height scales proportionally');
eq(atPhoneWidth.imageOffsetY, -292.5, 'offset scales proportionally');

eq(GROUND_CROP_FRACTION, 0.5, 'crop fraction is the measured 50% line');

console.log('OK');
