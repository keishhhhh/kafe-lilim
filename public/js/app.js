const state = {
  menu: [],
  categories: [],
  reviews: [],
  settings: {},
  loyalty: null,
  activeCategory: 'all',
  searchTerm: ''
};

const menuGrid = document.getElementById('menu-grid');
const categoryFilters = document.getElementById('category-filters');
const reviewSummary = document.getElementById('review-summary');
const menuSearch = document.getElementById('menu-search');
const galleryGrid = document.getElementById('gallery-grid');
const heroMessage = document.getElementById('hero-message');
const storyText = document.getElementById('story-text');
const contactLocation = document.getElementById('contact-location');
const contactHours = document.getElementById('contact-hours');
const contactDetails = document.getElementById('contact-details');
const reviewForm = document.getElementById('review-form');
const reviewMessage = document.getElementById('review-message');
const publicCardId = document.getElementById('public-card-id');
const stampCountEl = document.getElementById('stamp-count');
const requiredStampsEl = document.getElementById('required-stamps');
const rewardLabel = document.getElementById('reward-label');
const progressFill = document.getElementById('progress-fill');
const stampSlots = document.getElementById('stamp-slots');
const cardIdInput = document.getElementById('card-id-input');

const currency = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 0
});

function formatPHP(value) {
  return currency.format(Number(value || 0));
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Request failed.');
  }
  return payload;
}

function saveStoredCard(publicId) {
  localStorage.setItem('kafeLilimCardId', publicId);
}

function getStoredCard() {
  return localStorage.getItem('kafeLilimCardId') || '';
}

function setCardState(card) {
  state.loyalty = card;
  if (card && card.publicId) {
    publicCardId.textContent = card.publicId;
    saveStoredCard(card.publicId);
    cardIdInput.value = card.publicId;
  }

  const required = Number(card?.requiredStamps || 10);
  const count = Number(card?.stampCount || 0);
  requiredStampsEl.textContent = String(required);
  stampCountEl.textContent = String(count);
  const percent = Math.min((count / required) * 100, 100);
  progressFill.style.width = `${percent}%`;
  rewardLabel.innerHTML = `Reward: <strong>${card?.rewardDescription || 'Complimentary coffee or pastry'}</strong>`;

  stampSlots.innerHTML = '';
  for (let i = 0; i < required; i += 1) {
    const slot = document.createElement('span');
    slot.className = `stamp-slot ${i < count ? 'filled' : ''}`;
    slot.setAttribute('aria-label', i < count ? 'Filled stamp' : 'Empty stamp');
    slot.textContent = i < count ? '☕' : '○';
    stampSlots.appendChild(slot);
  }
}

async function loadSettings() {
  const settings = await fetchJson('/api/settings/public');
  state.settings = settings;
  heroMessage.textContent = settings.heroMessage || 'Welcome to Kafe Lilim';
  storyText.textContent = settings.story || 'A warm neighborhood cafe with everyday rituals and thoughtful coffee.';
  contactLocation.textContent = settings.location || '[Editable location]';
  contactHours.textContent = settings.openingHours || '[Editable opening hours]';
  contactDetails.textContent = `${settings.contactPhone || '[Editable phone]'} • ${settings.contactEmail || '[Editable email]'}`;

  const gallery = Array.isArray(settings.gallery) ? settings.gallery : [];
  galleryGrid.innerHTML = gallery.map((item) => `<img src="${item}" alt="Kafe Lilim atmosphere" loading="lazy" />`).join('');

  const mapPlaceholder = document.getElementById('map-placeholder');
  if (settings.mapEmbedUrl) {
    mapPlaceholder.innerHTML = `<iframe src="${settings.mapEmbedUrl}" title="Cafe map" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
  }
}

async function loadMenu() {
  const categories = await fetchJson('/api/categories');
  const menu = await fetchJson('/api/menu');
  state.categories = categories;
  state.menu = menu;

  const buttons = [{ id: 'all', name: 'All' }, ...categories.map((cat) => ({ id: String(cat.id), name: cat.name }))];
  categoryFilters.innerHTML = buttons.map((cat) => `
    <button type="button" class="filter-button ${state.activeCategory === cat.id ? 'active' : ''}" data-category="${cat.id}">${cat.name}</button>
  `).join('');

  categoryFilters.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      state.activeCategory = button.dataset.category;
      renderMenu();
      categoryFilters.querySelectorAll('button').forEach((btn) => btn.classList.toggle('active', btn === button));
    });
  });

  renderMenu();
}

function renderMenu() {
  const term = state.searchTerm.trim().toLowerCase();
  const filtered = state.menu.filter((item) => {
    const categoryMatch = state.activeCategory === 'all' || String(item.category_id) === String(state.activeCategory);
    const searchMatch = !term || `${item.name} ${item.description}`.toLowerCase().includes(term);
    return categoryMatch && searchMatch;
  });

  menuGrid.innerHTML = filtered.length
    ? filtered.map((item) => `
      <article class="menu-card ${Number(item.available) === 0 || Number(item.sold_out) === 1 ? 'unavailable' : ''}">
        <div class="card-image-wrap">
          <img src="${item.image || 'https://images.unsplash.com/photo-1497636577773-f1231844b336?auto=format&fit=crop&w=1200&q=80'}" alt="${item.name}" loading="lazy" />
          ${Number(item.featured) === 1 ? '<span class="tag">Featured</span>' : ''}
          ${Number(item.sold_out) === 1 ? '<span class="tag sold-out">Sold out</span>' : ''}
        </div>
        <div class="card-copy">
          <div class="menu-card-head">
            <h3>${item.name}</h3>
            <span class="price">${formatPHP(item.price)}</span>
          </div>
          <p class="category-label">${item.category_name || 'Menu item'}</p>
          <p>${item.description || 'Freshly made and ready to enjoy.'}</p>
          <div class="menu-status-line">
            <span>${Number(item.available) === 0 || Number(item.sold_out) === 1 ? 'Unavailable' : 'Available'}</span>
          </div>
        </div>
      </article>
    `).join('')
    : '<p class="empty-state">No menu items match your search.</p>';
}

async function loadReviews() {
  const data = await fetchJson('/api/reviews');
  state.reviews = data.reviews || [];

  const average = Number(data.averageRating || 0);
  const total = Number(data.totalReviews || 0);
  reviewSummary.innerHTML = `
    <div class="rating-overview">
      <div class="big-rating">${average.toFixed(1)}</div>
      <div>
        <div class="stars-row" aria-label="Average rating ${average} out of 5">${renderStars(average)}</div>
        <p>${total} review${total === 1 ? '' : 's'}</p>
      </div>
    </div>
  `;

  const list = document.createElement('div');
  list.className = 'review-list';

  if (!state.reviews.length) {
    list.innerHTML = '<p class="empty-state">No reviews yet. Be the first to share your thoughts.</p>';
  } else {
    list.innerHTML = state.reviews.map((review) => `
      <article class="review-item">
        <div class="review-head">
          <strong>${review.display_name || 'Anonymous'}</strong>
          <span>${new Date(review.created_at).toLocaleDateString()}</span>
        </div>
        <div class="stars-row" aria-label="Rated ${review.rating} out of 5">${renderStars(review.rating)}</div>
        <p>${review.comment}</p>
      </article>
    `).join('');
  }

  reviewSummary.appendChild(list);
}

function renderStars(value) {
  const rounded = Math.round(Number(value || 0));
  const stars = Array.from({ length: 5 }, (_, index) => (index < rounded ? '★' : '☆')).join('');
  return `<span class="star-visual">${stars}</span>`;
}

async function createCard() {
  try {
    const data = await fetchJson('/api/loyalty/cards', { method: 'POST' });
    setCardState(data);
  } catch (error) {
    reviewMessage.textContent = error.message;
  }
}

async function lookupCard(publicId) {
  const value = (publicId || '').trim();
  if (!value) return;

  try {
    const card = await fetchJson(`/api/loyalty/cards/${encodeURIComponent(value)}`);
    setCardState(card);
  } catch (error) {
    reviewMessage.textContent = error.message;
  }
}

function hydrateSavedCard() {
  const saved = getStoredCard();
  if (saved) {
    cardIdInput.value = saved;
    lookupCard(saved);
  }
}

function bindEvents() {
  menuSearch.addEventListener('input', (event) => {
    state.searchTerm = event.target.value;
    renderMenu();
  });

  document.getElementById('create-card-btn').addEventListener('click', createCard);
  document.getElementById('recover-card-btn').addEventListener('click', () => {
    const saved = getStoredCard();
    if (saved) {
      lookupCard(saved);
    } else {
      reviewMessage.textContent = 'No saved card found on this device. Create a new card or enter a card ID.';
    }
  });
  document.getElementById('lookup-card-btn').addEventListener('click', () => lookupCard(cardIdInput.value));

  document.querySelector('.mobile-menu-toggle').addEventListener('click', () => {
    const menu = document.getElementById('mobile-menu');
    const nextOpen = menu.hidden;
    menu.hidden = !nextOpen;
    document.querySelector('.mobile-menu-toggle').setAttribute('aria-expanded', String(nextOpen));
  });

  reviewForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const checked = [...document.querySelectorAll('input[name="rating"]:checked')][0];
    const rating = checked ? Number(checked.value) : 0;
    const comment = document.getElementById('review-text').value.trim();
    const displayName = document.getElementById('review-name').value.trim();

    if (!rating) {
      reviewMessage.textContent = 'Please choose a rating before submitting.';
      return;
    }

    try {
      await fetchJson('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({ rating, displayName, comment })
      });
      reviewForm.reset();
      reviewMessage.textContent = 'Review submitted successfully.';
      reviewMessage.classList.add('success');
      await loadReviews();
    } catch (error) {
      reviewMessage.textContent = error.message;
      reviewMessage.classList.remove('success');
    }
  });

  document.getElementById('year').textContent = new Date().getFullYear();
}

async function init() {
  bindEvents();
  await loadSettings();
  await loadMenu();
  await loadReviews();
  hydrateSavedCard();
}

init();
