import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { OAuth2Client } from 'google-auth-library';

const [command, clientFile, code] = process.argv.slice(2);
const scope = ['https://www.googleapis.com/auth/drive'];

if (!['url', 'token'].includes(command) || !clientFile || (command === 'token' && !code)) {
  console.error([
    '用法：',
    '  npm run drive:oauth -- url oauth-client.json',
    '  npm run drive:oauth -- token oauth-client.json "貼上授權碼"',
  ].join('\n'));
  process.exit(1);
}

const client = JSON.parse(await readFile(clientFile, 'utf8'));
const info = client.installed || client.web || client;
const clientId = info.client_id;
const clientSecret = info.client_secret;
const redirectUri = info.redirect_uris?.[0] || 'http://localhost';

if (!clientId || !clientSecret) {
  console.error('找不到 client_id 或 client_secret。請使用 Google OAuth 用戶端 JSON。');
  process.exit(1);
}

const oauth2 = new OAuth2Client(clientId, clientSecret, redirectUri);

if (command === 'url') {
  console.error(`GOOGLE_OAUTH_CLIENT_ID=${clientId}`);
  console.error('OAuth Client Secret 已從本機檔案載入，不會顯示在終端畫面。');
  console.error('請用要保存期刊資料的 Google 帳號開啟下列網址並同意 Google Drive 權限。');
  console.log(oauth2.generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope }));
} else {
  const { tokens } = await oauth2.getToken(code);
  if (!tokens.refresh_token) {
    console.error('沒有取得 refresh token。請重新產生授權網址，並在授權畫面重新同意。');
    process.exit(1);
  }
  const outputDirectory = path.resolve(process.cwd(), '.data');
  const outputFile = path.join(outputDirectory, 'google-oauth-render.env');
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputFile, [
    `GOOGLE_OAUTH_CLIENT_ID=${clientId}`,
    `GOOGLE_OAUTH_CLIENT_SECRET=${clientSecret}`,
    `GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`,
    '',
  ].join('\n'), { encoding: 'utf8', mode: 0o600 });
  console.error(`OAuth 設定已安全儲存至 ${outputFile}`);
  console.error('此檔位於 .data，不會提交到 GitHub；請從這個檔案複製三項設定到 Render。');
}
