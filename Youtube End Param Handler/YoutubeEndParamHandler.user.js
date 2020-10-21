// ==UserScript==
// @name     Youtube End Param Handler
// @updateURL https://github.com/jim60105/TampermonkeyScript/raw/main/Youtube%20End%20Param%20Handler/YoutubeEndParamHandler.user.js
// @downloadURL https://github.com/jim60105/TampermonkeyScript/raw/main/Youtube%20End%20Param%20Handler/YoutubeEndParamHandler.user.js
// @version  2.3
// @author   琳(jim60105)
// @homepage https://blog.maki0419.com/
// @grant    none
// @include  https://www.youtube.com/*
// @require  https://github.com/jim60105/TampermonkeyScript/raw/main/Youtube%20End%20Param%20Handler/QuonTamaPlaylist.js
// @require  https://github.com/jim60105/TampermonkeyScript/raw/main/Youtube%20End%20Param%20Handler/QuonTamaMemberPlaylist.js
// ==/UserScript==

/** 在上方的@require加入自己的歌單，請參考範例建立 **/

(function () {
    var urlParams = new URLSearchParams(window.location.search);
    var player = document.getElementsByTagName('video')[0];
    var shuffle = 0;

    if (urlParams.has('shuffle') && urlParams.get("shuffle") == 1) {
        shuffle = 1;
        console.log("Shuffle: On");
    }

    //Start Playlist
    if (urlParams.has("startplaylist")) {
        nextSong(0);
    }

    if (urlParams.has('end')) {
        var currentIndex = -1;
        var currentSong;

        //Check myPlaylist
        //myPlaylist is declared in @require
        for (var i = 0; i < myPlaylist.length; i++) {
            currentSong = myPlaylist[i];
            if (currentSong[0] == urlParams.get('v') && currentSong[1] == urlParams.get('t') && currentSong[2] == urlParams.get('end')) {
                console.log("Playing on Playlist No." + i);
                currentIndex = i;
                break;
            }
        }

        //Stop the player when the end time is up.
        player.ontimeupdate = function () {
            var flag = player.currentTime > urlParams.get('end');
            if (urlParams.get('end') <= 1) flag = false;
            if (player.ended) flag = true;

            if (flag) {
                player.pause();
                console.log("Pause player at " + player.currentTime);

                if (currentIndex >= 0) {
                    nextSong((currentIndex == myPlaylist.length - 1) ? 0 : currentIndex + 1);
                }
            }
        }
    }

    function nextSong(i) {
        var nextSong;
        if (shuffle) {
            nextSong = myPlaylist[Math.floor(Math.random() * myPlaylist.length)];
        }else{
            nextSong = myPlaylist[i];
        }

        var newParams = new URLSearchParams([
            ["v", nextSong[0]],
            ["t", nextSong[1]],
            ["end", nextSong[2]],
            ["shuffle", shuffle]
        ]);
        document.location.href = "https://www.youtube.com/watch?" + newParams.toString();
        return;
    }
})();