-- The private link in our delivery email. Only a hash is stored, so a database leak exposes no links.
ALTER TABLE orders ADD COLUMN delivery_token_hash TEXT;
ALTER TABLE orders ADD COLUMN delivery_expires_at TEXT;
ALTER TABLE orders ADD COLUMN delivery_sent_at TEXT;
CREATE UNIQUE INDEX idx_orders_delivery_token ON orders(delivery_token_hash);
