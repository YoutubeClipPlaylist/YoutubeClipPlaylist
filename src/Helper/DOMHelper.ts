/* eslint-disable @typescript-eslint/no-unused-vars */
import { Message } from '../Models/Message';
import { urlParams, url } from './URLHelper';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const ASS: any;

let plBox: HTMLDivElement;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ass: any, observer: MutationObserver, assContainer: HTMLDivElement;

export let player: HTMLVideoElement;

export function elementReady(selector: string, tagName?: string): Promise<Element> {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element && tagNameMatch(element, tagName)) {
            resolve(element);
            return;
        }
        new MutationObserver((mutationRecords, observer) => {
            // Query for elements matching the specified selector
            Array.from(document.querySelectorAll(selector)).forEach((_element) => {
                if (tagNameMatch(_element, tagName)) {
                    resolve(_element);
                    //Once we have resolved we don't need the observer anymore.
                    observer.disconnect();
                }
            });
        }).observe(document.documentElement, {
            childList: true,
            subtree: true,
        });
    });

    function tagNameMatch(_element: Element, _tagName?: string): boolean {
        return (
            typeof _tagName === 'undefined' ||
            _element.tagName.toLowerCase() === _tagName.toLowerCase()
        );
    }
}

export async function WaitUntilThePlayerIsReady(): Promise<HTMLVideoElement> {
    // Wait until the player is ready.
    player = (await elementReady('video', 'video')) as HTMLVideoElement;
    return new Promise((resolve, reject) => {
        const waitPlayerInterval = setInterval(() => {
            if (!player.paused) {
                player.pause();
            }
            if (player.readyState === 1 || player.readyState === 4) {
                clearInterval(waitPlayerInterval);
                resolve(player);
            }
        }, 100);
    });
}

export function HideUI() {
    if ('undefined' !== typeof plBox) {
        plBox.style.display = 'none';
    }
}

export function DestroySubtitle() {
    // Clean ass sub
    if ('undefined' !== typeof ass) {
        ass.destroy();
        observer.disconnect();
        if (assContainer) assContainer.remove();
    }
    // Clean webvtt sub
    let first = player.firstElementChild;
    while ('undefined' !== typeof first && first) {
        first.remove();
        first = player.firstElementChild;
    }
}

// Add custom subtitle
export async function MakeSubtitle() {
    DestroySubtitle();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nowPlaying: any[] = await chrome.runtime.sendMessage(new Message('GetNowPlaying'));
    if (nowPlaying.length >= 4 && nowPlaying[4]) {
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
                        container: assContainer,
                    });

                    // For player resize
                    assContainer.style.position = 'absolute';
                    assContainer.style.top = '0';
                    assContainer.style.left = player.style.left;

                    observer = new MutationObserver(function (mutations) {
                        mutations.forEach(() => {
                            ass.resize();
                            assContainer.style.left = player.style.left;
                        });
                    });

                    observer.observe(player, {
                        attributes: true,
                        attributeFilter: ['style'],
                        subtree: false,
                    });
                }
            });
    }
}

export async function MakePlaylistUI(currentIndex: number) {
    const shuffle = urlParams.has('shuffle') && urlParams.get('shuffle') !== '0';
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
        for (let i = 0; i < myPlaylist.length; i++) list[i] = i;

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
    plTitle.innerHTML = chrome.i18n.getMessage('plTitle');
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
                    chrome.storage.local.set({ shuffleList: pl });
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
    plTitle.style.right = '0px';
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
    plTitle.style.borderTop = '1px solid gray';
    plTitle.style.borderLeft = '1px solid gray';

    // 開閉清單
    // 預設以關閉清單的狀態初始化Style，然後一秒後觸發打開動作
    let isOpen = (await chrome.storage.local.get({ isOpen: true })).isOpen as boolean;
    setTimeout(() => {
        toggleDisplay(isOpen);
    }, 1000);

    function toggleDisplay(open: boolean) {
        if (open) {
            // 開啟清單
            plBox.style.right = '0px';
            plTitle.style.right = `${width}px`;
        } else {
            // 關閉清單
            plBox.style.right = `-${width}px`;
            plTitle.style.right = '0px';
        }
        isOpen = open;
        chrome.storage.local.set({ isOpen: isOpen });
    }

    // 滑鼠點擊開閉UI
    plTitle.addEventListener(
        'click',
        function () {
            toggleDisplay(!isOpen);
        },
        false
    );
}

// export async function ChangeTwitcastingArchiveVideoThroughHash() {
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

export function ChangeTwitcastingCSSToPlayingStyle() {
    if ('twitcasting.tv' == url.hostname) {
        const vjsPlayer = document.getElementById('player');
        if (vjsPlayer) {
            vjsPlayer.classList.remove('vjs-paused');
            vjsPlayer.classList.add('vjs-playing');
            vjsPlayer.classList.add('vjs-has-started');
        }
    }
}

// // Get rid of the Youtube 'automatic video pause' function
// export function DisableAutoVideoPause() {
//     if (url.pathname.match(/^\/watch$/i)) {
//         player!.onpause = function () {
//             let btns: NodeListOf<HTMLButtonElement> = document.querySelectorAll('a.yt-simple-endpoint.style-scope.yt-button-renderer');
//             while (btns.length > 0) {
//                 player!.play();
//                 btns.forEach((btn) => {
//                     btn.click();
//                     btn.outerHTML = '';
//                     console.log('Skip Video Pause!');
//                 });
//                 btns = document.querySelectorAll('a.yt-simple-endpoint.style-scope.yt-button-renderer');
//             }
//         };
//     }
// }

export async function SetTheStartTimeManually(): Promise<void> {
    // - Youtube skipped it when t == 0, and start from last history.
    // - Onedrive always go to 0.
    if (urlParams.has('t')) {
        // Onedrive sometimes(?) use videojs, and it cannot set currentTime directly on the element.
        if (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            typeof (window as any).videojs === 'function' &&
            (url.hostname.indexOf('sharepoint.com') > 0 ||
                url.hostname.indexOf('onedrive.live.com') > 0)
        ) {
            console.debug('videojs detected!');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const vjsPlayers = (window as any).videojs.getPlayers();
            const vjsPlayer = vjsPlayers[Object.keys(vjsPlayers)[0]];
            vjsPlayer.currentTime(~~(urlParams.get('t') ?? 0));
            await vjsPlayer.play();
        } else {
            player.currentTime = ~~(urlParams.get('t') ?? 0);
            console.debug('Set player.currentTime to %d', player.currentTime);
            try {
                if (player.paused) {
                    await player.play();
                }
            } catch (error: unknown) {
                if (error instanceof DOMException) {
                    // Ignore DOMException
                    // DOMException: The play() request was interrupted by a call to pause(). https://goo.gl/LdLk22
                    console.warn(error);
                }
            }
        }
    }
}

function NextSong(index: number, UIClick = false): void {
    chrome.runtime.sendMessage(
        new Message('NextSongToBackground', { index: index, UIClick: UIClick })
    );
}
