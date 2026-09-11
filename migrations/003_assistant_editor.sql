ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('member', 'assistant_editor', 'editor', 'editor_in_chief'));

ALTER TABLE submissions ADD COLUMN IF NOT EXISTS author_email TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS submission_channel TEXT NOT NULL DEFAULT 'member';
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_submission_channel_check;
ALTER TABLE submissions ADD CONSTRAINT submissions_submission_channel_check CHECK (submission_channel IN ('member', 'assisted_email'));
