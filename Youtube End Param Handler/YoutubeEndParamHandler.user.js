// ==UserScript==
// @name     Youtube End Param Handler
// @version  2.1
// @author   琳(jim60105)
// @homepage https://blog.maki0419.com/
// @grant    none
// @include  https://www.youtube.com/*
// @require  https://github.com/jim60105/TampermonkeyScript/raw/main/Youtube%20End%20Param%20Handler/QuonTamaPlaylist.js
// ==/UserScript==

/**在上方的@require加入自己的歌單，請參考範例建立
  *可以多次require，會全部載入
 **/

(function () {
    var playlist = (typeof playlist === 'undefined') ? [] : playlist;
    if (window.location.href.indexOf("startplaylist") >= 0) {
        //playlist由@require載入
        var ele = playlist[0];
        var newParams = new URLSearchParams([
            ["v", ele[0]],
            ["t", ele[1]],
            ["end", ele[2]],
            ["shuffle", 0]
        ]);
        document.location.href = "https://www.youtube.com/watch?" + newParams.toString();
        return;
    }

    var player = document.getElementsByTagName('video')[0];
    var urlParams = new URLSearchParams(window.location.search);
    var shuffle = 0;
    var index = -1;

    if (urlParams.has('end')) {
        if (urlParams.has('shuffle') && urlParams.get("shuffle") == 1) {
            shuffle = 1;
            console.log("Shuffle: On");
        }

        //Check playlist
        for (var i = 0; i < playlist.length; i++) {
            var currentSong = playlist[i];
            if (currentSong[0] == urlParams.get('v') && (currentSong[1] <= 1 || currentSong[1] == urlParams.get('t')) && currentSong[2] == urlParams.get('end')) {
                console.log("Playing on Playlist No."+i);
                index = i;
                break;
            }
        }

        player.ontimeupdate = function () {
            var flag = player.currentTime > urlParams.get('end');
            if (urlParams.get('end') <= 1) flag = false;
            if (player.ended) flag = true;

            if (flag) {
                player.pause();
                console.log("Pause player at " + player.currentTime);

                if(index>=0) {
                    var currentSong;
                    //Next Song
                    if (shuffle) {
                        currentSong = playlist[Math.floor(Math.random() * playlist.length)];
                    } else {
                        if (index == playlist.length - 1) return;
                        currentSong = playlist[index + 1];
                    }
                    var newParams = new URLSearchParams([
                        ["v", currentSong[0]],
                        ["t", currentSong[1]],
                        ["end", currentSong[2]],
                        ["shuffle", shuffle]
                    ]);
                    document.location.href = window.location.origin + window.location.pathname + '?' + newParams.toString();
                }
            }
        }
    }
})();