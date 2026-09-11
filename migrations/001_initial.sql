CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  affiliation TEXT,
  expertise TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'editor', 'editor_in_chief')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_expires ON sessions(user_id, expires_at);

CREATE TABLE IF NOT EXISTS issues (
  id TEXT PRIMARY KEY,
  volume INTEGER NOT NULL CHECK (volume > 0),
  number INTEGER NOT NULL CHECK (number > 0),
  year INTEGER NOT NULL CHECK (year >= 2000),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(volume, number)
);

CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  submitter_user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  title_en TEXT,
  author_name TEXT NOT NULL,
  affiliation TEXT,
  category TEXT NOT NULL,
  abstract TEXT NOT NULL,
  abstract_en TEXT,
  keywords TEXT,
  preprint_data BYTEA NOT NULL,
  preprint_name TEXT NOT NULL,
  preprint_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open_review' CHECK (status IN ('open_review', 'revision', 'accepted', 'published', 'rejected')),
  editor_notes TEXT NOT NULL DEFAULT '',
  article_body TEXT NOT NULL DEFAULT '',
  pages TEXT,
  doi TEXT,
  issue_id TEXT REFERENCES issues(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_status_created ON submissions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_issue ON submissions(issue_id, published_at);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  reviewer_user_id TEXT NOT NULL REFERENCES users(id),
  reviewer_name TEXT NOT NULL,
  score_relevance SMALLINT CHECK (score_relevance BETWEEN 1 AND 5),
  score_contribution SMALLINT CHECK (score_contribution BETWEEN 1 AND 5),
  score_literature SMALLINT CHECK (score_literature BETWEEN 1 AND 5),
  score_method SMALLINT CHECK (score_method BETWEEN 1 AND 5),
  score_structure SMALLINT CHECK (score_structure BETWEEN 1 AND 5),
  score_ethics SMALLINT CHECK (score_ethics BETWEEN 1 AND 5),
  academic_strengths TEXT NOT NULL,
  required_revisions TEXT NOT NULL,
  other_suggestions TEXT NOT NULL DEFAULT '',
  recommendation TEXT NOT NULL CHECK (recommendation IN ('accept', 'minor_revision', 'major_revision', 'reject')),
  conflict_statement BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(submission_id, reviewer_user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_submission_created ON reviews(submission_id, created_at);
