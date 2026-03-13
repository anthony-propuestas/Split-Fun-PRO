-- Email/password auth schema: users, sessions, verification and reset tokens

CREATE TABLE users (
  id TEXT PRIMARY KEY, -- UUID v4 generado por el backend
  email_encrypted TEXT NOT NULL,
  email_iv TEXT NOT NULL,
  email_hash TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_algo TEXT NOT NULL,
  email_verified_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_created_at ON users(created_at);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY, -- token opaco de sesión
  user_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

CREATE TABLE email_verification_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_email_verif_user_id ON email_verification_tokens(user_id);
CREATE INDEX idx_email_verif_expires_at ON email_verification_tokens(expires_at);

CREATE TABLE password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_pwd_reset_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_pwd_reset_expires_at ON password_reset_tokens(expires_at);

