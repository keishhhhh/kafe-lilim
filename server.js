const express = require('express');
const session = require('express-session');
const sqlite = require('better-sqlite3');
const helmet = require('helmet');
const crypto = require('crypto');
const path = require('path');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const dbPath = path.join(__dirname, 'data', 'kafe-lilim.db');
const db = new sqlite(dbPath);

db.pragma('journal_mode = WAL');

const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-replace-me';
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MINUTES || 120) * 60 * 1000;
const STAFF_PASSCODE = process.env.STAFF_PASSCODE || 'change-me';
const NODE_ENV = process.env.NODE_ENV || 'development';

function safeParseJson(value, fallback) {
  try {
    return JSON.parse(value ?? 'null') ?? fallback;
  } catch {
    return fallback;
  }
}

function hashValue(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function parseStaffAccounts() {
  const raw = process.env.STAFF_ACCOUNTS || '';
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getSharedStaffUser() {
  return { name: 'Shared staff passcode', role: 'owner', passcodeHash: hashValue(STAFF_PASSCODE) };
}

function resolveStaffCredential(passcode) {
  const accounts = parseStaffAccounts();
  if (accounts.length > 0) {
    const matched = accounts.find((record) => record && record.passcode && hashValue(String(record.passcode)) === hashValue(String(passcode)));
    if (matched) {
      return {
        name: matched.name || 'Staff member',
        role: matched.role || 'employee',
        passcodeHash: hashValue(String(matched.passcode)),
        credentialId: matched.id || matched.name || 'staff-account'
      };
    }
    return null;
  }

  if (hashValue(String(passcode)) === hashValue(STAFF_PASSCODE)) {
    return getSharedStaffUser();
  }

  return null;
}

function ensureDirExists(dirPath) {
  const fs = require('fs');
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function logAudit(actor, action, targetType, targetId, details) {
  const stmt = db.prepare(`
    INSERT INTO audit_logs (actor, action, target_type, target_id, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(actor || 'system', action, targetType || 'system', String(targetId || ''), JSON.stringify(details || {}), new Date().toISOString());
}

function getPublicSettings() {
  const raw = db.prepare(`SELECT value FROM settings WHERE key = 'site_settings'`).get();
  const settings = raw ? safeParseJson(raw.value, {}) : {};
  return {
    siteName: settings.siteName || 'Kafe Lilim',
    heroMessage: settings.heroMessage || 'Warm coffee, calm mornings, and good company.',
    story: settings.story || 'Kafe Lilim is a neighborhood cafe built around thoughtful drinks, simple food, and slow moments.',
    location: settings.location || '[Editable location]',
    contactPhone: settings.contactPhone || '[Editable phone]',
    contactEmail: settings.contactEmail || '[Editable email]',
    openingHours: settings.openingHours || '[Editable opening hours]',
    socialLinks: settings.socialLinks || { instagram: '#', facebook: '#', tiktok: '#' },
    gallery: settings.gallery || [
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1200&q=80'
    ],
    mapEmbedUrl: settings.mapEmbedUrl || ''
  };
}

function getLoyaltyConfig() {
  const raw = db.prepare(`SELECT value FROM settings WHERE key = 'loyalty_settings'`).get();
  return safeParseJson(raw ? raw.value : null, {
    requiredStamps: 10,
    rewardDescription: 'One complimentary coffee or pastry after 10 stamps.',
    earningRules: 'One qualifying purchase equals one stamp.',
    expires: false,
    redemptionBehavior: 'Redeem at the counter.'
  });
}

function emitPublicMenuProducts() {
  return db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.archived = 0 AND p.visible = 1
    ORDER BY p.sort_order ASC, p.id ASC
  `).all();
}

function sanitizeText(value, fallback = '') {
  return String(value ?? fallback).trim();
}

function createCardPublicId() {
  return 'LILIM-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

function initDatabase() {
  ensureDirExists(path.dirname(dbPath));

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      category_id INTEGER,
      price REAL NOT NULL CHECK(price >= 0),
      image TEXT,
      visible INTEGER NOT NULL DEFAULT 1,
      available INTEGER NOT NULL DEFAULT 1,
      sold_out INTEGER NOT NULL DEFAULT 0,
      featured INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      display_name TEXT,
      comment TEXT,
      approved INTEGER NOT NULL DEFAULT 1,
      hidden INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS loyalty_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      public_id TEXT NOT NULL UNIQUE,
      stamp_count INTEGER NOT NULL DEFAULT 0,
      redeemed_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_reward_at TEXT
    );

    CREATE TABLE IF NOT EXISTS loyalty_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      delta INTEGER NOT NULL,
      reason TEXT,
      actor TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(card_id) REFERENCES loyalty_cards(id)
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 0,
      unit TEXT,
      low_stock_threshold REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'ok',
      last_updated TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor TEXT,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      details TEXT,
      created_at TEXT NOT NULL
    );
  `);

  const existingSite = db.prepare(`SELECT value FROM settings WHERE key = 'site_settings'`).get();
  if (!existingSite) {
    const now = new Date().toISOString();
    db.prepare(`INSERT INTO settings (key, value, updated_at) VALUES ('site_settings', ?, ?)`).run(JSON.stringify({
      siteName: 'Kafe Lilim',
      heroMessage: 'Welcome to Kafe Lilim — slow coffee, warm pastries, and good company.',
      story: 'Kafe Lilim is a neighborhood coffee house for thoughtful conversations, simple meals, and daily rituals.',
      location: '[Editable location]',
      contactPhone: '[Editable phone]',
      contactEmail: '[Editable email]',
      openingHours: '[Editable opening hours]',
      socialLinks: { instagram: '#', facebook: '#', tiktok: '#' },
      gallery: [
        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1200&q=80'
      ],
      mapEmbedUrl: ''
    }), now);
  }

  const loyaltyExists = db.prepare(`SELECT value FROM settings WHERE key = 'loyalty_settings'`).get();
  if (!loyaltyExists) {
    db.prepare(`INSERT INTO settings (key, value, updated_at) VALUES ('loyalty_settings', ?, ?)`).run(JSON.stringify({
      requiredStamps: 10,
      rewardDescription: 'One complimentary coffee or pastry after 10 stamps.',
      earningRules: 'One qualifying purchase equals one stamp.',
      expires: false,
      redemptionBehavior: 'Redeem at the counter.'
    }), new Date().toISOString());
  }

  const categoryCount = db.prepare(`SELECT COUNT(*) as count FROM categories`).get().count;
  if (categoryCount === 0) {
    const now = new Date().toISOString();
    const coffee = db.prepare(`INSERT INTO categories (name, created_at, updated_at) VALUES (?, ?, ?)`).run('Coffee', now, now);
    const nd = db.prepare(`INSERT INTO categories (name, created_at, updated_at) VALUES (?, ?, ?)`).run('Non-coffee drinks', now, now);
    const specialty = db.prepare(`INSERT INTO categories (name, created_at, updated_at) VALUES (?, ?, ?)`).run('Specialty drinks', now, now);
    const snacks = db.prepare(`INSERT INTO categories (name, created_at, updated_at) VALUES (?, ?, ?)`).run('Snacks', now, now);
    const pastries = db.prepare(`INSERT INTO categories (name, created_at, updated_at) VALUES (?, ?, ?)`).run('Pastries', now, now);

    db.prepare(`INSERT INTO products (name, description, category_id, price, image, visible, available, sold_out, featured, sort_order, archived, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      'House Latte', 'Velvety espresso with warm milk and a silky finish.', coffee.lastInsertRowid, 120, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80', 1, 1, 0, 1, 1, 0, now, now
    );
    db.prepare(`INSERT INTO products (name, description, category_id, price, image, visible, available, sold_out, featured, sort_order, archived, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      'Cappuccino', 'Balanced espresso and foam with mild chocolate dusting.', coffee.lastInsertRowid, 140, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80', 1, 1, 0, 0, 2, 0, now, now
    );
    db.prepare(`INSERT INTO products (name, description, category_id, price, image, visible, available, sold_out, featured, sort_order, archived, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      'Iced Hibiscus', 'Refreshing floral tea with citrus sparkle.', nd.lastInsertRowid, 110, 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=900&q=80', 1, 1, 0, 0, 3, 0, now, now
    );
    db.prepare(`INSERT INTO products (name, description, category_id, price, image, visible, available, sold_out, featured, sort_order, archived, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      'Matcha Cloud', 'Ceremonial matcha with oat milk and a soft vanilla finish.', specialty.lastInsertRowid, 170, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=80', 1, 1, 0, 1, 4, 0, now, now
    );
    db.prepare(`INSERT INTO products (name, description, category_id, price, image, visible, available, sold_out, featured, sort_order, archived, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      'Butter Croissant', 'Flaky pastry baked daily for a golden, buttery finish.', pastries.lastInsertRowid, 90, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=80', 1, 1, 0, 0, 5, 0, now, now
    );
    db.prepare(`INSERT INTO products (name, description, category_id, price, image, visible, available, sold_out, featured, sort_order, archived, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      'Signature Snack Box', 'A crunchy mix of nuts, fruit, and a small biscotti pair.', snacks.lastInsertRowid, 150, 'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=900&q=80', 1, 1, 0, 0, 6, 0, now, now
    );
  }

  const inventoryCount = db.prepare('SELECT COUNT(*) as count FROM inventory').get().count;
  if (inventoryCount === 0) {
    const now = new Date().toISOString();
    db.prepare(`INSERT INTO inventory (name, quantity, unit, low_stock_threshold, status, last_updated, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run('Coffee beans', 18, 'kg', 5, 'ok', now, now);
    db.prepare(`INSERT INTO inventory (name, quantity, unit, low_stock_threshold, status, last_updated, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run('Milk', 32, 'liters', 8, 'ok', now, now);
    db.prepare(`INSERT INTO inventory (name, quantity, unit, low_stock_threshold, status, last_updated, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run('Croissant dough', 12, 'batches', 4, 'warning', now, now);
  }
}

initDatabase();

app.set('trust proxy', 1);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
  referrerPolicy: { policy: 'no-referrer' }
}));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Permissions-Policy', 'camera=(), geolocation=()');
  next();
});

const sessionOptions = {
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: NODE_ENV === 'production',
    maxAge: SESSION_TTL_MS
  }
};

app.use(session(sessionOptions));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

function requireStaffAuth(req, res, next) {
  if (!req.session || !req.session.staff || !req.session.staff.role) {
    return res.status(401).json({ error: 'Unauthorized. Staff authentication required.' });
  }
  return next();
}

app.post('/api/staff/session', loginLimiter, (req, res) => {
  const passcode = sanitizeText(req.body.passcode || '', '');
  if (!passcode) {
    return res.status(400).json({ error: 'A passcode is required.' });
  }

  const staffUser = resolveStaffCredential(passcode);
  if (!staffUser) {
    logAudit('unknown', 'login_failed', 'staff_session', 'passcode', { passcodeLength: passcode.length });
    return res.status(401).json({ error: 'Invalid passcode.' });
  }

  req.session.staff = {
    name: staffUser.name,
    role: staffUser.role,
    sessionId: crypto.randomBytes(12).toString('hex'),
    authenticatedAt: new Date().toISOString()
  };
  req.session.cookie.maxAge = SESSION_TTL_MS;

  logAudit(staffUser.name, 'login_success', 'staff_session', req.session.staff.sessionId, { role: staffUser.role });
  return res.json({ success: true, role: staffUser.role, name: staffUser.name });
});

app.delete('/api/staff/session', requireStaffAuth, (req, res) => {
  const actor = req.session.staff.name || 'staff';
  req.session.destroy(() => {
    logAudit(actor, 'logout', 'staff_session', 'session', { action: 'logout' });
    res.json({ success: true, message: 'Logged out.' });
  });
});

app.get('/api/staff/session', (req, res) => {
  if (!req.session || !req.session.staff) {
    return res.json({ authenticated: false, role: null, name: null });
  }
  return res.json({ authenticated: true, role: req.session.staff.role, name: req.session.staff.name });
});

app.get('/api/settings/public', (req, res) => {
  res.json(getPublicSettings());
});

app.get('/api/categories', (req, res) => {
  const rows = db.prepare(`SELECT * FROM categories ORDER BY id ASC`).all();
  res.json(rows);
});

app.get('/api/menu', (req, res) => {
  res.json(db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.archived = 0 AND p.visible = 1
    ORDER BY p.sort_order ASC, p.id ASC
  `).all());
});

app.get('/api/reviews', (req, res) => {
  const rows = db.prepare(`
    SELECT id, rating, display_name, comment, created_at
    FROM reviews
    WHERE approved = 1 AND hidden = 0
    ORDER BY created_at DESC
  `).all();
  const total = rows.length;
  const average = total ? rows.reduce((sum, item) => sum + Number(item.rating), 0) / total : 0;
  res.json({ averageRating: Number(average.toFixed(1)), totalReviews: total, reviews: rows });
});

app.post('/api/reviews', (req, res) => {
  const rating = Number(req.body.rating);
  const displayName = sanitizeText(req.body.displayName || req.body.name || '', 'Anonymous');
  const comment = sanitizeText(req.body.comment || '', '');

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Please choose a rating between 1 and 5 stars.' });
  }

  if (comment.length > 500) {
    return res.status(400).json({ error: 'Review text is too long.' });
  }

  db.prepare(`INSERT INTO reviews (rating, display_name, comment, approved, hidden, created_at) VALUES (?, ?, ?, 1, 0, ?)`).run(rating, displayName.slice(0, 50), comment.replace(/[<>]/g, ''), new Date().toISOString());
  logAudit('customer', 'review_added', 'reviews', 'new', { rating, displayName });
  res.status(201).json({ success: true, message: 'Review submitted.' });
});

app.post('/api/loyalty/cards', (req, res) => {
  const publicId = createCardPublicId();
  const createdAt = new Date().toISOString();
  const result = db.prepare(`INSERT INTO loyalty_cards (public_id, stamp_count, redeemed_count, created_at, updated_at) VALUES (?, 0, 0, ?, ?)`).run(publicId, createdAt, createdAt);
  logAudit('customer', 'loyalty_card_created', 'loyalty_cards', String(result.lastInsertRowid), { publicId });
  res.status(201).json({ publicId, stampCount: 0, requiredStamps: getLoyaltyConfig().requiredStamps || 10, rewardDescription: getLoyaltyConfig().rewardDescription });
});

app.get('/api/loyalty/cards/:publicId', (req, res) => {
  const publicId = sanitizeText(req.params.publicId || '', '');
  const card = db.prepare(`SELECT * FROM loyalty_cards WHERE public_id = ?`).get(publicId);
  if (!card) {
    return res.status(404).json({ error: 'Loyalty card not found.' });
  }

  const config = getLoyaltyConfig();
  const transactions = db.prepare(`SELECT * FROM loyalty_transactions WHERE card_id = ? ORDER BY created_at DESC LIMIT 20`).all(card.id);
  res.json({
    publicId: card.public_id,
    stampCount: Number(card.stamp_count),
    requiredStamps: Number(config.requiredStamps || 10),
    rewardDescription: config.rewardDescription,
    rewardRedeemed: Number(card.redeemed_count),
    transactions
  });
});

app.get('/api/staff/dashboard', requireStaffAuth, (req, res) => {
  const menuCount = db.prepare(`SELECT COUNT(*) as count FROM products WHERE archived = 0`).get().count;
  const availableItems = db.prepare(`SELECT COUNT(*) as count FROM products WHERE archived = 0 AND available = 1 AND visible = 1`).get().count;
  const lowStock = db.prepare(`SELECT COUNT(*) as count FROM inventory WHERE quantity <= low_stock_threshold`).get().count;
  const reviewCount = db.prepare(`SELECT COUNT(*) as count FROM reviews`).get().count;
  const avgRating = db.prepare(`SELECT ROUND(COALESCE(AVG(rating),0),1) as average FROM reviews`).get().average;
  const cardCount = db.prepare(`SELECT COUNT(*) as count FROM loyalty_cards`).get().count;
  const totalStampsIssued = db.prepare(`SELECT COALESCE(SUM(delta), 0) as total FROM loyalty_transactions WHERE type = 'earned'`).get().total;
  const totalStampsRedeemed = db.prepare(`SELECT COALESCE(SUM(delta), 0) as total FROM loyalty_transactions WHERE type = 'redeemed'`).get().total;

  res.json({
    counts: {
      menuCount,
      availableItems,
      lowStock,
      reviewCount,
      avgRating: Number(avgRating),
      cardCount,
      totalStampsIssued: Number(totalStampsIssued),
      totalStampsRedeemed: Number(totalStampsRedeemed)
    },
    recentMenu: db.prepare(`SELECT * FROM products WHERE archived = 0 ORDER BY updated_at DESC LIMIT 5`).all(),
    recentInventory: db.prepare(`SELECT * FROM inventory ORDER BY last_updated DESC LIMIT 5`).all(),
    recentLoyalty: db.prepare(`SELECT * FROM loyalty_transactions ORDER BY created_at DESC LIMIT 5`).all(),
    recentAudit: db.prepare(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 6`).all()
  });
});

app.get('/api/staff/products', requireStaffAuth, (req, res) => {
  res.json(db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    ORDER BY p.sort_order ASC, p.id ASC
  `).all());
});

app.post('/api/staff/products', requireStaffAuth, (req, res) => {
  const role = req.session.staff.role;
  if (!['owner', 'admin', 'employee'].includes(role)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const name = sanitizeText(req.body.name || '', '');
  const description = sanitizeText(req.body.description || '', '');
  const categoryId = Number(req.body.categoryId || 0);
  const price = Number(req.body.price || 0);
  if (!name) return res.status(400).json({ error: 'Product name is required.' });
  if (!categoryId || !db.prepare(`SELECT id FROM categories WHERE id = ?`).get(categoryId)) return res.status(400).json({ error: 'Category not found.' });
  if (!Number.isFinite(price) || price < 0) return res.status(400).json({ error: 'Price must be a valid non-negative number.' });

  const now = new Date().toISOString();
  const result = db.prepare(`INSERT INTO products (name, description, category_id, price, image, visible, available, sold_out, featured, sort_order, archived, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`).run(
    name, description, categoryId, price, sanitizeText(req.body.image || '', ''), Number(req.body.visible ?? 1), Number(req.body.available ?? 1), Number(req.body.soldOut ?? 0), Number(req.body.featured ?? 0), Number(req.body.sortOrder || 0), now, now
  );

  logAudit(req.session.staff.name, 'product_created', 'products', String(result.lastInsertRowid), { name, price, categoryId });
  res.status(201).json({ success: true, id: result.lastInsertRowid });
});

app.patch('/api/staff/products/:id', requireStaffAuth, (req, res) => {
  const id = Number(req.params.id);
  const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(id);
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  const nextName = sanitizeText(req.body.name || product.name, product.name);
  const nextDescription = sanitizeText(req.body.description || product.description || '', product.description || '');
  const nextCategoryId = Number(req.body.categoryId ?? product.category_id);
  const nextPrice = Number(req.body.price ?? product.price);
  const nextVisible = Number(req.body.visible ?? product.visible) === 1 ? 1 : 0;
  const nextAvailable = Number(req.body.available ?? product.available) === 1 ? 1 : 0;
  const nextSoldOut = Number(req.body.soldOut ?? product.sold_out) === 1 ? 1 : 0;
  const nextFeatured = Number(req.body.featured ?? product.featured) === 1 ? 1 : 0;
  const nextSortOrder = Number(req.body.sortOrder ?? product.sort_order);
  const nextImage = sanitizeText(req.body.image || product.image || '', product.image || '');
  const updatedAt = new Date().toISOString();

  db.prepare(`UPDATE products SET name = ?, description = ?, category_id = ?, price = ?, image = ?, visible = ?, available = ?, sold_out = ?, featured = ?, sort_order = ?, updated_at = ? WHERE id = ?`).run(
    nextName, nextDescription, nextCategoryId, nextPrice, nextImage, nextVisible, nextAvailable, nextSoldOut, nextFeatured, nextSortOrder, updatedAt, id
  );

  logAudit(req.session.staff.name, 'product_updated', 'products', String(id), { name: nextName, price: nextPrice });
  res.json({ success: true, message: 'Product updated.' });
});

app.delete('/api/staff/products/:id', requireStaffAuth, (req, res) => {
  const id = Number(req.params.id);
  const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(id);
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  db.prepare(`UPDATE products SET archived = 1, updated_at = ? WHERE id = ?`).run(new Date().toISOString(), id);
  logAudit(req.session.staff.name, 'product_archived', 'products', String(id), { name: product.name });
  res.json({ success: true, message: 'Product archived.' });
});

app.get('/api/staff/categories', requireStaffAuth, (req, res) => {
  res.json(db.prepare(`SELECT * FROM categories ORDER BY id ASC`).all());
});

app.post('/api/staff/categories', requireStaffAuth, (req, res) => {
  const name = sanitizeText(req.body.name || '', '');
  if (!name) return res.status(400).json({ error: 'Category name is required.' });

  const now = new Date().toISOString();
  const result = db.prepare(`INSERT INTO categories (name, created_at, updated_at) VALUES (?, ?, ?)`).run(name, now, now);
  logAudit(req.session.staff.name, 'category_created', 'categories', String(result.lastInsertRowid), { name });
  res.status(201).json({ success: true, id: result.lastInsertRowid, name });
});

app.get('/api/staff/inventory', requireStaffAuth, (req, res) => {
  res.json(db.prepare(`SELECT * FROM inventory ORDER BY last_updated DESC`).all());
});

app.patch('/api/staff/inventory/:id', requireStaffAuth, (req, res) => {
  const id = Number(req.params.id);
  const item = db.prepare(`SELECT * FROM inventory WHERE id = ?`).get(id);
  if (!item) return res.status(404).json({ error: 'Inventory item not found.' });

  const quantity = Number(req.body.quantity ?? item.quantity);
  const lowStockThreshold = Number(req.body.lowStockThreshold ?? item.low_stock_threshold);
  const status = sanitizeText(req.body.status || item.status, item.status);
  const updatedAt = new Date().toISOString();

  db.prepare(`UPDATE inventory SET quantity = ?, low_stock_threshold = ?, status = ?, last_updated = ? WHERE id = ?`).run(quantity, lowStockThreshold, status, updatedAt, id);
  logAudit(req.session.staff.name, 'inventory_updated', 'inventory', String(id), { before: item.quantity, after: quantity });
  res.json({ success: true, message: 'Inventory updated.' });
});

app.get('/api/staff/reviews', requireStaffAuth, (req, res) => {
  res.json(db.prepare(`SELECT * FROM reviews ORDER BY created_at DESC`).all());
});

app.patch('/api/staff/reviews/:id', requireStaffAuth, (req, res) => {
  const id = Number(req.params.id);
  const review = db.prepare(`SELECT * FROM reviews WHERE id = ?`).get(id);
  if (!review) return res.status(404).json({ error: 'Review not found.' });

  const approved = Number(req.body.approved ?? review.approved) === 1 ? 1 : 0;
  const hidden = Number(req.body.hidden ?? review.hidden) === 1 ? 1 : 0;
  db.prepare(`UPDATE reviews SET approved = ?, hidden = ? WHERE id = ?`).run(approved, hidden, id);
  logAudit(req.session.staff.name, 'review_moderated', 'reviews', String(id), { approved, hidden });
  res.json({ success: true, message: 'Review moderation updated.' });
});

app.get('/api/staff/settings', requireStaffAuth, (req, res) => {
  res.json({ settings: getPublicSettings(), loyalty: getLoyaltyConfig() });
});

app.patch('/api/staff/settings', requireStaffAuth, (req, res) => {
  if (req.session.staff.role !== 'owner') {
    return res.status(403).json({ error: 'Only the owner can update site settings.' });
  }

  const current = getPublicSettings();
  const next = { ...current, ...(req.body.site || {}), socialLinks: { ...current.socialLinks, ...((req.body.site && req.body.site.socialLinks) || {}) }, gallery: Array.isArray(req.body.site && req.body.site.gallery) ? req.body.site.gallery : current.gallery };
  const currentLoyalty = getLoyaltyConfig();
  const nextLoyalty = { ...currentLoyalty, ...(req.body.loyalty || {}) };

  db.prepare(`INSERT INTO settings (key, value, updated_at) VALUES ('site_settings', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`).run(JSON.stringify(next), new Date().toISOString());
  db.prepare(`INSERT INTO settings (key, value, updated_at) VALUES ('loyalty_settings', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`).run(JSON.stringify(nextLoyalty), new Date().toISOString());

  logAudit(req.session.staff.name, 'site_settings_updated', 'settings', 'site_settings', { next });
  res.json({ success: true, message: 'Settings updated.' });
});

app.get('/staff', (req, res) => {
  res.sendFile(path.join(__dirname, 'staff', 'index.html'));
});

app.use('/staff', express.static(path.join(__dirname, 'staff')));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Kafe Lilim running on http://localhost:${port}`);
});
