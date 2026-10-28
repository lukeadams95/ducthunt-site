// Writes src/data/lastmod.json: { "src/pages/x.astro": "YYYY-MM-DD" } from git history.
// Used for sitemap <lastmod> on shallow CI clones. Run: node scripts/gen-lastmod.mjs
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const files = execSync('git ls-files src/pages', { encoding: 'utf8' }).split('\n').filter((f) => f.endsWith('.astro'));
const map = {};
for (const f of files) map[f] = execSync(`git log -1 --format=%cs -- "${f}"`, { encoding: 'utf8' }).trim();
writeFileSync('src/data/lastmod.json', JSON.stringify(map, null, 2) + '\n');
