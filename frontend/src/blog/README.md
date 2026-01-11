# Blog content

- Posts live in `src/blog/posts/*.md`
- Post metadata lives in `src/blog/posts/posts.json`
- Keyword targets live in `src/blog/seo-keywords.json`
- Internal linking guidelines live in `src/blog/INTERNAL_LINKING.md`

Build step:

- `npm run build` runs `scripts/generate-sitemap.mjs` which regenerates `public/sitemap.xml`.
