# Youtube影片截選播放清單 (Youtube End Param Handler)
我們的Youtube網址格式如下:

	https://www.youtube.com/watch?
		v=ETjgki1sSgc &
		t=1591 &
		end=1880 &
		shuffle=1 &
		playlistinclude=quon &
		playlistexclude=member

此腳本用到Youtube的兩個原生參數

- `v`: VideoID，每個影片Unique
- `t`: 影片播放開始時間

並另外新增四個參數

- `end`: 設定在指定秒數停止播放影片
- `shuffle`: Playlist隨機播放
- `playlistinclude`: 讀入Playlist標籤
- `playlistexclude`: 排除Playlist標籤 

## 功能
- 設定end後會**在指定秒數停止播放器**
- end功能並不依賴播放清單功能，**end參數可以單獨傳入**
- 若傳入playlistinclude，則**只會載入有該標籤的清單**
- 若傳入playlistexclude，則會**排除有該標籤的清單**，Exclude優先於Include
- 播放清單自外鏈載入，方便更新和**自動更新**
- 若在播放清單中能找到和當前`VideoID`、`t`、`end`三個參數都相同之項目，則會進入播放清單功能 \
(在播放完該曲後循序/隨機播放下一首歌)
- 隨機功能為建立亂序清單後播放，在**所有歌曲都放過後才會循環**
- 傳入startplaylist參數時會立刻重建亂序清單

## 安裝步驟
1. 安裝瀏覧器擴充: [Tampermonkey](https://www.tampermonkey.net/)
2. 安裝腳本: [Youtube End Param Handler](https://github.com/jim60105/TampermonkeyScript/raw/main/Youtube%20End%20Param%20Handler/YoutubeEndParamHandler.user.js)
3. 修改Tampermonkey設定，每次播放都重載歌單
	1. 一般→設定模式: 進階
	2. 外部→更新週期: **永遠**
4. 播放Playlist，請手動儲存連結至書籤: https://www.youtube.com/?startplaylist \
若要開始清單隨機播放: https://www.youtube.com/?startplaylist&shuffle=1
- 如果是使用Firefox，需要關閉「阻擋媒體自動播放」功能，請參閱: \
https://support.mozilla.org/en-US/kb/block-autoplay 

## 歌單
目前內建的是[**久遠たま**](https://www.youtube.com/channel/UCBC7vYFNQoGPupe5NxPG4Bw)的歌單\
如果有小夥伴更新了歌單，直接丟Pull Request過來就行 
### 建立
歌單的建立請參考[這裡](Youtube%20End%20Param%20Handler/QuonTamaPlaylist.js)

Array中儲存四個項目: [VideoID, StartTime, EndTime, Title]

* VideoID: 必須用引號包住，為字串型態
* StartTime: 必須是非負數，為數字型態。如果要從頭播放，輸入0
* EndTime: 必須是非負數，為數字型態。如果要播放至尾，輸入0
* Title: 必須用引號包住，為字串型態

### 載入
[在腳本註解中加上@require](Youtube%20End%20Param%20Handler/YoutubeEndParamHandler.user.js#L10)，後接歌單直鏈\
支援載入複數歌單，會全部merge在一起播放

### 更新
每次播放都會由連結重載歌單，建議把歌單用Github管理
