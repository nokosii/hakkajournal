# 客家與數位人文期刊

Journal of Hakka and Digital Humanities 是一套社群主導、公開審查、鑽石開放取用的期刊投稿與出版系統。

## 功能

- 會員註冊、登入與個人身分
- 上傳並公開預印本
- 依六項標準進行 1–5 分或 N/A 的公開同儕審查
- 編輯稿件資料、正式文章內容與出版狀態
- 建立、編排及發布期刊卷期
- Google 試算表保存會員與期刊紀錄，Google 雲端硬碟保存電子檔案

## 本機執行

1. 複製 `.env.example` 為 `.env.local`；未設定外部儲存時會使用專案內建的本機資料庫。
2. 執行 `npm install`。
3. 執行 `npm run dev`。

正式使用 Google 儲存前，請依照 [Google 雲端硬碟設定說明](./GOOGLE_DRIVE_SETUP.md) 建立共用雲端硬碟、試算表與服務帳戶。

## Render

Repository 內的 `render.yaml` 會建立 Web Service。首次部署時需填入 Google 儲存設定、`ADMIN_EMAIL` 與 `ADMIN_PASSWORD`；首次連線會自動建立資料分頁與主編帳號。

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/nokosii/hakkajournal)
