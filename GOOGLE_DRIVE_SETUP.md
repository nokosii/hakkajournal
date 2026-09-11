# Google 雲端硬碟儲存設定

期刊系統採用與「隨選客語 Podcast」網站相同的儲存方式：

- 個人 Google Drive 資料夾作為正式資料來源。
- `journal-database.json` 保存會員、登入工作階段、投稿、審查、文章與期刊卷期資料。
- `preprints/` 子資料夾保存 PDF、DOC、DOCX 預刊本。
- Render 或本機的 `.data/` 只作為 JSON 快取；每次正式寫入後會同步回 Google Drive。

會員密碼只保存 scrypt 雜湊值，不會保存可讀的原始密碼。

## 一、建立 Google Drive 資料夾

1. 使用要保存期刊資料的 Google 帳號登入 [Google Drive](https://drive.google.com/)。
2. 在「我的雲端硬碟」建立資料夾，例如「客家與數位人文期刊資料」。
3. 開啟資料夾，複製網址中 `/folders/` 後面的字串。
4. 這段字串就是 Render 要使用的 `GOOGLE_DRIVE_FOLDER_ID`。

系統第一次連線時會自動建立 `journal-database.json` 與 `preprints/`，不必手動建立試算表或資料欄位。

## 二、啟用 Google Drive API

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)，選擇「隨選客語 Podcast」使用的既有專案，或建立新專案。
2. 進入「API 和服務」→「程式庫」。
3. 搜尋並啟用 **Google Drive API**。

本模式不使用 Google Sheets API。

## 三、設定 OAuth 同意畫面

1. 進入「Google Auth Platform」或「API 和服務」→「OAuth 同意畫面」。
2. 如果使用一般 Gmail，使用者類型選「外部」。
3. 應用程式名稱可填「客家與數位人文期刊」。
4. 加入自己的 Google 帳號為測試使用者。
5. 權限範圍加入 Google Drive：`https://www.googleapis.com/auth/drive`。

若直接沿用 Podcast 網站已經設定完成的 OAuth 用戶端與同一個 Google 帳號，通常可以沿用原來的 client ID、client secret 與 refresh token，只需為期刊建立另一個 Drive 資料夾並使用新的資料夾 ID。

## 四、建立 OAuth 用戶端

1. 進入「API 和服務」→「憑證」。
2. 點選「建立憑證」→「OAuth 用戶端 ID」。
3. 應用程式類型選擇「電腦版應用程式」。
4. 名稱可填「JHDH Drive Storage」。
5. 下載 OAuth 用戶端 JSON，放在專案根目錄並命名為 `oauth-client.json`。

`oauth-client.json` 已被 `.gitignore` 排除，請勿提交到 GitHub。

## 五、取得 refresh token

在專案目錄執行：

```powershell
npm run drive:oauth -- url oauth-client.json
```

工具會顯示 OAuth Client ID 與一個授權網址，但不會在終端顯示 Client Secret：

1. 用保存期刊資料的 Google 帳號開啟授權網址。
2. 同意 Google Drive 權限。
3. 授權完成後，瀏覽器會前往 localhost；即使頁面無法開啟也沒關係。
4. 從瀏覽器網址列複製 `code=` 後面的授權碼，直到下一個 `&` 之前。
5. 執行：

```powershell
npm run drive:oauth -- token oauth-client.json "貼上授權碼"
```

工具會把 Client ID、Client Secret 與新的 Refresh Token 安全寫入 `.data/google-oauth-render.env`，不會把密鑰印在終端。請從該檔案複製三項設定到 Render；`.data/` 已被 Git 排除。這些資料都是秘密，請不要貼到聊天室或提交 GitHub。

## 六、設定 Render

在 Render Web Service 的 Environment 填入：

| 變數 | 內容 |
| --- | --- |
| `JOURNAL_STORAGE` | `google` |
| `GOOGLE_DRIVE_FOLDER_ID` | 第一步取得的資料夾 ID |
| `GOOGLE_OAUTH_CLIENT_ID` | OAuth 用戶端 ID |
| `GOOGLE_OAUTH_CLIENT_SECRET` | OAuth 用戶端密鑰 |
| `GOOGLE_OAUTH_REFRESH_TOKEN` | 第五步取得的 refresh token |
| `SESSION_SECRET` | 至少 32 字元的隨機字串；Blueprint 可自動產生 |
| `ADMIN_EMAIL` | 張維安主編的登入電子郵件 |
| `ADMIN_PASSWORD` | 主編首次登入密碼，至少 12 個字元 |
| `ADMIN_NAME` | `張維安` |

重新部署後開啟 `/api/health`。看到 `{"status":"ok"}` 表示 Google Drive 已連線成功。接著檢查 Drive 資料夾，應出現：

```text
客家與數位人文期刊資料/
├─ journal-database.json
└─ preprints/
```

## 七、Render Persistent Disk（選用）

Google Drive 才是正式資料來源，因此沒有 Persistent Disk 也能運作。若 Render 方案有永久磁碟，可掛載 `/var/data` 並增加：

```text
DATA_DIR=/var/data
```

這能保留本機快取並減少重新下載，但不能取代 Google Drive 備份。

## 八、服務帳戶備用模式

系統仍相容 Podcast 網站的服務帳戶環境變數：

```text
GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON_BASE64=
```

但服務帳戶沒有個人 Drive 儲存配額。若使用一般「我的雲端硬碟」資料夾，請優先採 OAuth；服務帳戶較適合 Google Workspace 共用雲端硬碟。

## 九、安全與備份

- 不要公開分享期刊資料資料夾或 `journal-database.json`，其中包含會員帳號資料與密碼雜湊。
- OAuth client secret、refresh token、服務帳戶 JSON 都不得提交到 GitHub。
- 定期下載整個 Drive 資料夾作離線備份。
- OAuth 憑證失效時，系統會拒絕 Google 儲存操作，不會改用瀏覽器暫存資料。
- 此 JSON 模式適合單一 Render 執行個體；若未來同時使用量大幅增加，再遷移到關聯式資料庫。
