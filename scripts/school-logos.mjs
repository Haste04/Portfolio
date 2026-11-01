import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
/**
 * Build-time lookup only. Original school images are served unchanged.
 * @param {string | undefined} filename
 * @param {string} [directory]
 * @returns {string | undefined}
 */
export function schoolLogoUrl(filename, directory = resolve('public/school-logos')) {
  if (!filename || !/^[a-z0-9_-]+\.(?:png|jpe?g)$/.test(filename)) return undefined;
  return existsSync(resolve(directory, filename)) ? '/school-logos/' + filename : undefined;
}
