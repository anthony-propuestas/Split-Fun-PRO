
CREATE TABLE settlements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  from_member_id INTEGER NOT NULL,
  to_member_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  note TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_settlements_group ON settlements(group_id);
CREATE INDEX idx_settlements_from ON settlements(from_member_id);
CREATE INDEX idx_settlements_to ON settlements(to_member_id);
