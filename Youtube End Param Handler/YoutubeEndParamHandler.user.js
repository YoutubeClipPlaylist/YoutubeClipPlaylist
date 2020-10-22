// ==UserScript==
// @name     Youtube End Param Handler
// @updateURL https://github.com/jim60105/TampermonkeyScript/raw/main/Youtube%20End%20Param%20Handler/YoutubeEndParamHandler.user.js
// @downloadURL https://github.com/jim60105/TampermonkeyScript/raw/main/Youtube%20End%20Param%20Handler/YoutubeEndParamHandler.user.js
// @version  2.5
// @author   琳(jim60105)
// @homepage https://blog.maki0419.com/2020/10/userscript-youtube-end-param-handler.html
// @grant    none
// @include  https://www.youtube.com/*
// @require  https://github.com/jim60105/TampermonkeyScript/raw/main/Youtube%20End%20Param%20Handler/QuonTamaPlaylist.js
// @require  https://github.com/jim60105/TampermonkeyScript/raw/main/Youtube%20End%20Param%20Handler/QuonTamaMemberPlaylist.js
// ==/UserScript==

/** 在上方的@require加入自己的歌單，請參考範例建立 **/

(function () {
    var urlParams = new URLSearchParams(window.location.search);
    var shuffle = 0;
    if (urlParams.has('shuffle') && urlParams.get("shuffle") == 1) {
        shuffle = 1;
        console.log("Shuffle: On");
    }

    //Start Playlist
    if (urlParams.has("startplaylist")) {
        urlParams.delete("startplaylist");
        nextSong(0);
    }

    var player = document.getElementsByTagName('video')[0];
    if(typeof player === 'undefined'){ return; }
    player.ondurationchange = function(){
        urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('end')) {
            var currentIndex = -1;
            //Check myPlaylist
            //myPlaylist is declared in @require
            for (var i = 0; i < myPlaylist.length; i++) {
                if (myPlaylist[i][0] == urlParams.get('v') && myPlaylist[i][1] == urlParams.get('t') && myPlaylist[i][2] == urlParams.get('end')) {
                    console.log("Playing on Playlist No." + i);
                    currentIndex = i;
                }
            }

            //Stop the player when the end time is up.
            player.ontimeupdate = function () {
                //console.log(player.currentTime);
                var flag = player.currentTime > urlParams.get('end');
                if (urlParams.get('end') <= 1) flag = false;
                if (player.ended) flag = true;

                if (flag) {

                    console.log("3");
                    player.pause();
                    console.log("Pause player at " + player.currentTime);

                    if (currentIndex >= 0) {
                        nextSong((currentIndex == myPlaylist.length - 1) ? 0 : currentIndex + 1);
                    }
                }
            }
        }else{
            console.log("Clear ontimeupdate");
            player.ontimeupdate = null;
        }
    };

    function nextSong(i) {
        var nextSong;
        if (shuffle) {
            nextSong = myPlaylist[Math.floor(Math.random() * myPlaylist.length)];
        }else{
            nextSong = myPlaylist[i];
        }

        urlParams.set("v", nextSong[0]);
        urlParams.set("t", nextSong[1]);
        urlParams.set("end", nextSong[2]);

        document.location.href = "https://www.youtube.com/watch?" + urlParams.toString();
    }
})();