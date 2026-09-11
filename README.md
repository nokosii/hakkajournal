# 客家與數位人文期刊

Journal of Hakka and Digital Humanities 是一套社群主導、公開審查、鑽石開放取用的期刊投稿與出版系統。

## 功能

- 會員註冊、登入與個人身分
- 上傳並公開預印本
- 依六項標準進行 1–5 分或 N/A 的公開同儕審查
- 編輯稿件資料、正式文章內容與出版狀態
- 建立、編排及發布期刊卷期
- PostgreSQL 持久儲存帳號、稿件、檔案與審查紀錄

## 本機執行

1. 複製 `.env.example` 為 `.env.local` 並設定 PostgreSQL 連線。
2. 執行 `npm install`。
3. 執行 `npm run db:migrate`。
4. 執行 `npm run dev`。

## Render

Repository 內的 `render.yaml` 會建立 Web Service 與 PostgreSQL。首次部署時需填入 `ADMIN_EMAIL` 與 `ADMIN_PASSWORD`；系統啟動後會建立主編帳號。

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/nokosii/hakkajournal)
