import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { getAllPosts } from '../blog/blogStore';
import './Blog.css';

export default function BlogIndex() {
  const posts = getAllPosts();

  useEffect(() => {
    const title = 'Blog | MendForWorks';
    const description = 'Mentoring and career growth guidance from MendForWorks.';
    const canonical = 'https://www.mendforworks.com/blog';

    document.title = title;

    let meta = document.head.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);

    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', canonical);
  }, []);

  return (
    <div className="blog">
      <header className="blog-header">
        <h1>Blog</h1>
        <p className="blog-subtitle">
          Practical mentoring and career growth guidance from MendForWorks.
        </p>
      </header>

      <div className="blog-list">
        {posts.map((post) => (
          <article key={post.slug} className="blog-card">
            <h2 className="blog-card-title">
              <Link to={`/blog/${post.slug}`}>{post.title}</Link>
            </h2>
            {post.date && <div className="blog-card-meta">{post.date}</div>}
            {post.description && <p className="blog-card-desc">{post.description}</p>}
            <Link className="blog-readmore" to={`/blog/${post.slug}`}>
              Read →
            </Link>
          </article>
        ))}
      </div>

      <div className="blog-cta">
        <h3>Ready to move faster in your career?</h3>
        <p>
          If you want guidance, accountability, and clarity, MendForWorks helps you connect
          with the right mentor.
        </p>
        <div className="blog-cta-actions">
          <Link className="blog-btn" to="/register">Find a mentor</Link>
          <Link className="blog-btn blog-btn-secondary" to="/register">Become a mentor</Link>
        </div>
      </div>
    </div>
  );
}
