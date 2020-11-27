// ==UserScript==
// @name         Youtube End Param Handler
// @updateURL    https://github.com/jim60105/TampermonkeyScript/raw/main/Youtube%20End%20Param%20Handler/YoutubeEndParamHandler.user.js
// @downloadURL  https://github.com/jim60105/TampermonkeyScript/raw/main/Youtube%20End%20Param%20Handler/YoutubeEndParamHandler.user.js
// @version      2.11
// @author       琳(jim60105)
// @homepage     https://blog.maki0419.com/2020/10/userscript-youtube-end-param-handler.html
// @grant        GM_setValue
// @grant        GM_getValue
// @include      https://www.youtube.com/*
// @noframes
// @require      https://github.com/jim60105/TampermonkeyScript/raw/main/Youtube%20End%20Param%20Handler/QuonTamaPlaylist.js
// @require      https://github.com/jim60105/TampermonkeyScript/raw/main/Youtube%20End%20Param%20Handler/QuonTamaMemberPlaylist.js
// ==/UserScript==

/** 在上方的@require加入自己的歌單，請參考範例建立 **/

(function() {
    'use strict';
    var urlParams = new URLSearchParams(window.location.search);
    var shuffle = 0;
    if (urlParams.has('shuffle') && urlParams.get("shuffle") == 1) {
        shuffle = 1;
        console.log("Shuffle: On");
    }

    var shuffleList = GM_getValue('shuffleList', []);
    console.log(shuffleList);

    //Start Playlist
    if (urlParams.has("startplaylist")) {
        urlParams.delete("startplaylist");

        shuffleList = makeShufflelist(myPlaylist.length);

        nextSong(-1);
    }

    var player;
    //Wait for DOM
    var interval = setInterval(function() {
        player = document.getElementsByTagName('video')[0];
        if (typeof player != 'undefined') {
            clearInterval(interval);
            checkList();
            player.ondurationchange = checkList;
        }
    }, 2000);

    function checkList() {
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
            player.ontimeupdate = function() {
                //console.log(player.currentTime);
                var flag = player.currentTime > urlParams.get('end');
                if (urlParams.get('end') == 0) flag = false;
                if (player.ended) flag = true;

                if (flag) {
                    player.pause();
                    player.ontimeupdate = null;
                    console.log("Pause player at " + player.currentTime);

                    if (currentIndex >= 0) {
                        nextSong(currentIndex);
                    }
                    return;
                }

                //Clear ontimeupdate when it is detected that the current time is less than the start time.
                if (player.currentTime < urlParams.get('t')) {
                    console.log("Clear end parameter function");
                    console.log("It is detected that the current time is less than the start time.");
                    player.ontimeupdate = null;
                }
            }
        } else {
            console.log("Clear end parameter function");
            player.ontimeupdate = null;
        }
    }

    function makeShufflelist(length) {
        var shuffleList = [];
        for (i = 0; i < length; ++i) shuffleList[i] = i;

        // http://stackoverflow.com/questions/962802#962890
        var tmp, current, top = shuffleList.length;
        if (top)
            while (--top) {
                current = Math.floor(Math.random() * (top + 1));
                tmp = shuffleList[current];
                shuffleList[current] = shuffleList[top];
                shuffleList[top] = tmp;
            }

        return shuffleList;
    }

    function nextSong(index) {
        if (shuffle) {
            if (shuffleList.length <= 0) shuffleList = makeShufflelist(myPlaylist.length);
            index = shuffleList.shift();
            GM_setValue('shuffleList', shuffleList);
        } else {
            index = index + 1;
            index %= myPlaylist.length;
        }

        var nextSong = myPlaylist[index];
        urlParams.set("v", nextSong[0]);
        urlParams.set("t", nextSong[1]);
        urlParams.set("end", nextSong[2]);

        document.location.href = "https://www.youtube.com/watch?" + urlParams.toString();
    }
})();