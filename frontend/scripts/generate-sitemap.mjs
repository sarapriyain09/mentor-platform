import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const siteUrl = 'https://www.mendforworks.com';
const today = new Date().toISOString().slice(0, 10);

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry(locPath, { lastmod = today, changefreq = 'weekly', priority = '0.5' } = {}) {
  return [
    '  <url>',
    `    <loc>${escapeXml(siteUrl + locPath)}</loc>`,
    lastmod ? `    <lastmod>${escapeXml(lastmod)}</lastmod>` : null,
    changefreq ? `    <changefreq>${escapeXml(changefreq)}</changefreq>` : null,
    priority ? `    <priority>${escapeXml(priority)}</priority>` : null,
    '  </url>'
  ].filter(Boolean).join('\n');
}

async function main() {
  const postsJsonPath = path.join(__dirname, '..', 'src', 'blog', 'posts', 'posts.json');
  const publicDir = path.join(__dirname, '..', 'public');
  const sitemapPath = path.join(publicDir, 'sitemap.xml');

  const postsRaw = await fs.readFile(postsJsonPath, 'utf8');
  const posts = JSON.parse(postsRaw);

  const urls = [];
  urls.push(urlEntry('/', { changefreq: 'weekly', priority: '1.0' }));
  urls.push(urlEntry('/blog', { changefreq: 'weekly', priority: '0.7' }));
  urls.push(urlEntry('/privacy-policy', { changefreq: 'yearly', priority: '0.3' }));
  urls.push(urlEntry('/terms-of-service', { changefreq: 'yearly', priority: '0.3' }));

  for (const post of posts) {
    if (!post?.slug) continue;
    urls.push(
      urlEntry(`/blog/${post.slug}`, {
        lastmod: post.lastmod || post.date || today,
        changefreq: 'monthly',
        priority: '0.6'
      })
    );
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls.join('\n'),
    '</urlset>',
    ''
  ].join('\n');

  await fs.mkdir(publicDir, { recursive: true });
  await fs.writeFile(sitemapPath, xml, 'utf8');

  // eslint-disable-next-line no-console
  console.log(`Generated ${sitemapPath} (${urls.length} URLs)`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
