-- What the buyer agreed to, stored before they ever reach checkout.
CREATE TABLE consents (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  terms_version TEXT NOT NULL,
  refund_version TEXT NOT NULL,
  license_version TEXT NOT NULL,
  withdrawal_waiver INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_consents_email ON consents(email);

-- payment_id comes from Dodo. status: paid | review | refunded | disputed | chargeback
CREATE TABLE orders (
  payment_id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL,
  total_amount INTEGER,
  currency TEXT,
  consent_id TEXT,
  is_duplicate INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_orders_email ON orders(email);

-- Dodo retries up to 8 times. webhook-id is the dedupe key.
CREATE TABLE webhook_events (
  webhook_id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  received_at TEXT NOT NULL
);

CREATE TABLE downloads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_downloads_payment ON downloads(payment_id, created_at);

CREATE TABLE reels (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  topic TEXT,
  transcript TEXT,
  duration_seconds REAL NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  video_key TEXT NOT NULL,
  poster_key TEXT NOT NULL,
  teaser_key TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  published_at TEXT NOT NULL
);
CREATE INDEX idx_reels_sort ON reels(sort_order, published_at);
