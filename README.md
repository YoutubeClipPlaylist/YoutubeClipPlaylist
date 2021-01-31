# Youtube 影片截選播放清單 (Youtube Clip Playlist)

![pic](pic/demo.png)
https://blog.maki0419.com/2020/12/userscript-youtube-clip-playlist.html

## 和主版本的差異
-   增加了伊冬ユナ的歌單(https://www.youtube.com/?startplaylist&playlistinclude=ItouYuna)

## 預計新增
-   羽宮くぅ
-   神月天

## Youtube 網址格式

    https://www.youtube.com/watch?
    	v=ETjgki1sSgc &
    	t=1591 &
    	end=1880 &
    	shuffle=1 &
    	playlistinclude=quon &
    	playlistexclude=member

## Google Drive 網址格式

    https://drive.google.com/file/d/13LaALYNOmdN3GfD7aeKreyzshdKX-Tvz/view?
    	t=884 &
    	end=1166 &
    	shuffle=1 &
    	playlistinclude=quon &
    	playlistexclude=member

## 參數說明

-   VideoID: 在 Youtube 原生為`v`參數，在 Google Drive 是在路徑中
-   `t`: 影片播放開始時間
-   `end`: 設定在指定秒數停止播放影片
-   `shuffle`: Playlist 隨機播放
-   `playlistinclude`: 讀入 Playlist 標籤
-   `playlistexclude`: 排除 Playlist 標籤

## 功能

-   設定 end 後會**在指定秒數停止播放器**
-   end 功能並不依賴播放清單功能，**end 參數可以單獨傳入**
-   若傳入 playlistinclude，則**只會載入有該標籤的清單**
-   若傳入 playlistexclude，則會**排除有該標籤的清單**，Exclude 優先於 Include
-   播放清單自外鏈載入，方便更新和**自動更新**
-   若在播放清單中能找到和當前`VideoID`、`t`、`end`三個參數都相同之項目，則會進入播放清單功能 \
    (在播放完該曲後循序/隨機播放下一首歌)
-   隨機功能為建立亂序清單後播放，在**所有歌曲都放過後才會循環**
-   傳入 startplaylist 參數時會立刻重建亂序清單
-   GoogleDrive 影片無法在背景播放，若頁籤不是在前景，則會自動下一首

## 安裝步驟

1. 安裝瀏覧器擴充: [Tampermonkey](https://www.tampermonkey.net/)
2. 安裝腳本: [Youtube Clip Playlist](https://github.com/jim60105/YoutubeClipPlaylist/raw/master/YoutubeClipPlaylist.user.js)
3. 修改 Tampermonkey 設定，每次播放都重載歌單
    1. 一般 → 設定模式: 進階
    2. 外部 → 更新週期: **永遠**
4. 使用方式，請手動儲存以下啟動連結至書籤
    > 如果是使用 Firefox，需要關閉「阻擋媒體自動播放」功能，請參閱: \
    > https://support.mozilla.org/en-US/kb/block-autoplay

## 啟動連結範例

| 說明               | 連結                                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| 全清單循序         | https://www.youtube.com/?startplaylist                                                         |
| 全清單隨機         | https://www.youtube.com/?startplaylist&shuffle=1                                               |
| 久遠たま全歌單循序 | https://www.youtube.com/?startplaylist&playlistinclude=tama&playlistexclude=NotSongs           |
| 久遠たま全歌單隨機 | https://www.youtube.com/?startplaylist&playlistinclude=tama&playlistexclude=NotSongs&shuffle=1 |
| RadioQTama 廣播    | https://www.youtube.com/?startplaylist&playlistinclude=RadioQTama                              |

<!-- TODO 多標籤邏輯  -->
<!-- |久遠たま歌單(排除會限)|https://www.youtube.com/?startplaylist&playlistinclude=tama&playlistexclude=member| -->

## 歌單

目前內建的是久遠たま的歌單\
你完全可以做一份你自己的

### 建立

歌單的建立請參考[這裡](https://github.com/jim60105/Playlists/blob/master/QuonTama/QuonTamaSongList.js)

Array 中儲存項目: [VideoID, StartTime, EndTime, Title?, SubSrc?]

-   VideoID: 必須用引號包住，為字串型態
-   StartTime: 必須是非負數，為數字型態。如果要從頭播放，輸入 0
-   EndTime: 必須是非負數，為數字型態。如果要播放至尾，輸入 0
-   Title?: 必須用引號包住，為字串型態，可選
-   SubSrc?: 必須用引號包住，為字串型態，可選

### 載入

[在腳本註解中加上@require](https://github.com/jim60105/YoutubeClipPlaylist/blob/master/YoutubeClipPlaylist.user.js#L16-19)，寫上歌單直鏈\
支援載入複數歌單，會依照給定條件全部合併在一起播放

### 更新

請按照安裝步驟 3 調整設定，啟用自動重載功能\
每次播放都會由連結重載歌單，建議把歌單用 Github 管理\
如此只要更新了歌單文檔，git push 上去就能完成推送
![pic](pic/demo_git.png)

## 字幕

此工具支援載入 WebVTT 字幕(.vtt)，請將字幕直鏈傳入歌單之 SubSrc\
範例: [這裡是 WebVTT 檔案](https://github.com/jim60105/Playlists/blob/master/QuonTama/Sub/RadioQTama/0.vtt)，並[在此處傳入連結](https://github.com/jim60105/Playlists/blob/253d9cf826a54733abb99f874283632270cc4175/QuonTama/QuonTamaRadioQTamaList.js#L23)
![pic](pic/demo_sub.png)
