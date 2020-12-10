// ==UserScript==
// @name         Youtube End Param Handler
// @updateURL    https://github.com/jim60105/TampermonkeyScript/raw/main/Youtube%20End%20Param%20Handler/YoutubeEndParamHandler.user.js
// @downloadURL  https://github.com/jim60105/TampermonkeyScript/raw/main/Youtube%20End%20Param%20Handler/YoutubeEndParamHandler.user.js
// @version      5.3
// @author       琳(jim60105)
// @homepage     https://blog.maki0419.com/2020/10/userscript-youtube-end-param-handler.html
// @grant        GM_setValue
// @grant        GM_getValue
// @include      https://www.youtube.com/*
// @include      https://drive.google.com/file/*
// @include      https://youtube.googleapis.com/*
// @require      https://github.com/jim60105/SongLists/raw/master/QuonTama/QuonTamaSongList.js
// @require      https://github.com/jim60105/SongLists/raw/master/QuonTama/QuonTamaMemberSongList.js
// @require      https://github.com/jim60105/SongLists/raw/master/QuonTama/QuonTamaBackupSongList.js
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
    // console.log("New Start");
    console.log(shuffleList);

    //Start Playlist
    if (urlParams.has("startplaylist") || shuffleList.length > myPlaylist.length) {
        urlParams.delete("startplaylist");

        shuffleList = [0];

        GM_setValue('shuffleList', shuffleList);
        nextSong(-1);
    }

    function makeShufflelist(length) {
        var shuffleList = [];
        for (var i = 0; i < length; ++i) shuffleList[i] = i;

        // http://stackoverflow.com/questions/962802#962890
        var tmp, current, top = shuffleList.length;
        if (top)
            while (--top) {
                current = Math.floor(Math.random() * (top + 1));
                tmp = shuffleList[current];
                shuffleList[current] = shuffleList[top];
                shuffleList[top] = tmp;
            }

        console.log("Make new shuffleList");
        return shuffleList;
    }

    var player;
    //Wait for DOM
    var interval = setInterval(function() {
        if (window.location.pathname.match(/^\/file\/d\/.*\/view$/i)) {
            // Google Drive files
            var iframe = document.getElementById("drive-viewer-video-player-object-0");
            if (iframe && iframe.tagName == "IFRAME") {
                clearInterval(interval);

                // Display the thumb video forcely
                iframe.parentNode.parentNode.childNodes[1].style.visibility = "hidden";
                iframe.parentNode.parentNode.childNodes[2].style.visibility = "unset";
                var box = iframe.parentNode.parentElement;
                box.style.width = "100%";
                box.style.height = "100%";
                box.style.border = "0px";
                box.style.top = "unset";
                box.style.left = "unset";

                // Map the params into iframe
                var iframeURL = new URL(iframe.src);
                var iframeUrlParams = iframeURL.searchParams;
                iframeUrlParams.set("autoplay", 1);
                if (urlParams.has("t")) iframeUrlParams.set("start", urlParams.get("t"));
                if (urlParams.has("end")) iframeUrlParams.set("end", urlParams.get("end"));
                iframe.src = iframeURL.toString();
                // And then will trigger this script inside iframe.

                // NextSong after play end
                window.addEventListener("message", function(event) {
                    if (event.data == "child frame") {
                        nextSong(checkList());
                    }
                });
            }
        } else {
            // Skip the song if it is on Google Drive and play in the background.
            if (window.location.pathname == "/embed/" && document.visibilityState == "hidden") {
                //console.log(document.visibilityState);
                clearInterval(interval);
                nextSong(checkList());
            }

            player = document.getElementsByTagName('video')[0];
            if (typeof player != 'undefined') {
                clearInterval(interval);
                player.play();
                doMain();
                player.ondurationchange = doMain;
            }
        }
    }, 1000);

    function doMain() {
        urlParams = new URLSearchParams(window.location.search);
        var currentIndex = checkList();
        if (currentIndex >= 0) {
            // Handle Keyboard Media Key "NextTrack"
            navigator.mediaSession.setActionHandler("nexttrack", function() {
                console.log("Media Key trigger");
                player.ontimeupdate = null;
                nextSong(currentIndex);
            });

            // Get rid of the "automatic video pause" function
            if (window.location.pathname.match(/^\/watch$/i)) {
                player.onpause = function() {
                    var btns = document.querySelectorAll('a.yt-simple-endpoint.style-scope.yt-button-renderer');
                    while (btns.length > 0) {
                        player.play();
                        btns.forEach(btn => {
                            btn.click();
                            btn.outerHTML = "";
                            // console.log("Keep Playing~");
                        });
                        btns = document.querySelectorAll('a.yt-simple-endpoint.style-scope.yt-button-renderer');
                    }
                }
            }

            if (shuffle) {
                if (shuffleList[0] != currentIndex) {
                    shuffleList.unshift(currentIndex);
                    // console.log(`Unshift back ${i}`);
                }
                GM_setValue('shuffleList', shuffleList);
                // console.log(shuffleList);
            }

            // console.log("Make UI");
            makePlaylistUI(currentIndex);

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
                    hideUI();
                }
            }
        } else {
            console.log("Clear end parameter function");
            player.ontimeupdate = null;
            hideUI();
        }
    }

    function checkList() {
        urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('end')) {
            //Check myPlaylist
            //myPlaylist is declared in @require

            var flag = false;
            if (window.location.pathname.match(/^\/watch$/i)) {
                // Youtube
                for (var i = 0; i < myPlaylist.length; i++) {
                    if (myPlaylist[i][0] == urlParams.get('v') &&
                        myPlaylist[i][1] == urlParams.get('t') &&
                        myPlaylist[i][2] == urlParams.get('end')) {
                        flag = true;
                        break;
                    }
                }
            } else {
                // Google Drive iframe
                for (var i = 0; i < myPlaylist.length; i++) {
                    if (document.location.href.includes(myPlaylist[i][0]) &&
                        (myPlaylist[i][1] == urlParams.get('t') || myPlaylist[i][1] == urlParams.get('start')) &&
                        myPlaylist[i][2] == urlParams.get('end')) {
                        flag = true;
                        break;
                    }
                }
            }
            if (flag) {
                console.log("Playing on Playlist No." + i);
                return i;
            }
        }
        return -1;
    }

    var plBox = document.createElement("div");
    document.body.appendChild(plBox);

    function makePlaylistUI(currentIndex) {
        plBox.style.display = "block";
        plBox.innerHTML = "";
        var plTitle = document.createElement("h2");
        plTitle.innerHTML = "截選播放佇列";
        plBox.appendChild(plTitle);
        var plContent = document.createElement("ul");
        plBox.appendChild(plContent);

        var pl = [];
        if (shuffle) {
            pl = shuffleList;
        } else {
            for (var i = currentIndex; i < myPlaylist.length; ++i)
                pl[i - currentIndex] = i;
        }

        var liTemplate = document.createElement("li");
        liTemplate.style.color = "white";
        liTemplate.style.fontSize = "2em";
        liTemplate.style.margin = "12px";
        liTemplate.style.marginLeft = "36px";
        liTemplate.style.listStyleType = "disclosure-closed"; // Not function in chrome

        pl.forEach(function(plElement, plIndex) {
            var li = liTemplate.cloneNode();
            // 顯示歌曲文字
            if (myPlaylist[plElement].length >= 4) {
                li.innerHTML = myPlaylist[plElement][3];
            } else {
                // Fallback
                li.innerHTML = `${myPlaylist[plElement][0]}: ${myPlaylist[plElement][1]}`;
            }

            // Onclick
            li.addEventListener("click", function() {
                player.ontimeupdate = null;
                if (shuffle) {
                    // console.log(`Splice on ${plIndex}`);
                    var tmp = pl.splice(plIndex, 1);
                    // console.log(`Spliced ${tmp}`);

                    // console.log(`Save shuffleList:`);
                    // console.log(pl);
                    GM_setValue('shuffleList', pl);
                }
                console.log(`Next Song ${plElement} by UI click`);
                nextSong(plElement, true);
            }, false);
            plContent.appendChild(li);
        });

        plContent.firstChild.style.fontSize = "2.5em";
        plContent.firstChild.style.fontWeight = "bold";
        plContent.firstChild.style.textAlign = "center";
        plContent.firstChild.style.listStyleType = "none";
        plContent.firstChild.style.borderBottom = ".1em #AAA solid";
        plContent.firstChild.style.overflow = "hidden";
        plContent.firstChild.style.textOverflow = "ellipsis";
        plContent.firstChild.style.whiteSpace = "nowrap";

        var width = 450;

        //讓box+目錄標籤的寬度，永遠不大於螢幕寬的0.8倍
        if (screen.width * 0.8 - 40 < width) {
            width = screen.width * 0.8 - 40;
        }

        //位置和Style初始化
        plBox.style.position = "fixed";
        plBox.style.right = `-${width}px`;
        plBox.style.zIndex = "2000";
        plBox.style.background = "#222222DD";
        plBox.style.transition = "all 1s";
        plBox.style.cursor = 'pointer';
        plBox.style.width = `${width}px`;
        plBox.style.bottom = "0";
        plBox.style.overflowY = "scroll";
        plBox.style.height = "calc(100vh - 56px)"
        plBox.style.fontFamily = "Meiryo";

        plTitle.style.position = "fixed";
        plTitle.style.right = "16px";
        plTitle.style.bottom = "0px";
        plTitle.style.background = "#222222DD";
        plTitle.style.padding = '8px';
        plTitle.style.transition = "all 1s";
        plTitle.style.writingMode = 'vertical-lr';
        plTitle.style.color = "lightgray";
        plTitle.style.fontWeight = "unset";
        plTitle.style.fontSize = "18px";
        plTitle.style.borderRadius = "10px 0 0 0";
        plTitle.style.margin = "0px";

        //開閉清單
        var isOpen = GM_getValue('isOpen', false);

        function toggleDisplay(open) {
            if (open) {
                //開啟清單
                plBox.style.right = "0px";
                plTitle.style.right = `${width}px`;
            } else {
                //關閉清單
                plBox.style.right = `-${width}px`;
                plTitle.style.right = "0px";
            }
            isOpen = open;
            GM_setValue('isOpen', isOpen);
        }
        toggleDisplay(isOpen);

        //滑鼠事件
        // 滑鼠hover開閉UI
        /*  plBox.addEventListener("mouseover", function() {
                toggleDisplay(true);
            }, false);
            plBox.addEventListener("mouseout", function() {
                toggleDisplay(false);
            }, false);
        */

        // 點擊開閉UI
        plTitle.addEventListener("click", function() {
            toggleDisplay(!isOpen);
        }, false);
    }

    function hideUI() {
        plBox.style.display = "none";
    }

    function nextSong(index, passNext = false) {
        // Out iframe
        if (window.location.pathname == "/embed/") {
            parent.postMessage("child frame", "*");
            return;
        }

        if (!passNext) {
            if (shuffle) {
                shuffleList.shift();
                if (shuffleList.length == 0) shuffleList = makeShufflelist(myPlaylist.length);
                GM_setValue('shuffleList', shuffleList);
                index = shuffleList[0];
            } else {
                index = index + 1;
                index %= myPlaylist.length;
            }
            console.log(`Next Song ${index} by song end`);
        }

        var nextSong = myPlaylist[index];
        urlParams.set("t", nextSong[1]);
        urlParams.set("end", nextSong[2]);

        if (nextSong[0].length > 20) {
            urlParams.delete("v");
            // Google Drive
            document.location.href = `https://drive.google.com/file/d/${nextSong[0]}/view?${urlParams.toString()}`;
        } else {
            // Youtube
            urlParams.set("v", nextSong[0]);
            document.location.href = `https://www.youtube.com/watch?${urlParams.toString()}`;
        }
    }
})();