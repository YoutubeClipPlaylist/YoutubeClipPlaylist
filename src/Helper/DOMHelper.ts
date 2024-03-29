/* eslint-disable @typescript-eslint/no-unused-vars */
import { Message } from '../Models/Message';
import { ISong } from '../Models/Song';
import { ILyric } from './../Models/Lyric';
import { GenerateURLFromSong } from './URLHelper';
import { SliceShuffleList } from './PlaylistHelper';
import {
    LoadLyricContent,
    SearchLyricFromSong,
    ParseLyric,
    MakeLyricHelperUI,
    ReadLyricsFromStorage,
} from './LyricHelper';

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
    player = (await elementReady('video', 'video')) as HTMLVideoElement;

    // Wait until the player is ready.
    return new Promise((resolve, reject) => {
        const waitPlayerInterval = setInterval(() => {
            // Click the 'Play' button at twitcasting.tv
            if (window.location.host.indexOf('twitcasting.tv') >= 0) {
                const button = document.getElementsByClassName(
                    'vjs-big-play-button'
                )[0] as HTMLButtonElement;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const vjsPlayer = document.getElementById('player') as any;
                if (vjsPlayer && button) {
                    // Wait for videojs init before we can click the button.
                    setTimeout(() => {
                        if (!vjsPlayer.classList.contains('vjs-playing')) button.click();
                    }, 1000);
                }
            }

            console.debug('Waiting for the player to be ready... ReadyState: ' + player.readyState);
            if (player.readyState === 1 || player.readyState === 4) {
                console.debug('The player is ready.');
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
    document.getElementById('lyricHelper')?.remove();
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
    // Clean lrc sub
    // https://stackoverflow.com/a/15315411/8706033
    for (const key in player.textTracks) {
        if (Object.prototype.hasOwnProperty.call(player.textTracks, key)) {
            const track = player.textTracks[key];
            const cues = track.cues ?? [];
            for (let index = 0; index < cues.length; index++) {
                track.removeCue(cues[index]);
            }
            // https://stackoverflow.com/a/29310267/8706033
            track.mode = 'disabled';
        }
    }
}

// Add custom subtitle
export async function MakeSubtitle(urlString: string, offset: number) {
    DestroySubtitle();
    let lyric: ILyric | undefined;

    const song: ISong = await chrome.runtime.sendMessage(new Message('GetNowPlaying', urlString));

    let lyrics: string, lyricsFromPrefetchProject: string;
    ({ lyrics, lyricsFromPrefetchProject, lyric, offset } = await fetchLyric(song, lyric, offset));
    if (lyrics.startsWith('WEBVTT')) {
        processWebVTT(lyrics, offset);
    } else if (lyrics.startsWith('[Script Info]')) {
        processASS(lyrics, offset);
    } else if (
        ((song.SubSrc as string)?.endsWith('.lrc') || lyricsFromPrefetchProject) &&
        new RegExp(/\[\d{2}:\d{2}.\d{1,5}\]/).test(lyrics)
    ) {
        await processLrc(lyrics, offset, lyric);
    }
}

async function fetchLyric(song: ISong, lyric: ILyric | undefined, offset: number) {
    let lyricsFromPrefetchProject = '',
        lyricsFromSubSrc = '';

    if (song.SubSrc) {
        lyricsFromSubSrc = await fetch(song.SubSrc).then((response) => response.text());
    }

    if (!lyricsFromSubSrc) {
        if (process.env.NODE_ENV !== 'development') {
            await chrome.storage.local.remove(['Lyrics']);
        } else {
            lyric = (await ReadLyricsFromStorage()).find(
                (p) => p.VideoId === song.VideoID && p.StartTime === song.StartTime
            );
        }

        if (!lyric) {
            lyric = await SearchLyricFromSong(song);
        }

        if (lyric && lyric.LyricId > 0) {
            lyricsFromPrefetchProject = await LoadLyricContent(lyric.LyricId);
            offset += lyric.Offset;
        }
    }

    const lyrics = lyricsFromSubSrc || lyricsFromPrefetchProject;
    return { lyrics, lyricsFromPrefetchProject, lyric, offset };
}

function processWebVTT(lyrics: string, offset: number) {
    const track = document.createElement('track');
    const blob = new Blob([lyrics], {
        type: 'text/vtt',
    });
    track.src = URL.createObjectURL(blob);
    track.label = 'Traditional Chinese';
    track.kind = 'subtitles';
    track.srclang = 'zh';
    track.default = true;
    player.appendChild(track);

    // offset
    track.onload = () => {
        const textTrack = player.textTracks[0];
        if (textTrack.cues) {
            for (let index = 0; index < textTrack.cues.length; index++) {
                const cue = textTrack.cues[index];
                cue.startTime += offset;
                cue.endTime += offset;
            }
        }
        track.onload = null;
    };
}

function processASS(lyrics: string, offset: number) {
    assContainer = document.createElement('div');
    player.parentNode?.appendChild(assContainer);
    ass = new ASS(lyrics, player, {
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
    if (offset > 0) {
        console.error('ASS subtitle does not support offset!!!');
    }
}

async function processLrc(lyrics: string, offset: number, lyric: ILyric | undefined) {
    const lrc = ParseLyric(lyrics);

    const track = player.addTextTrack('subtitles', 'Traditional Chinese', 'zh');
    const cues: VTTCue[] = [];
    for (let index = 0; index < lrc.length; index++) {
        const line = lrc[index];

        // Skip empty line
        if (!lrc[1]) continue;

        if (index === lrc.length - 1) {
            // Add five seconds to the last line
            cues.push(new VTTCue(line[0] + offset, line[0] + offset + 5, line[1]));
        } else {
            cues.push(new VTTCue(line[0] + offset, lrc[index + 1][0] + offset, line[1]));
        }
        track.addCue(cues[index]);
    }
    track.mode = 'showing';

    if (typeof lyric !== 'undefined') await MakeLyricHelperUI(lyric, track, cues);
}

export async function MakePlaylistUI(currentIndex: number, shuffle: boolean) {
    document.getElementById('plBox')?.remove();
    await fetch(chrome.runtime.getURL('/contentScript.html'))
        .then((response) => response.text())
        .then((response) => {
            document.body.insertAdjacentHTML('beforeend', response);
        });

    plBox = document.getElementById('plBox') as HTMLDivElement;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const myPlaylist: ISong[] = (await chrome.storage.local.get('myPlaylist')).myPlaylist;

    // Make Playlist
    let pl: number[] = [];
    if (shuffle) {
        pl = await SliceShuffleList(currentIndex);
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
    const plTitle = document.getElementById('plTitle') as HTMLHeadingElement;
    plTitle.innerHTML = chrome.i18n.getMessage('plTitle');
    const plContent = document.getElementById('plContent') as HTMLUListElement;

    // Make li template
    const liTemplate = document.getElementById('plLiTemplate') as HTMLTemplateElement;

    // Make list
    pl.forEach(function (plElement, plIndex) {
        const clone = liTemplate.content.cloneNode(true) as DocumentFragment;
        const li = clone.querySelector('li') as HTMLLIElement;
        // 曲名
        if (myPlaylist[plElement].Title) {
            li.getElementsByClassName('songName')[0].innerHTML = myPlaylist[plElement].Title ?? '';
        } else {
            // Fallback
            li.getElementsByClassName(
                'songName'
            )[0].innerHTML = `${myPlaylist[plElement].VideoID}: ${myPlaylist[plElement].StartTime}`;
        }

        // 歌手
        if (myPlaylist[plElement].Singer) {
            li.getElementsByClassName('singer')[0].innerHTML = myPlaylist[plElement].Singer ?? '';
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

    // 讓box+目錄標籤的寬度，永遠不大於螢幕寬的0.8倍
    const wh_s = await GetStorageWidthHeight();
    const width = isNumeric(wh_s[0]) ? wh_s[0] + 'px' : wh_s[0];
    const height = isNumeric(wh_s[1]) ? wh_s[1] + 'px' : wh_s[1];

    // https://stackoverflow.com/a/175787
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function isNumeric(str: any) {
        return (
            !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
            !isNaN(parseFloat(str))
        ); // ...and ensure strings of whitespace fail
    }

    plBox.style.right = `calc(-1 * ${width})`;
    plBox.style.width = width;
    plBox.style.height = height;

    // 開閉清單
    // 預設以關閉清單的狀態初始化Style，然後一秒後觸發打開動作
    let isOpen = (await chrome.storage.local.get({ isOpen: true })).isOpen as boolean;
    let isOpen_option = false;
    const plOption = document.getElementById('plOption') as HTMLDivElement;
    const plOptionTitle = document.getElementById('plOpenOption') as HTMLDivElement;

    async function toggleDisplay(open: boolean) {
        if (open) {
            // 開啟清單
            plBox.style.right = '0px';
            plTitle.style.right = width;
            plOption.style.bottom = `-210px`;
        } else {
            // 關閉清單
            if (isOpen_option) {
                toggleDisplay_option(false);
                await new Promise((r) => setTimeout(r, 1000));
            }
            plOption.style.bottom = '-235px';
            plBox.style.right = `calc(-1 * ${width})`;
            plTitle.style.right = '0px';
        }
        isOpen = open;
        chrome.storage.local.set({ isOpen: isOpen });
    }

    function toggleDisplay_option(open: boolean) {
        if (open) {
            // 開啟清單
            plOption.style.bottom = '0px';
        } else {
            // 關閉清單
            plOption.style.bottom = `-210px`;
        }
        isOpen_option = open;
    }

    setTimeout(() => {
        toggleDisplay(isOpen);
    }, 1000);

    plTitle.addEventListener('click', () => toggleDisplay(!isOpen), false);
    plOptionTitle.addEventListener('click', () => toggleDisplay_option(!isOpen_option), false);

    // filter logic
    const plFilter = document.getElementById('plFilter') as HTMLInputElement;
    plFilter.addEventListener('input', () => {
        const filter = plFilter.value.toLowerCase().trim();
        const liList = plContent.getElementsByTagName('li');
        // foreach li in lis
        // but keep the first li
        for (let i = 1; i < liList.length; i++) {
            const li = liList[i];
            const songName = li.getElementsByClassName('songName')[0].innerHTML.toLowerCase();
            const singer = li.getElementsByClassName('singer')[0].innerHTML.toLowerCase();
            if (songName.indexOf(filter) > -1 || singer.indexOf(filter) > -1) {
                li.style.display = '';
            } else {
                li.style.display = 'none';
            }
        }
    });

    // Share buttons
    const song = myPlaylist[currentIndex];
    const shareUrl = (await GenerateURLFromSong(song)) + '&share=1';
    const plShareLinkInput = document.getElementById('plShareLinkInput') as HTMLInputElement;
    plShareLinkInput.value = shareUrl;

    const plCopylink = document.getElementById('plCopylink') as HTMLAnchorElement;
    plCopylink.addEventListener('click', async () => {
        navigator.clipboard.writeText(shareUrl);
        plCopylink.innerHTML = plCopylink.innerHTML.replace('Copy', 'Copied!');
        await new Promise((r) => setTimeout(r, 1000));
        plCopylink.innerHTML = plCopylink.innerHTML.replace('Copied!', 'Copy');
    });

    const plShareToTwitter = document.getElementById('plShareToTwitter') as HTMLAnchorElement;
    plShareToTwitter.addEventListener('mouseover', async () => {
        plShareToTwitter.href = `https://twitter.com/intent/tweet?text=${
            encodeURIComponent(song.Title + ' - ' + song.Singer) +
            '%0A' +
            encodeURIComponent(shareUrl) +
            '%0A' +
            `${encodeURIComponent('#YoutubeClipPlaylist #' + song.Singer)}`
        }`;
    });

    const plShareToFacebook = document.getElementById('plShareToFacebook') as HTMLAnchorElement;
    plShareToFacebook.addEventListener('mouseover', async () => {
        plShareToFacebook.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            shareUrl
        )}&quote=${encodeURIComponent(
            song.Title + ' - ' + song.Singer
        )}&hashtag=%23YoutubeClipPlaylist`;
    });

    console.debug('Playlist UI loaded');
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

// export function ChangeTwitcastingCSSToPlayingStyle(url: URL) {
//     if ('twitcasting.tv' == url.hostname) {
//         const vjsPlayer = document.getElementById('player');
//         if (vjsPlayer) {
//             vjsPlayer.classList.remove('vjs-paused');
//             vjsPlayer.classList.add('vjs-playing');
//             vjsPlayer.classList.add('vjs-has-started');
//         }
//     }
// }

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

export async function SetTheStartTimeManually(url: URL, urlParams: URLSearchParams): Promise<void> {
    // - Youtube skipped it when t == 0, and start from last history.
    // - Onedrive always go to 0.
    if (urlParams.has('t')) {
        // Twitcasting use videojs, Onedrive sometimes(?) use videojs, and it cannot set currentTime directly on the element.
        if (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            typeof (window as any).videojs === 'function' &&
            (url.hostname.indexOf('sharepoint.com') >= 0 ||
                url.hostname.indexOf('onedrive.live.com') >= 0 ||
                url.hostname.indexOf('twitcasting.tv') >= 0)
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

export async function GetStorageWidthHeight(): Promise<[string, string]> {
    const { width, height } = await chrome.storage.sync.get({
        width: '450',
        height: 'calc(100vh - 56px)',
    });
    return [width, height];
}

export async function SetStorageWidthHeight(width: string, height: string): Promise<void> {
    if (!width) width = '450';

    if (!height) height = 'calc(100vh - 56px)';

    await chrome.storage.sync.set({
        width: width,
        height: height,
    });
}

/**
 * Close the youtube chat message box
 */
export async function CloseChatMessageBoxInYoutube() {
    if (window.location.hostname.indexOf('youtube') < 0) {
        return;
    }

    // Livestream is on by default. Premiere is off by default.
    // Livestream is more common than Premiere in our playlists, so we trigger once at the beginning.
    const btn = await elementReady('#show-hide-button button', 'button');
    btn?.dispatchEvent(new Event('click'));
    const iframe = document.getElementById('chatframe') as HTMLIFrameElement;
    iframe.onload = () => {
        if (iframe.contentDocument?.getElementsByTagName('yt-live-chat-app').length) {
            btn?.dispatchEvent(new Event('click'));
        }
    };
}
