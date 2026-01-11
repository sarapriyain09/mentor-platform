# Internal linking playbook (MendForWorks Blog)

## Goals

- Help Google understand topical clusters (mentors, career growth, industries).
- Move readers to high-intent actions (sign-up, matching) without being spammy.

## Rules (simple + consistent)

1. Every post ends with:
   - 2–4 **Related reading** links to other blog posts.
   - 1 primary CTA link: **Find a mentor** → `/register`.
2. Use natural anchor text that includes the **primary keyword** of the target page when it fits.
3. Keep internal links mostly within the same cluster:
   - UK mentor-finding cluster ↔ comparison ↔ benefits
   - Industry cluster (engineers/students/leaders) ↔ UK mentor-finding ↔ benefits
4. Avoid linking to logged-in pages (dashboard, chat, bookings) from SEO posts.

## Recommended anchors (examples)

- To `/blog/how-to-find-the-right-career-mentor-uk`
  - “career mentor UK”
  - “how to find a mentor in the UK”
- To `/blog/mentor-vs-coach-vs-manager`
  - “mentor vs coach vs manager”
  - “difference between a mentor and a coach”
- To `/blog/why-mentorship-is-important-every-stage`
  - “benefits of mentorship”
  - “why mentorship is important”
- To `/blog/why-every-engineer-needs-a-mentor`
  - “software engineer mentor”
  - “engineering mentor”
- To `/blog/how-mentorship-helps-students-and-graduates`
  - “mentor for students”
  - “mentorship for graduates”
- To `/blog/why-leadership-mentorship-is-essential`
  - “leadership mentorship”
  - “mentor for managers”

## Next: scaling

When you add a new post:

- Add it to `src/blog/posts/posts.json`
- Add keyword targets to `src/blog/seo-keywords.json`
- Add at least 2 internal links *to* the new post from older posts in the same cluster
