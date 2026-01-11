import { Link, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getPostBySlug } from '../blog/blogStore';
import './Blog.css';

function upsertMetaTag({ name, property, content }) {
  if (!content) return;

  const selector = name
    ? `meta[name="${CSS.escape(name)}"]`
    : `meta[property="${CSS.escape(property)}"]`;

  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    if (name) el.setAttribute('name', name);
    if (property) el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href) {
  if (!href) return;
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

export default function BlogPost() {
  const { slug } = useParams();
  const post = getPostBySlug(slug);

  useEffect(() => {
    if (!post) return;

    const title = `${post.title} | MendForWorks`;
    const description = post.description || 'Career mentoring insights and guidance from MendForWorks.';
    const canonical = `https://www.mendforworks.com/blog/${post.slug}`;

    document.title = title;
    upsertCanonical(canonical);

    upsertMetaTag({ name: 'description', content: description });
    upsertMetaTag({ property: 'og:title', content: title });
    upsertMetaTag({ property: 'og:description', content: description });
    upsertMetaTag({ property: 'og:type', content: 'article' });
    upsertMetaTag({ property: 'og:url', content: canonical });
  }, [post]);

  if (!post) {
    return (
      <div className="blog">
        <h1>Post not found</h1>
        <p>
          <Link to="/blog">Back to Blog</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="blog">
      <div className="blog-breadcrumb">
        <Link to="/blog">← Back to Blog</Link>
      </div>

      <article className="blog-post">
        <header className="blog-post-header">
          <h1>{post.title}</h1>
          {post.date && <div className="blog-post-meta">{post.date}</div>}
          {post.description && <p className="blog-post-desc">{post.description}</p>}
        </header>

        <div className="blog-post-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children, ...props }) => {
                if (typeof href === 'string' && href.startsWith('/')) {
                  return (
                    <Link to={href} {...props}>
                      {children}
                    </Link>
                  );
                }
                const external = typeof href === 'string' && /^https?:\/\//i.test(href);
                return (
                  <a
                    href={href}
                    target={external ? '_blank' : undefined}
                    rel={external ? 'noopener noreferrer' : undefined}
                    {...props}
                  >
                    {children}
                  </a>
                );
              }
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        <footer className="blog-post-footer">
          <div className="blog-cta-inline">
            <strong>Want help making progress?</strong>
            <div>
              <Link className="blog-btn" to="/register">Find a mentor</Link>
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
}
