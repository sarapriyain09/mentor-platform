import postsMeta from './posts/posts.json';

const mdModules = import.meta.glob('./posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
});

function getMarkdownBySlug(slug) {
  const entry = Object.entries(mdModules).find(([path]) => path.endsWith(`/${slug}.md`));
  return entry ? entry[1] : null;
}

export function getAllPosts() {
  return [...postsMeta].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

export function getPostBySlug(slug) {
  const meta = postsMeta.find((p) => p.slug === slug);
  if (!meta) return null;

  const content = getMarkdownBySlug(slug);
  if (!content) return null;

  return { ...meta, content };
}
