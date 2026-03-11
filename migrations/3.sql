
CREATE TABLE expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  paid_by_member_id INTEGER NOT NULL,
  split_type TEXT NOT NULL DEFAULT 'equal',
  expense_date DATE,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expenses_group_id ON expenses(group_id);
CREATE INDEX idx_expenses_paid_by ON expenses(paid_by_member_id);
