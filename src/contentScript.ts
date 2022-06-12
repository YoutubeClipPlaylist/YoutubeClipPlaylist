import { Message } from './Models/Message';
import * as UrlHelper from './UrlHelper';
import { urlParams, url } from './UrlHelper';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const videojs: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const ASS: any;

(async function () {
    // let urlParams: URLSearchParams;
    let player: HTMLVideoElement;
    let plBox: HTMLDivElement;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ass: any, observer: MutationObserver, assContainer: HTMLDivElement;

    if (window.location.pathname == "/live_chat_replay") return;

    function elementReady(selector: string): Promise<Element> {
        return new Promise((resolve, reject) => {
            const el = document.querySelector(selector);
            if (el) {
                resolve(el);
                return;
            }
            new MutationObserver((mutationRecords, observer) => {
                // Query for elements matching the specified selector
                Array.from(document.querySelectorAll(selector)).forEach((element) => {
                    resolve(element);
                    //Once we have resolved we don't need the observer anymore.
                    observer.disconnect();
                });
            })
                .observe(document.documentElement, {
                    childList: true,
                    subtree: true
                });
        });
    }

    async function WaitForDOMLoaded(): Promise<HTMLVideoElement|undefined> {
        if (window.location.host === 'www.youtube.com'
            && window.location.pathname === '/') {
            return Promise.resolve(undefined);
        }

        // Google Drive files in iframe
        if (window.location.pathname.match(/^\/file\/d\/.*\/view$/i)) {
            const iframe = await elementReady('#drive-viewer-video-player-object-0') as HTMLIFrameElement;
            // Forcibly display the thumbnail video
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            (iframe.parentNode!.parentNode!.childNodes[1]! as HTMLImageElement).style.visibility = 'hidden';
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            (iframe.parentNode!.parentNode!.childNodes[2]! as HTMLImageElement).style.visibility = 'unset';
            const box = iframe.parentNode?.parentElement;
            if (box) {
                box.style.width = '100%';
                box.style.height = '100%';
                box.style.border = '0px';
                box.style.top = 'unset';
                box.style.left = 'unset';
            }

            // Map the params into iframe
            const iframeURL = new URL(iframe.src);
            const iframeUrlParams = iframeURL.searchParams;
            iframeUrlParams.set('autoplay', '1');
            urlParams.forEach(function (value, key) {
                iframeUrlParams.set(key, value);
            });
            iframe.src = iframeURL.toString();

            // // NextSong after play end
            // window.addEventListener('message', async function (event) {
            //     if ('song end' == event.data) {
            //         NextSong(await CheckList() + 1, false);
            //     } else {
            //         // Next on UI click
            //         if (Number.isInteger(event.data)) {
            //             NextSong(event.data, true);
            //         }
            //     }
            // });
            return Promise.resolve(undefined);
            // ==> And then this script will triggered inside iframe.
        }

        // Skip the song if it is on Google Drive and play in the background.
        if ('/embed/' == window.location.pathname && 'hidden' == document.visibilityState) {
            return Promise.reject();
        }

        // Wait until the player is ready.
        player = await elementReady('video') as HTMLVideoElement;
        return new Promise((resolve, reject) => {
            const checkPlayerReadyState = setInterval(() => {
                // player.pause();
                if (player.readyState === 1
                    || player.readyState === 4) {
                    clearInterval(checkPlayerReadyState);
                    resolve(player);
                }
            }, 100);
        });
    }

    function NextSong(index: number, UIClick = false): void {
        chrome.runtime.sendMessage(new Message('NextSongToBackground', { 'index': index, 'UIClick': UIClick }));
    }

    async function CheckList(): Promise<number> {
        return chrome.runtime.sendMessage(new Message('CheckList', {}));
    }

    function StepShuffle(): void {
        chrome.runtime.sendMessage(new Message('StepShuffle', {}));
    }

    // async function ChangeTwitcastingArchiveVideoThroughHash() {
    //     let videoNum = parseInt(location.hash.replace('#', ''));

    //     if (isNaN(videoNum) || videoNum <= 0) {
    //         return Promise.resolve();
    //     }

    //     let twitcastingChangeVideoInterval = setInterval(function () {
    //         let videoList = document.getElementsByClassName('vjs-playlist-item');
    //         if (videoList.length > 0) {
    //             clearInterval(twitcastingChangeVideoInterval);
    //             if (videoList.length >= videoNum) {
    //                 videoList[videoNum - 1].click();
    //                 // WaitDOM after changed video
    //                 return Promise.resolve();
    //             }
    //         }
    //     }, 500);
    // }

    async function SetTheStartTimeManually() {
        // - Youtube skipped it when t == 0, and start from last history.
        // - Onedrive always go to 0.
        if (urlParams.has('t')) {
            // Onedrive use videojs, and it cannot set currentTime directly on the element.
            if (typeof videojs === 'function') {
                const vjsPlayers = videojs.getPlayers();
                const vjsPlayer = vjsPlayers[Object.keys(vjsPlayers)[0]];
                vjsPlayer.currentTime(~~(urlParams.get('t') ?? 0));
                await vjsPlayer.play();
            } else {
                player.currentTime = ~~(urlParams.get('t') ?? 0);
                await player.play();
            }
        }
    }

    // // Get rid of the Youtube "automatic video pause" function
    // function DisableAutoVideoPause() {
    //     if (window.location.pathname.match(/^\/watch$/i)) {
    //         player!.onpause = function () {
    //             let btns: NodeListOf<HTMLButtonElement> = document.querySelectorAll('a.yt-simple-endpoint.style-scope.yt-button-renderer');
    //             while (btns.length > 0) {
    //                 player!.play();
    //                 btns.forEach((btn) => {
    //                     btn.click();
    //                     btn.outerHTML = '';
    //                     console.log("Skip Video Pause!");
    //                 });
    //                 btns = document.querySelectorAll('a.yt-simple-endpoint.style-scope.yt-button-renderer');
    //             }
    //         };
    //     }
    // }

    async function DoOnVideoChange(loadedmetadata: unknown = undefined) {
        //Stop the player when the end time is up.
        function CheckTimeUp() {
            // Handle Keyboard Media Key "NextTrack"
            function HandleMediaKey() {
                if (currentIndex >= 0) {
                    navigator.mediaSession.setActionHandler('nexttrack', function () {
                        console.debug('Media Key trigger');
                        player.ontimeupdate = null;

                        if (shuffle) {
                            StepShuffle();
                        } else {
                            NextSong(currentIndex + 1);
                        }
                    });
                }
            }

            HandleMediaKey();

            //console.debug(player.currentTime);
            let timeUp: boolean = player.currentTime > ~~(urlParams.get('end') ?? 0);
            if ('0' == urlParams.get('end'))
                timeUp = false;
            if (player.ended)
                timeUp = true;

            if (timeUp) {
                player.pause();
                player.ontimeupdate = null;
                console.log('Pause player at ' + player.currentTime);

                if (currentIndex < 0) { return; }

                if (shuffle) {
                    StepShuffle();
                } else {
                    NextSong(currentIndex + 1);
                }
            }

            //Clear ontimeupdate when it is detected that the current time is less than the start time.
            if (player.currentTime < ~~(urlParams.get('t')??0)) {
                CleanUp();
                console.log('It is detected that the current time is less than the start time.');
            }
        }

        function HideUI() {
            if ('undefined' !== typeof plBox) {
                plBox.style.display = 'none';
            }
        }

        function DestroySubtitle() {
            // Clean ass sub
            if ('undefined' !== typeof ass) {
                ass.destroy();
                observer.disconnect();
                if (assContainer)
                    assContainer.remove();
            }
            // Clean webvtt sub
            let first = player.firstElementChild;
            while ('undefined' !== typeof first && first) {
                first.remove();
                first = player.firstElementChild;
            }
        }

        function CleanUp() {
            console.log('Clean up!');
            player.ontimeupdate = null;
            UrlHelper.prepareUrlParams(window.location.href);
            DestroySubtitle();
            HideUI();
        }

        // Add custom subtitle
        async function MakeSubtitle() {
            DestroySubtitle();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const nowPlaying: any[] = await chrome.runtime.sendMessage(new Message('GetNowPlaying', {}));
            if (nowPlaying.length >= 4 && nowPlaying[4]) {
                // player.setAttribute("crossorigin", "");
                fetch(nowPlaying[4])
                    .then((response) => response.text())
                    .then((text) => {
                        if (text.startsWith('WEBVTT')) {
                            // webvtt
                            const blob = new Blob([text], {
                                type: 'text/vtt',
                            });
                            const track = document.createElement('track');
                            track.src = URL.createObjectURL(blob);
                            track.label = 'Traditional Chinese';
                            track.kind = 'subtitles';
                            track.srclang = 'zh';
                            track.default = true;

                            player.appendChild(track);
                        } else if (text.startsWith('[Script Info]')) {
                            // ass
                            assContainer = document.createElement('div');
                            player.parentNode?.appendChild(assContainer);
                            ass = new ASS(text, player, {
                                container: assContainer
                            });

                            // For player resize
                            assContainer.style.position = 'absolute';
                            assContainer.style.top = '0';
                            assContainer.style.left = player.style.left;

                            observer = new MutationObserver(function (mutations) {
                                mutations.forEach( ()=> {
                                    ass.resize();
                                    assContainer.style.left = player.style.left;
                                });
                            });

                            observer.observe(player, {
                                attributes: true,
                                attributeFilter: ['style'],
                                subtree: false
                            });
                        }
                    });
            }
        }

        async function MakePlaylistUI(currentIndex: number) {
            if ('undefined' === typeof plBox) {
                plBox = document.body.appendChild(document.createElement('div'));
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const myPlaylist: any[][] = (await chrome.storage.local.get('myPlaylist')).myPlaylist;

            // Make Playlist
            let pl: number[] = [];
            if (shuffle) {
                pl = (await chrome.storage.local.get('shuffleList')).shuffleList;
            } else {
                const list = [];
                for (let i = 0; i < myPlaylist.length; i++)
                    list[i] = i;

                if (0 == currentIndex) {
                    pl = list;
                } else {
                    pl = list.slice(currentIndex).concat(list.slice(0, currentIndex));
                }
            }

            // Init Playlist Box
            plBox.style.display = 'block';
            plBox.innerHTML = '';
            const plTitle = document.createElement('h2');
            plTitle.innerHTML = '截選播放清單';
            plBox.appendChild(plTitle);
            const plContent = document.createElement('ul');
            plBox.appendChild(plContent);
            plContent.style.padding = '0';
            plContent.style.margin = '0';
            plContent.style.border = '0';
            plContent.style.background = 'transparent';

            // Make li template
            const liTemplate = document.createElement('li');
            liTemplate.style.color = 'white';
            liTemplate.style.fontSize = '20px';
            liTemplate.style.margin = '12px';
            liTemplate.style.marginLeft = '36px';
            liTemplate.style.listStyleType = 'disclosure-closed'; // Not function in chrome

            // Make list
            pl.forEach(function (plElement, plIndex) {
                const li = liTemplate.cloneNode() as HTMLLIElement;
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
                    function () {
                        player.ontimeupdate = null;
                        if (shuffle) {
                            chrome.storage.local.set({ 'shuffleList': pl });
                        }
                        NextSong(plElement, true);
                    },
                    false
                );
                plContent.appendChild(li);
            });

            // Styling Now-Playing li
            if (plContent.hasChildNodes()) {
                const li = plContent.firstChild as HTMLLIElement;
                li.style.fontSize = '25px';
                li.style.fontWeight = 'bold';
                li.style.textAlign = 'center';
                li.style.listStyleType = 'none';
                li.style.borderBottom = '.1em #AAA solid';
                li.style.overflow = 'hidden';
                li.style.textOverflow = 'ellipsis';
                li.style.whiteSpace = 'nowrap';
            }

            // 讓box+目錄標籤的寬度，永遠不大於螢幕寬的0.8倍
            let width = 450;
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
            plTitle.style.color = 'lightgrey';
            plTitle.style.fontWeight = 'unset';
            plTitle.style.fontSize = '18px';
            plTitle.style.borderRadius = '10px 0 0 0';
            plTitle.style.margin = '0px';

            //開閉清單
            let isOpen = (await chrome.storage.local.get('isOpen')).isOpen ?? false;

            function toggleDisplay(open: boolean) {
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
                chrome.storage.local.set({ 'isOpen': isOpen });
            }
            toggleDisplay(isOpen);

            // 滑鼠點擊開閉UI
            plTitle.addEventListener(
                'click',
                function () {
                    toggleDisplay(!isOpen);
                },
                false
            );
        }

        const shuffle: boolean = (await chrome.storage.local.get('shuffle')).shuffle;

        player.ontimeupdate = CheckTimeUp;

        const currentIndex = await CheckList();
        console.log('Playing on Playlist No.%d', currentIndex);

        if (currentIndex >= 0) {
            // DisableAutoVideoPause();

            MakePlaylistUI(currentIndex);

            MakeSubtitle();
        } else {
            const firstRun = 'undefined' === typeof loadedmetadata;
            if (!firstRun) {
                // Not playing in the playlist
                CleanUp();
            }
        }
    }

    function ChangeTwitcastingCSSToPlayingStyle() {
        if ('twitcasting.tv' == window.location.hostname) {
            const vjsPlayer = document.getElementById('player');
            if (vjsPlayer) {
                vjsPlayer.classList.remove('vjs-paused');
                vjsPlayer.classList.add('vjs-playing');
                vjsPlayer.classList.add('vjs-has-started');
            }
        }
    }

    // if ('twitcasting.tv' == window.location.hostname) {
    //     // Change twitcasting archive video through hash
    //     await ChangeTwitcastingArchiveVideoThroughHash();
    // }

    await UrlHelper.prepareUrlParams(window.location.href);

    /* 
    * State 0: init
    * State 1: DOM loaded
    * State 2: DOM loaded, but should skip to next song
    */
    let state = 0;
    if (UrlHelper.HasMonitoredParameters()) {
        await WaitForDOMLoaded()
            .then(() => {
                state = 1;
            }, () => {
                state = 2;
            });
        await chrome.runtime.sendMessage(new Message('LoadPlaylists', url));
    } else {
        return;
    }

    if (state === 1) {
        // first start
        if (urlParams.has('startplaylist')) {
            const shuffle = (await chrome.storage.local.get('shuffle')).shuffle as boolean;
            if (shuffle) {
                NextSong((await chrome.storage.local.get('shuffleList')).shuffleList[0]);
            } else {
                NextSong(0);
            }
            return;
        }
    }

    if (state === 2) {
        NextSong(await CheckList() + 1);
    } else {
        // Change twitcasting CSS to playing style
        ChangeTwitcastingCSSToPlayingStyle();

        await SetTheStartTimeManually();

        await DoOnVideoChange();

        // For situations where the webpage does not reload, such as clicking a link on YouTube.
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        player!.onloadedmetadata = DoOnVideoChange;
    }

})();