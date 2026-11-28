CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, role TEXT NOT NULL CHECK(role IN ('farmer','distributor','transporter')), salt TEXT NOT NULL, digest TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, farmerId TEXT NOT NULL REFERENCES users(id), name TEXT NOT NULL, price REAL NOT NULL CHECK(price>0), stock REAL NOT NULL CHECK(stock>=0), location TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, productId TEXT NOT NULL, product TEXT NOT NULL, farmerId TEXT NOT NULL REFERENCES users(id), distributorId TEXT NOT NULL REFERENCES users(id), qty REAL NOT NULL CHECK(qty>0), price REAL NOT NULL, total REAL NOT NULL, pickup TEXT NOT NULL, "drop" TEXT NOT NULL, shipping TEXT NOT NULL, method TEXT NOT NULL, status TEXT NOT NULL, transporterId TEXT REFERENCES users(id), createdAt TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, "from" TEXT NOT NULL REFERENCES users(id), "to" TEXT NOT NULL REFERENCES users(id), text TEXT NOT NULL, createdAt TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS tickets (id TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES users(id), detail TEXT NOT NULL, status TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS demands (id TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES users(id), name TEXT NOT NULL, qty REAL NOT NULL CHECK(qty>0), location TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS orders_farmer ON orders(farmerId);
CREATE INDEX IF NOT EXISTS orders_distributor ON orders(distributorId);
CREATE INDEX IF NOT EXISTS orders_transporter ON orders(transporterId);

CREATE TABLE IF NOT EXISTS sessions (tokenHash TEXT PRIMARY KEY, userId TEXT NOT NULL, expires INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(userId);
CREATE TABLE IF NOT EXISTS local_prices (id TEXT PRIMARY KEY, product TEXT NOT NULL, market TEXT NOT NULL, price REAL NOT NULL CHECK(price>0), observed TEXT NOT NULL, reporter TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS local_centres (id TEXT PRIMARY KEY, name TEXT NOT NULL, location TEXT NOT NULL, contact TEXT NOT NULL, reporter TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS local_vehicles (owner TEXT PRIMARY KEY, type TEXT NOT NULL, capacity REAL NOT NULL CHECK(capacity>0), location TEXT NOT NULL, charge REAL NOT NULL CHECK(charge>0));
CREATE TABLE IF NOT EXISTS local_harvest (productId TEXT PRIMARY KEY, district TEXT NOT NULL, harvest TEXT NOT NULL, sellBy TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, userId TEXT NOT NULL, kind TEXT NOT NULL, text TEXT NOT NULL, createdAt TEXT NOT NULL, readAt TEXT);
CREATE INDEX IF NOT EXISTS notifications_user ON notifications(userId,id);
