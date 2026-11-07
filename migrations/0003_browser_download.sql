-- The delivery email is gone. The site's download now belongs to the browser that started checkout,
-- recorded here as a hash of its cookie.
DROP INDEX idx_orders_delivery_token;
ALTER TABLE orders DROP COLUMN delivery_token_hash;
ALTER TABLE orders DROP COLUMN delivery_expires_at;
ALTER TABLE orders DROP COLUMN delivery_sent_at;
ALTER TABLE consents ADD COLUMN browser_hash TEXT;
