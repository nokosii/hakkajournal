CREATE TABLE IF NOT EXISTS review_responses (
  id TEXT PRIMARY KEY,
  review_id TEXT NOT NULL UNIQUE REFERENCES reviews(id) ON DELETE CASCADE,
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  author_user_id TEXT NOT NULL REFERENCES users(id),
  response_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_responses_submission ON review_responses(submission_id);

CREATE TABLE IF NOT EXISTS submission_revisions (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  uploader_user_id TEXT NOT NULL REFERENCES users(id),
  file_data BYTEA NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  article_body TEXT NOT NULL,
  change_summary TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submission_revisions_created ON submission_revisions(submission_id, created_at);
