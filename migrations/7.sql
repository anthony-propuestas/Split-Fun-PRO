CREATE TABLE payment_reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  from_member_id INTEGER NOT NULL,
  to_member_id INTEGER NOT NULL,
  from_user_id TEXT NOT NULL,
  to_user_id TEXT,
  amount REAL NOT NULL,
  meme_url TEXT,
  message TEXT,
  is_seen BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_reminders_to_user ON payment_reminders(to_user_id);
CREATE INDEX idx_payment_reminders_from_user ON payment_reminders(from_user_id);