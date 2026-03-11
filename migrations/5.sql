CREATE TABLE user_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  friend_code TEXT NOT NULL UNIQUE,
  display_name TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_profiles_friend_code ON user_profiles(friend_code);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);