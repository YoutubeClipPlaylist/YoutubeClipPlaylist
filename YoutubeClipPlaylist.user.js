// ==UserScript==
// @name         Youtube Clip Playlist
// @updateURL    https://github.com/jim60105/YoutubeClipPlaylist/raw/master/YoutubeClipPlaylist.user.js
// @downloadURL  https://github.com/jim60105/YoutubeClipPlaylist/raw/master/YoutubeClipPlaylist.user.js
// @version      10
// @author       琳(jim60105)
// @homepage     https://blog.maki0419.com/2020/12/userscript-youtube-clip-playlist.html
// @run-at       document-start
// @grant        GM_addElement
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceText
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @connect      github.com
// @connect      gitlab.com
// @connect      githubusercontent.com
// @include      https://www.youtube.com/*
// @include      https://drive.google.com/file/*
// @include      https://youtube.googleapis.com/*
// @include      /^https:\/\/[\w\-]*my\.sharepoint\.com\/.*$/
// @include      https://onedrive.live.com/*
// @resource     ass https://github.com/jim60105/ASS/raw/master/dist/ass.min.js
// @resource     playlist https://github.com/jim60105/Playlists/raw/dev/Onedrive/Playlists.jsonc
// ==/UserScript==

/**
 * 版本更新提要:
 * v9
 * 1. 增加「右上角選單列」，可以在此切換隨機/不隨機模式
 * 2. 增加「禁用歌單」功能，可在選單列啟用/禁用
 * 3. 隨機模式，在歌曲播完後將之插入到歌單尾 (原來會直接移除)
 * 4. 增加「StartPlaylist」選單按鈕
 * 5. Exclude、Include功能，增加可以以「_」底線分隔來同時傳入多個標籤
 * 
 * v8
 * 1. 修改歌單載入模式: 不再全下載後判斷，而是先下載歌單名稱和標籤，判斷後只載需要的檔案
 * 2. 修正在Youtube中「並非歌單播放模式時」也會下載歌單的問題
 * 
 * v7
 * 1. 更改本repo名稱為YoutubeClipPlaylist
 * 2. 更改default branch為master
 * 3. 專案架構調整
 * 4. 更改歌單repo名稱為Playlists，歌單做minify
 * 5. 字幕支援: webvtt、ass
 * 6. 增加Playlist: '伊冬ユナ' '羽宮くぅ'
 */

// Main
(function() {
    'use strict';
    if (window.location.pathname == "/live_chat_replay") return;

    var myPlaylist = [];

    var urlParams = new URLSearchParams(window.location.search);

    if (!urlParams.has('end') && !urlParams.has('startplaylist')) {
        addStartMenu();
        return;
    }

    function addStartMenu() {
        GM_registerMenuCommand('️🔛Start Playlist', () => {
            urlParams.append('startplaylist', 1);
            console.debug(urlParams.toString());
            document.location.href = 'https://www.youtube.com/?startplaylist'
        }, 'p')
    }

    var DisabledPlaylists = GM_getValue('disabledLists', []);
    var MenuLists = {};

    // Set shuffle
    var shuffle = urlParams.has('shuffle') && urlParams.get('shuffle') != 0;
    console.log('Shuffle: %o', shuffle);
    var shuffleList = GM_getValue('shuffleList', []);

    addShuffleMenu();

    function addShuffleMenu() {
        if (shuffle) {
            console.debug('Shuffle List: %o', shuffleList);
            MenuLists.shuffle = {
                menuID: GM_registerMenuCommand('🔀Shuffle', toggleShuffle, 's')
            }
        } else {
            MenuLists.shuffle = {
                menuID: GM_registerMenuCommand('🔃Playing', toggleShuffle, 's')
            }
        }
    }

    function toggleShuffle() {
        if (shuffle) {
            urlParams.delete('shuffle');
        } else {
            urlParams.append('shuffle', 1);
        }
        GM_unregisterMenuCommand(MenuLists.shuffle.menuID);
        shuffle ^= true;
        addShuffleMenu();
        NextSong(-1);
    }

    var Playlists = JSON.parse(GM_getResourceText('playlist'));
    var LoadedCount = 0;
    var player;
    var interval;
    var plBox;

    LoadPlaylists();

    function LoadPlaylists(callback) {
        LoadedCount = 0;
        Playlists.forEach((playlist) => {
            CheckAndLoadPlaylist(playlist.name, playlist.tag, playlist.route);
        });

        //Wait for DOM
        interval = setInterval(function() {
            if (Playlists.length <= LoadedCount) {
                //start playlist
                if (urlParams.has('startplaylist') || shuffleList.length > myPlaylist.length) {
                    clearInterval(interval);
                    urlParams.delete('startplaylist');

                    shuffleList = [0];

                    GM_setValue('shuffleList', shuffleList);
                    NextSong(-1);
                    return;
                }

                MakePlaylistUIContainer();

                WaitForDOMLoad();
                (callback && typeof(callback) === "function") && callback();
            }
        }, 500);

        function CheckAndLoadPlaylist(listName, tags, route) {
            var flag = false;

            var include = urlParams.has('playlistinclude') ? urlParams.get('playlistinclude').toString().toLowerCase() : '';
            if ('' != include) {
                var includes = include.split('_');
                for (var i in tags) {
                    if (includes.includes(tags[i].toLowerCase())) {
                        flag = true;
                        break;
                    }
                }
            } else {
                flag = true;
            }

            var exclude = urlParams.has('playlistexclude') ? urlParams.get('playlistexclude').toString().toLowerCase() : '';
            if ('' != exclude) {
                var excludes = exclude.split('_');
                for (var j in tags) {
                    if (excludes.includes(tags[j].toLowerCase())) {
                        flag = false;
                        console.log(`Exclude ${listName} with tag: ${tags[j]}`);
                        break;
                    }
                }
            }

            if (flag) {
                if (DisabledPlaylists.includes(listName)) {
                    MenuLists[listName] = {
                        menuID: addDisabledMenuList(listName)
                    };
                    console.warn(`Disabled ${listName}. Please click the menu to enable it again.`);
                    LoadedCount++;
                } else {
                    var baseURL = 'https://raw.githubusercontent.com/jim60105/Playlists/dev/Onedrive/';
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: baseURL + route,
                        responseType: 'json',
                        onload: (response) => {
                            if (response.status != 200) {
                                console.error('Load playlist %s failed: %s', listName, response.url);
                            } else {
                                MenuLists[listName] = {
                                    menuID: addEnabledMenuList(listName)
                                };
                                myPlaylist = myPlaylist.concat(response.response);
                                console.log('Load %s: %o', listName, response.response);
                            }
                            LoadedCount++;
                        },
                    });
                }
            } else {
                // GM_registerMenuCommand(`Not Loaded: ${listName}`);
                LoadedCount++;
            }

            function addEnabledMenuList(listName) {
                return GM_registerMenuCommand(
                    `✅ ${listName}`,
                    () => {
                        // Disable list on click
                        if (!confirm(`Are you sure you want to disable ${listName}?`)) { return; }

                        // Add listname to DisabledPlaylists
                        DisabledPlaylists.push(listName);
                        GM_setValue('disabledLists', DisabledPlaylists);

                        // Reregister menu
                        GM_unregisterMenuCommand(MenuLists[listName].menuID);
                        MenuLists[listName].menuID = addDisabledMenuList(listName);
                        console.log(`Disabled: ${listName}`);
                        reloadPage();
                    }
                )
            }

            function addDisabledMenuList(listName) {
                return GM_registerMenuCommand(
                    `🚫 ${listName}`,
                    () => {
                        // Enable list on click
                        // Remove listname to DisabledPlaylists
                        let i = DisabledPlaylists.indexOf(listName);
                        while (i >= 0) {
                            DisabledPlaylists.splice(i, 1);
                            i = DisabledPlaylists.indexOf(listName);
                        }

                        GM_setValue('disabledLists', DisabledPlaylists);

                        // Reregister menu
                        GM_unregisterMenuCommand(MenuLists[listName].menuID);
                        MenuLists[listName].menuID = addEnabledMenuList(listName);
                        console.log(`Enabled: ${listName}`);
                        reloadPage();
                    }
                )
            }

            function reloadPage() {
                myPlaylist = [];
                shuffleList = [];
                GM_setValue('shuffleList', []);
                LoadPlaylists(() => { NextSong(-1) });
            }
        }

        function MakePlaylistUIContainer() {
            if ('undefined' === typeof plBox) {
                plBox = GM_addElement(document.body, 'div', {});
            }
        }
    }

    function WaitForDOMLoad() {
        if (window.location.pathname.match(/^\/file\/d\/.*\/view$/i)) {
            // Google Drive files
            var iframe = document.getElementById('drive-viewer-video-player-object-0');
            if (iframe && 'IFRAME' == iframe.tagName) {
                clearInterval(interval);

                // Display the thumb video forcely
                iframe.parentNode.parentNode.childNodes[1].style.visibility = 'hidden';
                iframe.parentNode.parentNode.childNodes[2].style.visibility = 'unset';
                var box = iframe.parentNode.parentElement;
                box.style.width = '100%';
                box.style.height = '100%';
                box.style.border = '0px';
                box.style.top = 'unset';
                box.style.left = 'unset';

                // Map the params into iframe
                var iframeURL = new URL(iframe.src);
                var iframeUrlParams = iframeURL.searchParams;
                iframeUrlParams.set('autoplay', 1);
                urlParams.forEach(function(value, key) {
                    iframeUrlParams.set(key, value);
                });
                iframe.src = iframeURL.toString();

                // NextSong after play end
                window.addEventListener('message', function(event) {
                    if ('song end' == event.data) {
                        NextSong(CheckList());
                    } else {
                        // Next on UI click
                        if (Number.isInteger(event.data)) {
                            NextSong(event.data, true);
                        }
                    }
                });
                // ==> And then this script will triggered inside iframe.
            }
        } else {
            // Skip the song if it is on Google Drive and play in the background.
            if ('/embed/' == window.location.pathname && 'hidden' == document.visibilityState) {
                clearInterval(interval);
                NextSong(CheckList());
            }

            player = document.getElementsByTagName('video')[0];
            if ('undefined' !== typeof player &&
                'undefined' !== typeof plBox) {
                clearInterval(interval);
                eval(GM_getResourceText('ass'));
                player.play().then(() => {
                    // Set the start time manually here to prevent YouTube from skipping it when t == 0.
                    if (urlParams.has('t') && urlParams.get('t') == 0 && player.currentTime > 2) {
                        player.currentTime = urlParams.get('t');
                    }

                    DoOnVideoChange();

                    // For situations where the webpage does not reload, such as clicking a link on YouTube.
                    player.onloadedmetadata = DoOnVideoChange;
                });
            }
        }
    }

    var ass, observer, assContainer;

    function DoOnVideoChange(loadedmetadata) {
        var init = 'undefined' === typeof loadedmetadata;
        player.ontimeupdate = CheckTimeUp;

        var currentIndex = CheckList(init);
        if (currentIndex >= 0) {
            DisableAutoVideoPause();

            // Always put currentIndex first in the shuffle list
            if (shuffle) {
                if (shuffleList[0] != currentIndex) {
                    shuffleList.unshift(currentIndex);
                    // console.debug(`Unshift back ${currentIndex}`);
                }
                GM_setValue('shuffleList', shuffleList);
            }

            MakePlaylistUIContent(currentIndex);

            MakeSubtitle(currentIndex);
        } else {
            if (!init) {
                CleanUp();
            }
        }

        //Stop the player when the end time is up.
        function CheckTimeUp() {
            // Handle Keyboard Media Key "NextTrack"
            if (currentIndex >= 0)
                navigator.mediaSession.setActionHandler('nexttrack', function() {
                    console.debug('Media Key trigger');
                    player.ontimeupdate = null;
                    NextSong(currentIndex);
                });

            //console.debug(player.currentTime);
            var flag = player.currentTime > urlParams.get('end');
            if (0 == urlParams.get('end')) flag = false;
            if (player.ended) flag = true;

            if (flag) {
                player.pause();
                player.ontimeupdate = null;
                console.log('Pause player at ' + player.currentTime);

                if (currentIndex >= 0) {
                    NextSong(currentIndex);
                }
                return;
            }

            //Clear ontimeupdate when it is detected that the current time is less than the start time.
            if (player.currentTime < urlParams.get('t')) {
                CleanUp();
                console.log('It is detected that the current time is less than the start time.');
            }
        }

        function CleanUp() {
            console.log('Clean up!');
            player.ontimeupdate = null;
            DestroySubtitle();
            HideUI();

            Object.keys(MenuLists).forEach(function(key) {
                GM_unregisterMenuCommand(MenuLists[key].menuID);
                delete MenuLists[key];
            });
            addStartMenu();

            function HideUI() {
                if ('undefined' !== typeof plBox) {
                    plBox.style.display = 'none';
                }
            }
        }

        // Get rid of the Youtube "automatic video pause" function
        function DisableAutoVideoPause() {
            if (window.location.pathname.match(/^\/watch$/i)) {
                player.onpause = function() {
                    var btns = document.querySelectorAll('a.yt-simple-endpoint.style-scope.yt-button-renderer');
                    while (btns.length > 0) {
                        player.play();
                        btns.forEach((btn) => {
                            btn.click();
                            btn.outerHTML = '';
                            console.log("Skip Video Pause!");
                        });
                        btns = document.querySelectorAll('a.yt-simple-endpoint.style-scope.yt-button-renderer');
                    }
                };
            }
        }

        // Add custom subtitle
        function MakeSubtitle(currentIndex) {
            DestroySubtitle();
            if (myPlaylist[currentIndex].length >= 4 && myPlaylist[currentIndex][4]) {
                // player.setAttribute("crossorigin", "");
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: myPlaylist[currentIndex][4],
                    onload: (response) => {
                        if (response.responseText.startsWith('WEBVTT')) {
                            // webvtt
                            var blob = new Blob([response.responseText], {
                                type: 'text/vtt',
                            });
                            var track = document.createElement('track');
                            track.src = URL.createObjectURL(blob);
                            track.label = 'Traditional Chinese';
                            track.kind = 'subtitles';
                            track.srclang = 'zh';
                            track.default = true;

                            player.appendChild(track);
                        } else if (response.responseText.startsWith('[Script Info]')) {
                            // ass
                            assContainer = document.createElement('div');
                            player.parentNode.appendChild(assContainer);
                            ass = new ASS(response.responseText, player, { container: assContainer });

                            // For player resize
                            assContainer.style.position = 'absolute';
                            assContainer.style.top = 0;
                            assContainer.style.left = player.style.left;

                            observer = new MutationObserver(function(mutations) {
                                mutations.forEach(function(mutationRecord) {
                                    ass.resize();
                                    assContainer.style.left = player.style.left;
                                });
                            });

                            observer.observe(player, { attributes: true, attributeFilter: ['style'], subtree: false });
                        }
                    },
                });
            }
        }

        function DestroySubtitle() {
            // Clean ass sub
            if ('undefined' !== typeof ass) {
                ass.destroy();
                observer.disconnect();
                if (assContainer) assContainer.remove();
            }
            // Clean webvtt sub
            var first = player.firstElementChild;
            while ('undefined' !== typeof first && first) {
                first.remove();
                first = player.firstElementChild;
            }
        }

        function MakePlaylistUIContent(currentIndex) {
            if ('undefined' === typeof plBox) {
                console.error("Playlist UI Container in undefined!");
                return;
            }

            // Make Playlist
            var pl = [];
            if (shuffle) {
                pl = shuffleList;
            } else {
                var list = [];
                for (var i = 0; i < myPlaylist.length; i++) list[i] = i;

                if (0 == currentIndex) {
                    pl = list;
                } else {
                    pl = list.slice(currentIndex).concat(list.slice(0, currentIndex));
                }
            }

            // Init Playlist Box
            plBox.style.display = 'block';
            plBox.innerHTML = '';
            var plTitle = document.createElement('h2');
            plTitle.innerHTML = '截選播放清單';
            plBox.appendChild(plTitle);
            var plContent = document.createElement('ul');
            plBox.appendChild(plContent);

            // Make li template
            var liTemplate = document.createElement('li');
            liTemplate.style.color = 'white';
            liTemplate.style.fontSize = '2em';
            liTemplate.style.margin = '12px';
            liTemplate.style.marginLeft = '36px';
            liTemplate.style.listStyleType = 'disclosure-closed'; // Not function in chrome

            // Make list
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
                li.addEventListener(
                    'click',
                    function() {
                        player.ontimeupdate = null;
                        if (shuffle) {
                            GM_setValue('shuffleList', pl);
                        }
                        console.log(`Next Song ${plElement} by UI click`);
                        NextSong(plElement, true);
                    },
                    false
                );
                plContent.appendChild(li);
            });

            // Styling Now-Playing li
            plContent.firstChild.style.fontSize = '2.5em';
            plContent.firstChild.style.fontWeight = 'bold';
            plContent.firstChild.style.textAlign = 'center';
            plContent.firstChild.style.listStyleType = 'none';
            plContent.firstChild.style.borderBottom = '.1em #AAA solid';
            plContent.firstChild.style.overflow = 'hidden';
            plContent.firstChild.style.textOverflow = 'ellipsis';
            plContent.firstChild.style.whiteSpace = 'nowrap';

            // 讓box+目錄標籤的寬度，永遠不大於螢幕寬的0.8倍
            var width = 450;
            if (screen.width * 0.8 - 40 < width) {
                width = screen.width * 0.8 - 40;
            }

            // Styling
            plBox.style.position = 'fixed';
            plBox.style.right = `-${width}px`;
            plBox.style.zIndex = '2000';
            plBox.style.background = '#222222DD';
            plBox.style.transition = 'all 1s';
            plBox.style.cursor = 'pointer';
            plBox.style.width = `${width}px`;
            plBox.style.bottom = '0';
            plBox.style.overflowY = 'scroll';
            plBox.style.height = 'calc(100vh - 56px)';
            plBox.style.fontFamily = 'Meiryo';

            plTitle.style.position = 'fixed';
            plTitle.style.right = '16px';
            plTitle.style.bottom = '0px';
            plTitle.style.background = '#222222DD';
            plTitle.style.padding = '8px';
            plTitle.style.transition = 'all 1s';
            plTitle.style.writingMode = 'vertical-lr';
            plTitle.style.color = 'lightgray';
            plTitle.style.fontWeight = 'unset';
            plTitle.style.fontSize = '18px';
            plTitle.style.borderRadius = '10px 0 0 0';
            plTitle.style.margin = '0px';

            //開閉清單
            var isOpen = GM_getValue('isOpen', false);

            function toggleDisplay(open) {
                if (open) {
                    //開啟清單
                    plBox.style.right = '0px';
                    plTitle.style.right = `${width}px`;
                } else {
                    //關閉清單
                    plBox.style.right = `-${width}px`;
                    plTitle.style.right = '0px';
                }
                isOpen = open;
                GM_setValue('isOpen', isOpen);
            }
            toggleDisplay(isOpen);

            // 滑鼠點擊開閉UI
            plTitle.addEventListener(
                'click',
                function() {
                    toggleDisplay(!isOpen);
                },
                false
            );

            // 滑鼠hover開閉UI
            /*  plBox.addEventListener("mouseover", function() {
                    toggleDisplay(true);
                }, false);
                plBox.addEventListener("mouseout", function() {
                    toggleDisplay(false);
                }, false);
            */
        }
    }

    function CheckList(renewURLParams) {
        if (renewURLParams) {
            var _urlParams = new URLSearchParams(window.location.search);

            _urlParams.forEach(function(value, key) {
                switch (key) {
                    case 't':
                        //Youtube有時會自動在t後面帶上個s(秒)，在這裡把它去掉
                        urlParams.set(key, value.replace('s', ''));
                        break;
                    default:
                        urlParams.set(key, value);
                        break;
                }
            });
        }
        console.debug(urlParams.toString());

        //Check myPlaylist
        //myPlaylist is declared in @require
        var i = -1;
        var flag = false;
        if (window.location.pathname.match(/^\/watch$/i)) {
            // Youtube
            for (i = 0; i < myPlaylist.length; i++) {
                if (myPlaylist[i][0] == urlParams.get('v') && myPlaylist[i][1] == urlParams.get('t') && myPlaylist[i][2] == urlParams.get('end')) {
                    flag = true;
                    break;
                }
            }
        } else {
            // Google Drive iframe
            for (i = 0; i < myPlaylist.length; i++) {
                if (document.location.href.includes(myPlaylist[i][0]) && (myPlaylist[i][1] == urlParams.get('t') || myPlaylist[i][1] == urlParams.get('start')) && myPlaylist[i][2] == urlParams.get('end')) {
                    flag = true;
                    break;
                }
            }
        }
        if (flag) {
            console.log('Playing on Playlist No.%d', i);
        } else {
            console.log('Not playing in the playlist.');
            i = -1;
        }
        return i;
    }

    function MakeShufflelist(length) {
        var shuffleList = [];
        for (var i = 0; i < length; ++i) shuffleList[i] = i;

        // http://stackoverflow.com/questions/962802#962890
        var tmp,
            current,
            top = shuffleList.length;
        if (top)
            while (--top) {
                current = Math.floor(Math.random() * (top + 1));
                tmp = shuffleList[current];
                shuffleList[current] = shuffleList[top];
                shuffleList[top] = tmp;
            }

        console.log('Make new shuffleList');
        return shuffleList;
    }

    function NextSong(index, passNext = false) {
        if (myPlaylist.length == 0) {
            console.error('No playlists!');
            return;
        }

        // Send "next song" outside the iframe
        if ('/embed/' == window.location.pathname) {
            if (!passNext) {
                parent.postMessage('song end', '*');
            } else {
                parent.postMessage(index, '*');
            }
            return;
        }

        if (!passNext) {
            // Step the index
            if (shuffle) {
                var tmpSong = shuffleList.shift();
                if (shuffleList.length > 0) {
                    shuffleList.push(tmpSong);
                }
                if (0 == shuffleList.length) shuffleList = MakeShufflelist(myPlaylist.length);
                GM_setValue('shuffleList', shuffleList);
                index = shuffleList[0];
            } else {
                index++;
                index %= myPlaylist.length;
                index |= 0;
            }
            console.log(`Next Song ${index} by song end`);
        }

        var nextSong = myPlaylist[index];

        urlParams.delete('v');
        urlParams.set('t', nextSong[1]);
        urlParams.set('end', nextSong[2]);

        if (nextSong[0].indexOf('http') >= 0) {
            // URL
            document.location.href = `${nextSong[0]}?${urlParams.toString()}`;
        } else {
            // ID
            if (nextSong[0].length > 20) {
                // Google Drive
                document.location.href = `https://drive.google.com/file/d/${nextSong[0]}/view?${urlParams.toString()}`;
            } else {
                // Youtube
                urlParams.set('v', nextSong[0]);
                document.location.href = `https://www.youtube.com/watch?${urlParams.toString()}`;
            }
        }
    }
})();