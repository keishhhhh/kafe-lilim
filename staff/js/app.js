/* ----- Shared design system ----- */
:root {
  --cream: #F5EFE6;
  --beige: #E4D5C3;
  --brown: #6B4F3A;
  --espresso: #352820;
  --terracotta: #B87961;
  --sage: #87947A;
  --charcoal: #302D2A;
  --white: #ffffff;
  --shadow: 0 18px 45px rgba(53, 40, 32, 0.12);
  --radius: 24px;
  --container: 1200px;
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  font-family: 'Manrope', sans-serif;
  background: var(--cream);
  color: var(--espresso);
  line-height: 1.6;
}
img { max-width: 100%; display: block; }
a { color: inherit; text-decoration: none; }
button, input, textarea, select { font: inherit; }
button { cursor: pointer; }

.container { width: min(var(--container), calc(100% - 2rem)); margin: 0 auto; }
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.eyebrow {
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--terracotta);
  margin: 0 0 0.75rem;
}

.section-heading {
  margin-bottom: 1.5rem;
}
.section-heading h2 {
  font-family: 'Playfair Display', serif;
  font-size: clamp(2rem, 4vw, 3rem);
  margin: 0;
}

.site-header {
  background: rgba(245, 239, 230, 0.9);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 20;
  border-bottom: 1px solid rgba(53, 40, 32, 0.08);
}
.nav-shell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 76px;
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  font-weight: 800;
  font-size: 1.2rem;
}
.brand-mark {
  width: 2.3rem;
  height: 2.3rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--espresso);
  color: var(--white);
  font-family: 'Playfair Display', serif;
}
.main-nav {
  display: flex;
  gap: 1.3rem;
  font-size: 0.95rem;
  font-weight: 700;
}
.main-nav a { color: var(--espresso); opacity: 0.8; }
.main-nav a:hover { opacity: 1; }
.mobile-menu-toggle { display: none; }
.mobile-menu {
  display: none;
  background: var(--white);
  border-top: 1px solid rgba(53,40,32,0.08);
  padding: 0.75rem 1rem;
}
.mobile-menu a {
  display: block;
  padding: 0.6rem 0;
  font-weight: 700;
}

.hero {
  padding: 4rem 0 3rem;
}
.hero-grid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 2rem;
  align-items: center;
}
.hero-copy h1 {
  font-size: clamp(2.8rem, 6vw, 5rem);
  line-height: 0.98;
  margin: 0 0 1rem;
  font-family: 'Playfair Display', serif;
}
.lead {
  font-size: 1.1rem;
  color: rgba(53, 40, 32, 0.8);
  max-width: 35rem;
}
.hero-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.7rem;
  flex-wrap: wrap;
}
.button {
  border: none;
  border-radius: 999px;
  padding: 0.9rem 1.5rem;
  font-weight: 800;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.button:hover { transform: translateY(-1px); }
.button.primary {
  background: var(--espresso);
  color: var(--white);
  box-shadow: var(--shadow);
}
.button.secondary {
  background: var(--beige);
  color: var(--espresso);
}
.button.tertiary {
  background: var(--terracotta);
  color: var(--white);
}
.hero-card img {
  border-radius: var(--radius);
  width: 100%;
  min-height: 520px;
  object-fit: cover;
  box-shadow: var(--shadow);
}

.menu-section, .loyalty-section, .reviews-section, .about-section, .contact-section {
  padding: 3rem 0;
}
.menu-toolbar {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}
.search-box {
  flex: 1 1 280px;
}
.search-box input {
  width: 100%;
  border: 1px solid rgba(53,40,32,0.12);
  padding: 0.9rem 1rem;
  border-radius: 999px;
  background: rgba(255,255,255,0.7);
}
.filter-group {
  display: flex;
  gap: 0.7rem;
  flex-wrap: wrap;
}
.filter-button {
  border: 1px solid rgba(53,40,32,0.1);
  background: transparent;
  color: var(--espresso);
  border-radius: 999px;
  padding: 0.7rem 1rem;
  font-weight: 700;
}
.filter-button.active {
  background: var(--espresso);
  color: var(--white);
}
.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 1.5rem;
}
.menu-card {
  background: var(--white);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow);
  border: 1px solid rgba(53,40,32,0.06);
}
.menu-card.unavailable { opacity: 0.7; }
.card-image-wrap {
  position: relative;
}
.card-image-wrap img {
  width: 100%;
  height: 220px;
  object-fit: cover;
}
.tag {
  position: absolute;
  top: 0.8rem;
  left: 0.8rem;
  background: rgba(53,40,32,0.8);
  color: var(--white);
  padding: 0.4rem 0.7rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
}
.tag.sold-out { background: var(--terracotta); }
.card-copy {
  padding: 1rem;
}
.menu-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
}
.menu-card-head h3 {
  margin: 0;
  font-size: 1.15rem;
}
.price {
  font-weight: 800;
  color: var(--brown);
}
.category-label { margin: 0.5rem 0; font-size: 0.8rem; color: var(--sage); font-weight: 700; }
.menu-status-line { margin-top: 1rem; font-weight: 700; color: var(--brown); }

.loyalty-wrap {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 1.5rem;
}
.loyalty-card, .loyalty-panel, .review-form, .contact-card, .map-card {
  background: rgba(255,255,255,0.7);
  border: 1px solid rgba(53,40,32,0.08);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
.loyalty-card { padding: 1.5rem; }
.stamp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}
.badge {
  background: var(--beige);
  border-radius: 999px;
  padding: 0.4rem 0.8rem;
  font-size: 0.76rem;
  font-weight: 800;
}
.stamp-progress {
  margin-bottom: 1.3rem;
}
.progress-meta { display: flex; justify-content: space-between; font-size: 0.9rem; }
.progress-bar {
  width: 100%;
  height: 0.8rem;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(107,79,58,0.1);
  margin: 0.7rem 0;
}
.progress-bar span {
  display: block;
  width: 0;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--terracotta), var(--brown));
}
.progress-count { display: flex; align-items: center; gap: 0.3rem; font-weight: 800; }
.stamp-slots {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(40px, 1fr));
  gap: 0.7rem;
  margin-bottom: 1rem;
}
.stamp-slot {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 50%;
  border: 2px dashed rgba(53,40,32,0.3);
  display: grid;
  place-items: center;
  font-size: 1.15rem;
  background: rgba(255,255,255,0.7);
}
.stamp-slot.filled {
  border-style: solid;
  border-color: var(--terracotta);
  background: rgba(184,121,97,0.12);
}
.card-id-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(53,40,32,0.08);
  font-weight: 700;
}
.loyalty-panel { padding: 1.5rem; }
.card-actions { display: flex; gap: 0.8rem; flex-wrap: wrap; margin-bottom: 1rem; }
.recover-row {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.75rem;
  flex-wrap: wrap;
}
.recover-row input, .review-form input, .review-form textarea {
  width: 100%;
  border: 1px solid rgba(53,40,32,0.12);
  background: rgba(255,255,255,0.8);
  border-radius: 14px;
  padding: 0.85rem 1rem;
}
.input-label, .review-form label span {
  display: block;
  margin-bottom: 0.4rem;
  font-weight: 700;
}
.helper-text {
  margin-top: 0.75rem;
  font-size: 0.9rem;
  color: rgba(53,40,32,0.7);
}

.review-layout {
  display: grid;
  grid-template-columns: 1fr 0.9fr;
  gap: 2rem;
  align-items: start;
}
.rating-overview {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255,255,255,0.5);
  border-radius: var(--radius);
  padding: 1.25rem;
  border: 1px solid rgba(53,40,32,0.07);
}
.big-rating {
  font-size: 3rem;
  font-weight: 800;
}
.stars-row {
  letter-spacing: 0.12em;
  color: #d39d2d;
}
.review-list {
  margin-top: 1.25rem;
  display: grid;
  gap: 1rem;
}
.review-item {
  background: rgba(255,255,255,0.5);
  border: 1px solid rgba(53,40,32,0.07);
  border-radius: 18px;
  padding: 1rem 1.1rem;
}
.review-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
}
.review-form {
  padding: 1.5rem;
  display: grid;
  gap: 1rem;
}
.star-rating {
  display: flex;
  flex-direction: row-reverse;
  justify-content: flex-end;
  gap: 0.25rem;
  font-size: 1.8rem;
  color: rgba(53,40,32,0.24);
}
.star-rating input { display: none; }
.star-rating label {
  cursor: pointer;
  transition: transform 0.2s ease;
}
.star-rating input:checked ~ label,
.star-rating label:hover,
.star-rating label:hover ~ label { color: #d39d2d; }
.form-message { min-height: 1.2rem; font-weight: 700; }
.form-message.success { color: var(--sage); }

.about-grid {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 2rem;
}
.gallery {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}
.gallery img {
  width: 100%;
  height: 220px;
  object-fit: cover;
  border-radius: 20px;
  box-shadow: var(--shadow);
}
.contact-grid {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 1.5rem;
}
.contact-card, .map-card {
  padding: 1.5rem;
}
.map-placeholder {
  display: grid;
  place-items: center;
  min-height: 280px;
  background: rgba(53,40,32,0.03);
  border-radius: 18px;
  color: rgba(53,40,32,0.7);
  border: 1px dashed rgba(53,40,32,0.2);
}
iframe {
  width: 100%;
  min-height: 280px;
  border: 0;
  border-radius: 18px;
}

.site-footer {
  background: var(--espresso);
  color: var(--white);
  padding: 1.25rem 0;
}
.footer-shell {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.footer-links {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.empty-state {
  padding: 1rem;
  background: rgba(255,255,255,0.6);
  border-radius: 16px;
  border: 1px solid rgba(53,40,32,0.08);
  color: rgba(53,40,32,0.75);
}

@media (max-width: 820px) {
  .main-nav { display: none; }
  .mobile-menu-toggle { display: block; }
  .hero-grid, .loyalty-wrap, .review-layout, .about-grid, .contact-grid {
    grid-template-columns: 1fr;
  }
  .hero-card img { min-height: 350px; }
  .menu-toolbar { align-items: stretch; }
  .search-box { width: 100%; }
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  * { transition: none !important; }
}
