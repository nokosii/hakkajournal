# Google 雲端硬碟儲存設定

正式環境採用以下配置：

- Google 試算表：會員、登入工作階段、投稿、審查、文章與卷期資料。
- Google 雲端硬碟資料夾：PDF、DOC、DOCX 等預印本電子檔案。
- Render：只保存 Google API 憑證與資源編號，不保存投稿資料。

密碼只會以 scrypt 雜湊值寫入試算表，不會保存可讀的原始密碼。

## 一、建立 Google Cloud 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/) 建立一個專案，例如 `hakka-journal`。
2. 進入「API 和服務」→「程式庫」。
3. 啟用 **Google Drive API**。
4. 啟用 **Google Sheets API**。

## 二、建立專用服務帳戶

1. 進入「IAM 與管理」→「服務帳戶」。
2. 建立服務帳戶，例如 `hakka-journal-storage`。
3. 不需要授予整個 Google Cloud 專案的 Editor 或 Owner 角色。
4. 開啟該服務帳戶的「金鑰」頁面，建立一把 JSON 金鑰。
5. 從 JSON 記下 `client_email` 與 `private_key`。

私密金鑰等同系統密碼。請勿上傳 GitHub、放入試算表、寄送給其他人或貼在公開對話中；只應填入 Render 的秘密環境變數。

## 三、建立共用雲端硬碟

服務帳戶沒有個人雲端硬碟儲存配額，因此正式環境應使用 Google Workspace 的「共用雲端硬碟」，不能只使用服務帳戶自己的「我的雲端硬碟」。

1. 在 Google Workspace 建立共用雲端硬碟，例如「客家與數位人文期刊」。
2. 將服務帳戶的 `client_email` 加入共用雲端硬碟。
3. 權限設為「內容管理員」；不必授予「管理員」。
4. 在共用雲端硬碟中建立資料夾，例如「期刊電子檔」。
5. 開啟該資料夾，網址中 `/folders/` 後方的字串就是 `GOOGLE_DRIVE_FOLDER_ID`。

如果使用的是一般個人 Gmail、沒有共用雲端硬碟，需改採使用者 OAuth 授權模式；目前這套部署設定預設為較適合機構期刊的服務帳戶＋共用雲端硬碟。

## 四、建立資料試算表

1. 在同一個共用雲端硬碟建立空白 Google 試算表，例如「JHDH 系統資料」。
2. 確認服務帳戶可以編輯這份試算表。
3. 試算表網址格式為 `https://docs.google.com/spreadsheets/d/試算表ID/edit`。
4. 將 `/d/` 與 `/edit` 之間的字串填為 `GOOGLE_SHEET_ID`。

第一次啟動時，系統會自動建立以下分頁與欄位，不必手動製作：

- `USERS`
- `SESSIONS`
- `ISSUES`
- `SUBMISSIONS`
- `REVIEWS`

請勿自行改名、刪除或調換第一列欄位。

## 五、設定 Render

在 Render Web Service 的 Environment 設定以下變數：

| 變數 | 內容 |
| --- | --- |
| `JOURNAL_STORAGE` | `google` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | JSON 金鑰內的 `client_email` |
| `GOOGLE_PRIVATE_KEY` | JSON 金鑰內完整的 `private_key`，包含 BEGIN/END 行 |
| `GOOGLE_SHEET_ID` | 第四步取得的試算表 ID |
| `GOOGLE_DRIVE_FOLDER_ID` | 第三步取得的資料夾 ID |
| `SESSION_SECRET` | 至少 32 字元的隨機字串；Blueprint 可自動產生 |
| `ADMIN_EMAIL` | 張維安主編的登入電子郵件 |
| `ADMIN_PASSWORD` | 主編首次登入密碼，至少 12 個字元 |
| `ADMIN_NAME` | `張維安` |

重新部署後，開啟 `/api/health`。看到 `{"status":"ok"}` 表示試算表與服務帳戶權限均正常。接著用 `ADMIN_EMAIL`、`ADMIN_PASSWORD` 登入，即可在編輯工作台指派其他會員為編輯。

## 六、權限與備份建議

- 共用雲端硬碟只加入必要的編輯團隊成員。
- 不要將系統資料試算表設為「知道連結的任何人」。
- 定期匯出試算表及電子檔案作離線備份。
- 人員異動或疑似洩漏時，立即停用舊金鑰並建立新金鑰。
- 投稿量或同時使用人數增加後，建議把會員與審查資料遷移至正式關聯式資料庫，只保留電子檔於 Drive。
