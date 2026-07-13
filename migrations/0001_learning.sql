CREATE TABLE IF NOT EXISTS quiz_sessions (
  session_code TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  question_ids TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_created
  ON quiz_sessions(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS served_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  session_code TEXT NOT NULL,
  served_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_served_questions_user_time
  ON served_questions(user_id, served_at DESC);

CREATE TABLE IF NOT EXISTS attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  is_correct INTEGER NOT NULL CHECK (is_correct IN (0, 1)),
  session_code TEXT NOT NULL,
  answered_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_attempts_user_time
  ON attempts(user_id, answered_at DESC);

CREATE TABLE IF NOT EXISTS review_queue (
  user_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  wrong_count INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  correct_streak INTEGER NOT NULL DEFAULT 0,
  interval_days INTEGER NOT NULL DEFAULT 1,
  next_review_at TEXT NOT NULL,
  last_result INTEGER NOT NULL CHECK (last_result IN (0, 1)),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_review_queue_due
  ON review_queue(user_id, next_review_at, wrong_count DESC);

CREATE TABLE IF NOT EXISTS daily_subscriptions (
  user_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1)),
  question_count INTEGER NOT NULL DEFAULT 5,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, channel_id)
);
