import { randomBytes, randomUUID, scrypt as scryptCallback } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { JWT, OAuth2Client } from 'google-auth-library';
import type { QueryResultRow } from 'pg';

const scrypt = promisify(scryptCallback);
const scopes = ['https://www.googleapis.com/auth/drive'];
const DATABASE_NAME = 'journal-database.json';

const tables = {
  USERS: ['id', 'email', 'password_hash', 'display_name', 'affiliation', 'expertise', 'role', 'status', 'created_at'],
  SESSIONS: ['token_hash', 'user_id', 'expires_at', 'created_at'],
  ISSUES: ['id', 'volume', 'number', 'year', 'title', 'description', 'status', 'published_at', 'created_by', 'created_at'],
  SUBMISSIONS: ['id', 'submitter_user_id', 'title', 'title_en', 'author_name', 'affiliation', 'category', 'abstract', 'abstract_en', 'keywords', 'author_email', 'submission_channel', 'preprint_file_id', 'preprint_name', 'preprint_type', 'final_file_id', 'final_name', 'final_type', 'final_uploaded_at', 'status', 'editor_notes', 'article_body', 'pages', 'doi', 'issue_id', 'published_at', 'created_at', 'updated_at'],
  REVIEWS: ['id', 'submission_id', 'reviewer_user_id', 'reviewer_name', 'score_relevance', 'score_contribution', 'score_literature', 'score_method', 'score_structure', 'score_ethics', 'academic_strengths', 'required_revisions', 'other_suggestions', 'recommendation', 'conflict_statement', 'created_at'],
} as const;

type TableName = keyof typeof tables;
type StoreRecord = Record<string, string>;
type DriveDatabase = { version: 1 } & Record<TableName, StoreRecord[]>;
type GoogleQueryResult<T> = { rows: T[]; rowCount: number };

declare global {
  // eslint-disable-next-line no-var
  var __jhdhGoogleAuth: Promise<JWT | OAuth2Client> | undefined;
  // eslint-disable-next-line no-var
  var __jhdhGoogleSetup: Promise<void> | undefined;
  // eslint-disable-next-line no-var
  var __jhdhGoogleWriteQueue: Promise<void> | undefined;
  // eslint-disable-next-line no-var
  var __jhdhGoogleDatabase: DriveDatabase | undefined;
  // eslint-disable-next-line no-var
  var __jhdhGoogleDatabaseFileId: string | undefined;
  // eslint-disable-next-line no-var
  var __jhdhGooglePreprintsFolderId: string | undefined;
  // eslint-disable-next-line no-var
  var __jhdhGoogleFinalsFolderId: string | undefined;
}

export function googleStoreConfigured() {
  return process.env.JOURNAL_STORAGE === 'google';
}

function configuration() {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim();
  if (!folderId) throw new Error('Google 儲存尚未完成設定：缺少 GOOGLE_DRIVE_FOLDER_ID。');
  return { folderId };
}

async function authClient() {
  if (!global.__jhdhGoogleAuth) {
    global.__jhdhGoogleAuth = (async () => {
      const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
      const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
      const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN?.trim();
      if (clientId && clientSecret && refreshToken) {
        const client = new OAuth2Client(clientId, clientSecret);
        client.setCredentials({ refresh_token: refreshToken });
        return client;
      }

      let serviceAccount: { client_email?: string; private_key?: string } | undefined;
      const encoded = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON_BASE64?.trim();
      const raw = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON?.trim()
        || (encoded ? Buffer.from(encoded, 'base64').toString('utf8') : '');
      if (raw) {
        try { serviceAccount = JSON.parse(raw); }
        catch { throw new Error('GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON 格式不正確。'); }
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        serviceAccount = JSON.parse(await fs.readFile(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
      } else if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
        serviceAccount = {
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY,
        };
      }
      if (serviceAccount?.client_email && serviceAccount.private_key) {
        return new JWT({
          email: serviceAccount.client_email,
          key: serviceAccount.private_key.replace(/\\n/g, '\n'),
          scopes,
        });
      }
      throw new Error('Google 儲存尚未完成設定：請設定 OAuth 憑證，或提供服務帳戶 JSON。');
    })();
  }
  return await global.__jhdhGoogleAuth;
}

async function googleFetch(url: string, init: RequestInit = {}) {
  const credential = await (await authClient()).getAccessToken();
  if (!credential.token) throw new Error('無法取得 Google API 存取權杖。');
  const headers = new Headers(init.headers);
  headers.set('authorization', `Bearer ${credential.token}`);
  const response = await fetch(url, { ...init, headers, cache: 'no-store' });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google API ${response.status}: ${detail.slice(0, 500)}`);
  }
  return response;
}

function emptyDatabase(): DriveDatabase {
  return { version: 1, USERS: [], SESSIONS: [], ISSUES: [], SUBMISSIONS: [], REVIEWS: [] };
}

function normalizeDatabase(input: unknown): DriveDatabase {
  const source = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const database = emptyDatabase();
  for (const table of Object.keys(tables) as TableName[]) {
    const records = Array.isArray(source[table]) ? source[table] : [];
    database[table] = records.map((record) => {
      const value = record && typeof record === 'object' ? record as Record<string, unknown> : {};
      return Object.fromEntries(tables[table].map((field) => [field, value[field] == null ? '' : String(value[field])]));
    });
  }
  return database;
}

function localDatabaseFile() {
  const directory = path.resolve(/* turbopackIgnore: true */ process.env.DATA_DIR || process.env.RENDER_DISK_MOUNT_PATH || path.join(process.cwd(), '.data'));
  return { directory, file: path.join(directory, DATABASE_NAME) };
}

function escapeDriveQuery(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function findChild(parentId: string, name: string, mimeType = '') {
  const mimeClause = mimeType ? ` and mimeType = '${escapeDriveQuery(mimeType)}'` : '';
  const query = `'${escapeDriveQuery(parentId)}' in parents and name = '${escapeDriveQuery(name)}' and trashed = false${mimeClause}`;
  const response = await googleFetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&pageSize=10&supportsAllDrives=true&includeItemsFromAllDrives=true&fields=files(id,name,mimeType)`);
  const payload = await response.json() as { files?: Array<{ id: string; name: string; mimeType: string }> };
  return payload.files?.[0] ?? null;
}

async function ensureFolder(parentId: string, name: string) {
  const mimeType = 'application/vnd.google-apps.folder';
  const existing = await findChild(parentId, name, mimeType);
  if (existing) return existing.id;
  const response = await googleFetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&fields=id', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name, mimeType, parents: [parentId] }),
  });
  const payload = await response.json() as { id?: string };
  if (!payload.id) throw new Error('Google Drive 未回傳資料夾編號。');
  return payload.id;
}

async function downloadJson(fileId: string) {
  const response = await googleFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`);
  return normalizeDatabase(await response.json());
}

function database() {
  if (!global.__jhdhGoogleDatabase) throw new Error('Google Drive 資料尚未完成載入。');
  return global.__jhdhGoogleDatabase;
}

async function persistDatabase() {
  const { directory, file } = localDatabaseFile();
  await fs.mkdir(directory, { recursive: true });
  const contents = JSON.stringify(database(), null, 2);
  const temporary = `${file}.tmp`;
  await fs.writeFile(temporary, contents, 'utf8');
  await fs.rename(temporary, file);

  if (global.__jhdhGoogleDatabaseFileId) {
    await googleFetch(`https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(global.__jhdhGoogleDatabaseFileId)}?uploadType=media&supportsAllDrives=true`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: contents,
    });
    return;
  }

  const { folderId } = configuration();
  const boundary = `jhdh-${randomUUID()}`;
  const prefix = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name: DATABASE_NAME, parents: [folderId] })}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n`;
  const suffix = `\r\n--${boundary}--`;
  const response = await googleFetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id', {
    method: 'POST', headers: { 'content-type': `multipart/related; boundary=${boundary}` }, body: new Blob([prefix, contents, suffix]),
  });
  const payload = await response.json() as { id?: string };
  if (!payload.id) throw new Error('Google Drive 未回傳資料庫檔案編號。');
  global.__jhdhGoogleDatabaseFileId = payload.id;
}

async function bootstrapEditor() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return false;
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64) as Buffer;
  const passwordHash = `scrypt:${salt}:${key.toString('hex')}`;
  const existing = database().USERS.find((user) => user.email.toLowerCase() === email);

  if (existing) {
    Object.assign(existing, {
      password_hash: passwordHash,
      display_name: process.env.ADMIN_NAME || '張陳基',
      role: 'editor_in_chief',
      status: 'active',
    });
    return true;
  }

  database().USERS.push(toRecord('USERS', {
    id: randomUUID(),
    email,
    password_hash: passwordHash,
    display_name: process.env.ADMIN_NAME || '張陳基',
    affiliation: '',
    expertise: '',
    role: 'editor_in_chief',
    status: 'active',
    created_at: new Date().toISOString(),
  }));
  return true;
}

async function ensureGoogleStore() {
  if (!global.__jhdhGoogleSetup) {
    global.__jhdhGoogleSetup = (async () => {
      const { folderId } = configuration();
      await authClient();
      const remote = await findChild(folderId, DATABASE_NAME);
      global.__jhdhGoogleDatabaseFileId = remote?.id;
      if (remote) {
        global.__jhdhGoogleDatabase = await downloadJson(remote.id);
      } else {
        const { file } = localDatabaseFile();
        try { global.__jhdhGoogleDatabase = normalizeDatabase(JSON.parse(await fs.readFile(/* turbopackIgnore: true */ file, 'utf8'))); }
        catch { global.__jhdhGoogleDatabase = emptyDatabase(); }
      }
      global.__jhdhGooglePreprintsFolderId = await ensureFolder(folderId, 'preprints');
      global.__jhdhGoogleFinalsFolderId = await ensureFolder(folderId, 'final-articles');
      const changed = await bootstrapEditor();
      if (!remote || changed) await persistDatabase();
    })();
  }
  return global.__jhdhGoogleSetup;
}

async function readRecords(table: TableName) {
  await ensureGoogleStore();
  return database()[table].map((record) => ({ ...record }));
}

function toRecord(table: TableName, record: Record<string, unknown>) {
  return Object.fromEntries(tables[table].map((field) => [field, record[field] == null ? '' : String(record[field])])) as StoreRecord;
}

async function appendRecord(table: TableName, record: Record<string, unknown>) {
  await ensureGoogleStore();
  database()[table].push(toRecord(table, record));
  await persistDatabase();
}

async function updateRecord(table: TableName, key: string, value: string, patch: Record<string, unknown>) {
  await ensureGoogleStore();
  const records = database()[table];
  const record = records.find((item) => item[key] === value);
  if (!record) return false;
  Object.assign(record, toRecord(table, { ...record, ...patch }));
  await persistDatabase();
  return true;
}

async function clearRecord(table: TableName, key: string, value: string) {
  await ensureGoogleStore();
  const records = database()[table];
  const index = records.findIndex((item) => item[key] === value);
  if (index < 0) return false;
  records.splice(index, 1);
  await persistDatabase();
  return true;
}

async function withWriteLock<T>(operation: () => Promise<T>) {
  const previous = global.__jhdhGoogleWriteQueue ?? Promise.resolve();
  let release: () => void = () => {};
  global.__jhdhGoogleWriteQueue = new Promise<void>((resolve) => { release = resolve; });
  await previous;
  try { return await operation(); } finally { release(); }
}

async function uploadDocument(folderId: string | undefined, folderLabel: string, name: string, mimeType: string, data: Buffer, existingFileId = '') {
  await ensureGoogleStore();
  if (!folderId) throw new Error(`Google Drive ${folderLabel}資料夾尚未建立。`);
  if (existingFileId) {
    await googleFetch(`https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(existingFileId)}?uploadType=media&supportsAllDrives=true`, {
      method: 'PATCH', headers: { 'content-type': mimeType }, body: Uint8Array.from(data),
    });
    await googleFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(existingFileId)}?supportsAllDrives=true`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name }),
    });
    return existingFileId;
  }
  const boundary = `jhdh-${randomUUID()}`;
  const prefix = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name, parents: [folderId] })}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`;
  const suffix = `\r\n--${boundary}--`;
  const body = new Blob([prefix, Uint8Array.from(data), suffix]);
  const response = await googleFetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id', { method: 'POST', headers: { 'content-type': `multipart/related; boundary=${boundary}` }, body });
  const result = await response.json() as { id?: string };
  if (!result.id) throw new Error('Google Drive 未回傳檔案編號。');
  return result.id;
}

async function uploadPreprint(name: string, mimeType: string, data: Buffer) {
  return uploadDocument(global.__jhdhGooglePreprintsFolderId, '預印本', name, mimeType, data);
}

async function uploadFinalPdf(name: string, mimeType: string, data: Buffer, existingFileId: string) {
  return uploadDocument(global.__jhdhGoogleFinalsFolderId, '正式文章', name, mimeType, data, existingFileId);
}

async function downloadDocument(fileId: string) {
  const response = await googleFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`);
  return Buffer.from(await response.arrayBuffer());
}

const nullable = (value: string) => value || null;
const numberOrNull = (value: string) => value ? Number(value) : null;
const numeric = (value: string) => Number(value || 0);
const now = () => new Date().toISOString();

function publicSubmission(row: StoreRecord, reviews: StoreRecord[]) {
  return {
    id: row.id, title: row.title, authorName: row.author_name, affiliation: nullable(row.affiliation),
    category: row.category, abstract: row.abstract, keywords: nullable(row.keywords), status: row.status,
    issueId: nullable(row.issue_id), createdAt: row.created_at,
    reviewCount: reviews.filter((review) => review.submission_id === row.id).length,
  };
}

function publicReview(row: StoreRecord) {
  const scores = [row.score_relevance, row.score_contribution, row.score_literature, row.score_method, row.score_structure, row.score_ethics].map(numberOrNull);
  return {
    id: row.id, reviewerName: row.reviewer_name, scoreRelevance: numberOrNull(row.score_relevance),
    scoreContribution: numberOrNull(row.score_contribution), scoreLiterature: numberOrNull(row.score_literature),
    scoreMethod: numberOrNull(row.score_method), scoreStructure: numberOrNull(row.score_structure),
    scoreEthics: numberOrNull(row.score_ethics), academicStrengths: row.academic_strengths,
    requiredRevisions: row.required_revisions, otherSuggestions: row.other_suggestions,
    recommendation: row.recommendation, createdAt: row.created_at, scores,
  };
}

export async function executeGoogleStoreQuery<T extends QueryResultRow>(sql: string, values: unknown[] = []): Promise<GoogleQueryResult<T>> {
  const statement = sql.replace(/\s+/g, ' ').trim().toLowerCase();
  const result = (rows: unknown[], rowCount = rows.length) => ({ rows: rows as T[], rowCount });

  if (statement === 'select 1') {
    await ensureGoogleStore();
    return result([{ '?column?': 1 }]);
  }

  if (statement.startsWith('insert into sessions')) return withWriteLock(async () => {
    await appendRecord('SESSIONS', { token_hash: values[0], user_id: values[1], expires_at: values[2] instanceof Date ? values[2].toISOString() : values[2], created_at: now() });
    return result([], 1);
  });
  if (statement.startsWith('delete from sessions')) return withWriteLock(async () => result([], await clearRecord('SESSIONS', 'token_hash', String(values[0])) ? 1 : 0));
  if (statement.includes('from sessions s join users u')) {
    const [sessions, users] = await Promise.all([readRecords('SESSIONS'), readRecords('USERS')]);
    const session = sessions.find((item) => item.token_hash === values[0] && new Date(item.expires_at) > new Date());
    const user = session ? users.find((item) => item.id === session.user_id && item.status === 'active') : undefined;
    return result(user ? [{ id: user.id, email: user.email, displayName: user.display_name, affiliation: nullable(user.affiliation), expertise: nullable(user.expertise), role: user.role }] : []);
  }

  if (statement === 'select 1 from users where email = $1') {
    const users = await readRecords('USERS');
    return result(users.some((user) => user.email.toLowerCase() === String(values[0]).toLowerCase()) ? [{ '?column?': 1 }] : []);
  }
  if (statement.startsWith('select id, password_hash as "passwordhash"')) {
    const users = await readRecords('USERS');
    const user = users.find((item) => item.email.toLowerCase() === String(values[0]).toLowerCase());
    return result(user ? [{ id: user.id, passwordHash: user.password_hash, status: user.status }] : []);
  }
  if (statement.startsWith('insert into users')) return withWriteLock(async () => {
    await appendRecord('USERS', { id: values[0], email: values[1], password_hash: values[2], display_name: values[3], affiliation: values[4], expertise: values[5], role: 'member', status: 'active', created_at: now() });
    return result([], 1);
  });
  if (statement.startsWith('select id, display_name as "displayname", email')) {
    const users = await readRecords('USERS');
    return result(users.sort((a, b) => b.created_at.localeCompare(a.created_at)).map((user) => ({ id: user.id, displayName: user.display_name, email: user.email, affiliation: nullable(user.affiliation), expertise: nullable(user.expertise), role: user.role, createdAt: user.created_at })));
  }
  if (statement.startsWith('update users set role')) return withWriteLock(async () => {
    const users = await readRecords('USERS');
    const user = users.find((item) => item.id === values[0] && item.role !== values[2]);
    if (!user) return result([], 0);
    await updateRecord('USERS', 'id', String(values[0]), { role: values[1] });
    return result([], 1);
  });

  if (statement.startsWith('insert into submissions')) return withWriteLock(async () => {
    const fileId = await uploadPreprint(String(values[13]), String(values[14]), values[12] as Buffer);
    await appendRecord('SUBMISSIONS', { id: values[0], submitter_user_id: values[1], title: values[2], title_en: values[3], author_name: values[4], affiliation: values[5], category: values[6], abstract: values[7], abstract_en: values[8], keywords: values[9], author_email: values[10], submission_channel: values[11], preprint_file_id: fileId, preprint_name: values[13], preprint_type: values[14], final_file_id: '', final_name: '', final_type: '', final_uploaded_at: '', status: 'open_review', editor_notes: '', article_body: values[15], pages: '', doi: '', issue_id: '', published_at: '', created_at: now(), updated_at: now() });
    return result([], 1);
  });
  if (statement.includes('from submissions s left join reviews r') && statement.includes("where s.status in ('open_review', 'revision', 'accepted', 'published')")) {
    const [submissions, reviews] = await Promise.all([readRecords('SUBMISSIONS'), readRecords('REVIEWS')]);
    const visible = new Set(['open_review', 'revision', 'accepted', 'published']);
    return result(submissions.filter((item) => visible.has(item.status)).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 100).map((item) => publicSubmission(item, reviews)));
  }
  if (statement.startsWith('select submitter_user_id as "submitteruserid"') && statement.includes('final_data as "finaldata"')) {
    const submissions = await readRecords('SUBMISSIONS');
    const submission = submissions.find((item) => item.id === values[0]);
    if (!submission) return result([]);
    return result([{ submitterUserId: submission.submitter_user_id, status: submission.status, finalData: submission.final_file_id ? await downloadDocument(submission.final_file_id) : null, finalName: nullable(submission.final_name), finalType: nullable(submission.final_type) }]);
  }
  if (statement.startsWith('select submitter_user_id as "submitteruserid"') && statement.includes('final_name as "finalname"')) {
    const submissions = await readRecords('SUBMISSIONS');
    const submission = submissions.find((item) => item.id === values[0]);
    return result(submission ? [{ submitterUserId: submission.submitter_user_id, status: submission.status, finalName: nullable(submission.final_name) }] : []);
  }
  if (statement.startsWith('select submitter_user_id as "submitteruserid"')) {
    const submissions = await readRecords('SUBMISSIONS');
    const submission = submissions.find((item) => item.id === values[0] && ['open_review', 'revision'].includes(item.status));
    return result(submission ? [{ submitterUserId: submission.submitter_user_id }] : []);
  }
  if (statement.startsWith('select preprint_data as "preprintdata"')) {
    const submissions = await readRecords('SUBMISSIONS');
    const submission = submissions.find((item) => item.id === values[0]);
    if (!submission) return result([]);
    return result([{ preprintData: await downloadDocument(submission.preprint_file_id), preprintName: submission.preprint_name, preprintType: submission.preprint_type }]);
  }
  if (statement.startsWith('select id,title,title_en as "titleen",author_name as "authorname"') && statement.includes("from submissions where id=$1 and status <> 'rejected'")) {
    const submissions = await readRecords('SUBMISSIONS');
    const item = submissions.find((row) => row.id === values[0] && ['open_review', 'revision', 'accepted', 'published'].includes(row.status));
    return result(item ? [{ id: item.id, title: item.title, titleEn: nullable(item.title_en), authorName: item.author_name, affiliation: nullable(item.affiliation), category: item.category, abstract: item.abstract, abstractEn: nullable(item.abstract_en), keywords: nullable(item.keywords), preprintName: item.preprint_name, submitterUserId: item.submitter_user_id, submissionChannel: item.submission_channel || 'member', finalName: nullable(item.final_name), status: item.status, createdAt: item.created_at }] : []);
  }
  if (statement.startsWith('select title,abstract from submissions')) {
    const submissions = await readRecords('SUBMISSIONS');
    const item = submissions.find((row) => row.id === values[0] && row.status === 'published');
    return result(item ? [{ title: item.title, abstract: item.abstract }] : []);
  }
  if (statement.startsWith('select final_name as "finalname" from submissions')) {
    const submissions = await readRecords('SUBMISSIONS');
    const item = submissions.find((row) => row.id === values[0]);
    return result(item ? [{ finalName: nullable(item.final_name) }] : []);
  }
  if (statement.includes('from submissions s join issues i') && statement.includes("s.status='published'")) {
    const [submissions, issues] = await Promise.all([readRecords('SUBMISSIONS'), readRecords('ISSUES')]);
    const item = submissions.find((row) => row.id === values[0] && row.status === 'published');
    const issue = item ? issues.find((row) => row.id === item.issue_id && row.status === 'published') : undefined;
    return result(item && issue ? [{ id: item.id, title: item.title, titleEn: nullable(item.title_en), authorName: item.author_name, affiliation: nullable(item.affiliation), category: item.category, abstract: item.abstract, abstractEn: nullable(item.abstract_en), keywords: nullable(item.keywords), articleBody: item.article_body, pages: nullable(item.pages), doi: nullable(item.doi), finalName: nullable(item.final_name), publishedAt: item.published_at, volume: numeric(issue.volume), number: numeric(issue.number), year: numeric(issue.year), issueTitle: issue.title }] : []);
  }
  if (statement.startsWith('update submissions set final_data')) return withWriteLock(async () => {
    const submissions = await readRecords('SUBMISSIONS');
    const current = submissions.find((item) => item.id === values[0]);
    if (!current) return result([], 0);
    const fileId = await uploadFinalPdf(String(values[2]), String(values[3]), values[1] as Buffer, current.final_file_id);
    await updateRecord('SUBMISSIONS', 'id', String(values[0]), { final_file_id: fileId, final_name: values[2], final_type: values[3], final_uploaded_at: now(), article_body: values[4], updated_at: now() });
    return result([], 1);
  });
  if (statement.startsWith('update submissions set title=')) return withWriteLock(async () => {
    const submissions = await readRecords('SUBMISSIONS');
    const current = submissions.find((item) => item.id === values[0]);
    if (!current) return result([], 0);
    await updateRecord('SUBMISSIONS', 'id', String(values[0]), { title: values[1], title_en: values[2], abstract: values[3], abstract_en: values[4], keywords: values[5], article_body: values[6], pages: values[7], doi: values[8], issue_id: values[9], status: values[10], editor_notes: values[11], published_at: values[10] === 'published' ? current.published_at || now() : current.published_at, updated_at: now() });
    return result([], 1);
  });
  if (statement.includes('from submissions s left join reviews r') && statement.includes('round(avg')) {
    const [submissions, reviews] = await Promise.all([readRecords('SUBMISSIONS'), readRecords('REVIEWS')]);
    return result(submissions.sort((a, b) => b.created_at.localeCompare(a.created_at)).map((item) => {
      const itemReviews = reviews.filter((review) => review.submission_id === item.id);
      const reviewAverages = itemReviews.map((review) => ['score_relevance', 'score_contribution', 'score_literature', 'score_method', 'score_structure', 'score_ethics'].map((key) => numberOrNull(review[key])).filter((score): score is number => score !== null)).filter((scores) => scores.length).map((scores) => scores.reduce((sum, score) => sum + score, 0) / scores.length);
      const averageScore = reviewAverages.length ? Math.round(reviewAverages.reduce((sum, score) => sum + score, 0) / reviewAverages.length * 10) / 10 : null;
      return { id: item.id, title: item.title, titleEn: nullable(item.title_en), authorName: item.author_name, authorEmail: nullable(item.author_email), abstract: item.abstract, abstractEn: nullable(item.abstract_en), keywords: nullable(item.keywords), status: item.status, articleBody: item.article_body, pages: nullable(item.pages), doi: nullable(item.doi), finalName: nullable(item.final_name), issueId: nullable(item.issue_id), editorNotes: item.editor_notes, submissionChannel: item.submission_channel || 'member', createdAt: item.created_at, reviewCount: itemReviews.length, averageScore };
    }));
  }
  if (statement.startsWith('select count(*)::int as count from submissions')) {
    const submissions = await readRecords('SUBMISSIONS');
    return result([{ count: submissions.filter((item) => item.issue_id === values[0] && item.status === 'published').length }]);
  }
  if (statement.includes('from submissions where issue_id=$1') || statement.includes('from submissions where issue_id = $1')) {
    const submissions = await readRecords('SUBMISSIONS');
    return result(submissions.filter((item) => item.issue_id === values[0] && item.status === 'published').sort((a, b) => (a.published_at || a.id).localeCompare(b.published_at || b.id)).map((item) => ({ id: item.id, title: item.title, titleEn: nullable(item.title_en), authorName: item.author_name, category: item.category, abstract: item.abstract, pages: nullable(item.pages), doi: nullable(item.doi) })));
  }

  if (statement.startsWith('insert into reviews')) return withWriteLock(async () => {
    const reviews = await readRecords('REVIEWS');
    if (reviews.some((review) => review.submission_id === values[1] && review.reviewer_user_id === values[2])) {
      const error = new Error('Duplicate review') as Error & { code?: string }; error.code = '23505'; throw error;
    }
    await appendRecord('REVIEWS', { id: values[0], submission_id: values[1], reviewer_user_id: values[2], reviewer_name: values[3], score_relevance: values[4], score_contribution: values[5], score_literature: values[6], score_method: values[7], score_structure: values[8], score_ethics: values[9], academic_strengths: values[10], required_revisions: values[11], other_suggestions: values[12], recommendation: values[13], conflict_statement: 'true', created_at: now() });
    return result([], 1);
  });
  if (statement.includes('from reviews where submission_id')) {
    const reviews = await readRecords('REVIEWS');
    return result(reviews.filter((review) => review.submission_id === values[0]).sort((a, b) => a.created_at.localeCompare(b.created_at)).map(publicReview));
  }

  if (statement.startsWith('insert into issues')) return withWriteLock(async () => {
    const issues = await readRecords('ISSUES');
    if (issues.some((issue) => numeric(issue.volume) === Number(values[1]) && numeric(issue.number) === Number(values[2]))) {
      const error = new Error('Duplicate issue') as Error & { code?: string }; error.code = '23505'; throw error;
    }
    await appendRecord('ISSUES', { id: values[0], volume: values[1], number: values[2], year: values[3], title: values[4], description: values[5], status: 'draft', published_at: '', created_by: values[6], created_at: now() });
    return result([], 1);
  });
  if (statement.startsWith('update issues set')) return withWriteLock(async () => {
    const issues = await readRecords('ISSUES');
    const issue = issues.find((item) => item.id === values[0]);
    if (!issue) return result([], 0);
    const status = values[3] == null ? issue.status : String(values[3]);
    await updateRecord('ISSUES', 'id', String(values[0]), { title: values[1] ?? issue.title, description: values[2] ?? issue.description, status, published_at: status === 'published' ? issue.published_at || now() : status === 'draft' ? '' : issue.published_at });
    return result([], 1);
  });
  if (statement.startsWith('select id, volume, number, year, title, description, status')) {
    const issues = await readRecords('ISSUES');
    return result(issues.sort((a, b) => numeric(b.volume) - numeric(a.volume) || numeric(b.number) - numeric(a.number)).map((issue) => ({ id: issue.id, volume: numeric(issue.volume), number: numeric(issue.number), year: numeric(issue.year), title: issue.title, description: issue.description, status: issue.status, publishedAt: nullable(issue.published_at) })));
  }
  if (statement.startsWith('select id,volume,number,year,title,description,status')) {
    const issues = await readRecords('ISSUES');
    const issue = issues.find((item) => item.id === values[0] && (!statement.includes("status='published'") || item.status === 'published'));
    return result(issue ? [{ id: issue.id, volume: numeric(issue.volume), number: numeric(issue.number), year: numeric(issue.year), title: issue.title, description: issue.description, status: issue.status, publishedAt: nullable(issue.published_at) }] : []);
  }
  if (statement.includes('from issues i left join submissions s')) {
    const [issues, submissions] = await Promise.all([readRecords('ISSUES'), readRecords('SUBMISSIONS')]);
    const visible = statement.includes("where i.status='published'") || statement.includes("where i.status = 'published'") ? issues.filter((issue) => issue.status === 'published') : issues;
    return result(visible.sort((a, b) => numeric(b.volume) - numeric(a.volume) || numeric(b.number) - numeric(a.number)).map((issue) => ({ id: issue.id, volume: numeric(issue.volume), number: numeric(issue.number), year: numeric(issue.year), title: issue.title, description: issue.description, status: issue.status, publishedAt: nullable(issue.published_at), articleCount: submissions.filter((submission) => submission.issue_id === issue.id && submission.status === 'published').length })));
  }

  throw new Error(`Google 儲存尚未支援此資料操作：${statement.slice(0, 120)}`);
}
