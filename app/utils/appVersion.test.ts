import assert from 'node:assert/strict';
import { formatAppVersion } from './appVersion';

assert.equal(
  formatAppVersion('1.0.0', '15', '0.0.0'),
  '1.0.0 (15)',
  'production builds show the native marketing version and native build number',
);
assert.equal(
  formatAppVersion('1.0.0', null, '0.0.0'),
  '1.0.0',
  'a missing native build number does not leave empty parentheses',
);
assert.equal(
  formatAppVersion(null, null, '1.0.0'),
  '1.0.0',
  'development environments fall back to the configured Expo version',
);
assert.equal(
  formatAppVersion(null, null),
  'Development',
  'a development environment without native or configured values stays readable',
);

console.log('appVersion tests passed');
