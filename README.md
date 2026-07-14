# 課程網站使用說明

## 線上網址

- 課程網站：<https://ryanlin02.github.io/chiayi-tax-ai-camp-2026/>
- GitHub repository：<https://github.com/ryanlin02/chiayi-tax-ai-camp-2026>

網站由 `main` 分支根目錄發布。課程後若要停止公開，請到 repository 的 `Settings → Pages` 停止發布，並另外關閉 Google 表單回覆與 Drive 備援資料夾權限。

## 開啟方式

直接雙擊 `index.html` 即可使用。網站沒有外部程式套件，課程內容與圖卡製作器在離線狀態仍可開啟；Gemini、ChatGPT、官方資料與繳交連結需要網路。

若瀏覽器限制本機功能，可在此資料夾開啟終端機後執行：

```bash
python3 -m http.server 8080
```

再到瀏覽器開啟 `http://localhost:8080/`。

## 成果收件

上午、下午 Google 表單已建立並放入網站；原本的 Google Drive 資料夾保留作為備援。表單另收集一句有效提示詞、查證方式與選填修正紀錄。表單管理連結與設定紀錄見 `../../02_活動行政/成果收件連結與表單設定.md`。

公開上課期間可暫時保留表單與 Drive 備援連結；課程結束後應關閉 Google 表單回覆、停止公開 GitHub Pages，並檢查 Drive 備援資料夾權限。完整清單見 `../../02_活動行政/課程後關閉與收件檢查清單.md`。

## 更新線上網站

在此資料夾確認修改完成後，執行：

```bash
git add .
git commit -m "Update course website"
git push
```

推送後 GitHub Pages 通常需要短暫時間重新建置；發布前仍要實際打開線上網址核對。

## 課後延伸

`extension.html` 只收錄與本課程主軸直接相關的內容：AI 私人老師、多來源查證、NotebookLM、Gem 與查證後的創作。原參考教案中的短期額度資訊、去浮水印工具與完整影片工具教學均不納入。

## 成果圖卡工具

- 圖片、姓名與文字都只在使用者瀏覽器內處理。
- 成果固定輸出為 1080 × 1080 PNG。
- 檔名會自動依姓名與主題產生。
- 四主題檔名：`反賄選`、`納保官`、`反詐騙`、`稅籍異動即時通`。

## 檔案結構

```text
課程網站/
├── index.html
├── resources.html
├── extension.html
├── README.md
└── assets/
    ├── styles.css
    └── app.js
```
