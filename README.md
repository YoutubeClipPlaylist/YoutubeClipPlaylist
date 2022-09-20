# ![icon](pic/icon/icon48.png) Youtube 影片截選播放清單 (Youtube Clip Playlist)

![cover](pic/ChromeWebStore/cover.png)

[![GitHub tag](https://img.shields.io/github/tag/jim60105/YoutubeClipPlaylist?style=for-the-badge)](https://github.com/jim60105/YoutubeClipPlaylist/releases) [![GitHub last commit](https://img.shields.io/github/last-commit/jim60105/YoutubeClipPlaylist?style=for-the-badge)](https://github.com/jim60105/YoutubeClipPlaylists) [![LICENSE](https://img.shields.io/github/license/jim60105/YoutubeClipPlaylist?style=for-the-badge)](https://github.com/jim60105/YoutubeClipPlaylist/blob/master/LICENSE) \
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/kdlhjpdoaabhpolkaghkjklfcdfjapkh?style=for-the-badge)](https://img.shields.io/chrome-web-store/users/kdlhjpdoaabhpolkaghkjklfcdfjapkh?style=for-the-badge) [![Chrome Web Store](https://img.shields.io/chrome-web-store/users/kdlhjpdoaabhpolkaghkjklfcdfjapkh?style=for-the-badge)](https://img.shields.io/chrome-web-store/users/kdlhjpdoaabhpolkaghkjklfcdfjapkh?style=for-the-badge) \
![Bootstrap](https://img.shields.io/static/v1?style=for-the-badge&message=Bootstrap&color=7952B3&logo=Bootstrap&logoColor=FFFFFF&label=) ![TypeScript](https://img.shields.io/static/v1?style=for-the-badge&message=TypeScript&color=3178C6&logo=TypeScript&logoColor=FFFFFF&label=) ![Webpack](https://img.shields.io/static/v1?style=for-the-badge&message=Webpack&color=222222&logo=Webpack&logoColor=8DD6F9&label=) \
![Google Chrome](https://img.shields.io/static/v1?style=for-the-badge&message=Google+Chrome&color=4285F4&logo=Google+Chrome&logoColor=FFFFFF&label=) ![YouTube](https://img.shields.io/static/v1?style=for-the-badge&message=YouTube&color=FF0000&logo=YouTube&logoColor=FFFFFF&label=) ![Microsoft OneDrive](https://img.shields.io/static/v1?style=for-the-badge&message=Microsoft+OneDrive&color=0078D4&logo=Microsoft+OneDrive&logoColor=FFFFFF&label=) ![Google Drive](https://img.shields.io/static/v1?style=for-the-badge&message=Google+Drive&color=4285F4&logo=Google+Drive&logoColor=FFFFFF&label=)

## 這是?

這是截選播放清單功能，在Youtube/Onedrive/GoogleDrive/TwitCasting上直接播放「起始~結束時間」影片片段。\
此工具專門設計來聽Vtuber的歌枠。

和烤肉或剪片相比的優點為

- 觀看數都會算在原始影片上
- 只要清單化起始/結束時間就完事，比剪片快得多
- 因為沒有轉載、修改原影片，不會有版權爭議

> 此專案曾是個油猴腳本(UserScript)，現已重寫為擴充功能\
> 它成長得太大了

## 安裝步驟

1. 參照[這篇文章](https://blog.maki0419.com/2022/01/media-autoplay-on-browser.html)，設定下方網域的**允許自動播放**

    - `https://www.youtube.com:443`
    - `https://onedrive.live.com:443`
    - `https://gothuedutw-my.sharepoint.com:443`
    - `https://twitcasting.tv:443`
    - `https://drive.google.com:443`

1. 安裝瀏覧器擴充功能: [Chrome Web Store](https://chrome.google.com/webstore/detail/kdlhjpdoaabhpolkaghkjklfcdfjapkh)

## 彈窗 UI 選單

![pic](pic/ChromeWebStore/UI.png)

### UI

瀏覧器右上角開啟擴充工具彈出式視窗

- 單擊左上角的隨機按鈕，切換是否隨機播放
- 單擊中間的紅色播放按鈕，播放**所有**播放清單
- 單擊播放清單列表，播放**單一**播放清單

### 禁用歌單功能

> _若你不聽廣播，可以把 RadioQTamaList 禁用，再使用全循序/隨機播放功能_

點擊右上角進入「編輯」功能，此時在清單項單擊可以啟用、禁用該播放清單 \
編輯完成後，請務必單擊右上角「儲存」按鈕寫入設定

## 歌單(Playlist)

目前內建**久遠たま、間取かける、薬袋アルマ、YOSHIKA⁂Ch.、須多夜花**的歌單\
如果想要編寫歌單，請參考[此 repo](https://github.com/jim60105/Playlists) \
你也可以fork此repo，從頭寫你自己的！

### 歌單格式

歌單的格式是 JSON with comment \
在這裡有[總表](https://github.com/jim60105/Playlists/blob/master/Playlists.jsonc)，標示清單名稱、標籤、位置，並載入[個別歌單](https://github.com/jim60105/Playlists/blob/master/QuonTama/QuonTamaSongList.jsonc)

每個陣列中儲存以下項目: [VideoID, StartTime, EndTime, Title?, SubSrc?]

- VideoID: 必須用雙引號包住，為字串型態
- StartTime: 必須是非負數，為數字型態。如果要從頭播放，輸入 0
- EndTime: 必須是非負數，為數字型態。如果要播放至尾，輸入 0
- Title?: 必須用雙引號包住，為字串型態，可選
- SubSrc?: 必須用雙引號包住，為字串型態，可選

## 字幕

此工具支援載入 WebVTT 字幕(.vtt)、ASS 字幕(.ass)，請將字幕直鏈傳入歌單之 SubSrc 欄位

> 我在[RadioQTama 播放清單](https://www.youtube.com/?startplaylist&playlistinclude=RadioQTama)中使用了來自[アルバート](https://twitter.com/alubto)的翻譯字幕，是直接由[他的 repo](https://gitlab.com/alubaato/tama-subs)取得內容\
> 我使用了一支[.Net Core 程式](https://github.com/jim60105/Playlists/blob/master/QuonTama/CreateRadioQTamaSubtitles/CreateRadioQTamaSubtitles/Program.cs)和[Github Workflow](https://github.com/jim60105/Playlists/blob/master/.github/workflows/CreateRadioQTamaSubtitles.yml)做 CI

![pic](pic/sub.png)

## 讀取的網址參數

- VideoID: 在 Youtube 原生為`v`參數；Google Drive 是在路徑中；其它為原始網址
- `t`: 影片播放開始時間
- `end`: 設定在指定秒數停止播放影片
- `shuffle`: Playlist 隨機播放，1 為啟用；0 為禁用(等同不傳入)
- `playlist`: 播放單一清單，不能和 `playlistinclude`、`playlistexclude` 同時傳入
- `playlistinclude`: 讀入 Playlist 標籤，可以以「\_」底線分隔傳入多個標籤，不能和 `playlist` 同時傳入
- `playlistexclude`: 排除 Playlist 標籤，可以以「\_」底線分隔傳入多個標籤，不能和 `playlist` 同時傳入

## 詳細功能描述

- 此工具是由網址參數驅動
- 傳入`startplaylist`時會啟動此工具，執行**全清單循序播放**
- 傳入`end`，會**在指定秒數停止播放器**
- 傳入`playlist`參數，會播放指定播放清單
- 使用「標籤篩選功能」，可以混合播放多個播放清單 (例如，以`playlistinclude=tama`播放久遠たま的所有類型播放清單)
  - 傳入`playlistinclude`，將**只會載入有該標籤的清單**
  - 傳入`playlistexclude`，則會**排除有該標籤的清單**
- 「禁用歌單功能」將禁用指定歌單，即使透過標籤篩選也會被排除在外
- 「隨機功能」為建立亂序清單後播放，在所有歌曲都放過一輪後才會再循環
- 支援以**鍵盤的媒體按鍵(Media Keys)操作「下一首」**
<!-- - **遮蔽「影片已暫停，要繼續觀賞嗎？」功能** -->

## LICENSE

[![LICENSE](https://img.shields.io/github/license/jim60105/YoutubeClipPlaylist?style=for-the-badge)](https://github.com/jim60105/YoutubeClipPlaylist/blob/master/LICENSE) \
此工具以 MIT License 開源
