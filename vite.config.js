import {defineConfig} from 'vite';

// The local dev server remains at /. GitHub Pages serves this repository at a subpath.
export default defineConfig({
  base: process.env.GITHUB_PAGES === '1' ? '/yamanaka-historical-terrain/' : '/',
});
