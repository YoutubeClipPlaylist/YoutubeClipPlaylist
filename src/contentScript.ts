import { Message } from './Models/Message';
import * as UrlHelper from './Helper/URLHelper';
import { urlParams, url } from './Helper/URLHelper';
import * as DOMHelper from './Helper/DOMHelper';
import { player } from './Helper/DOMHelper';

(async function () {
    if (window.location.pathname == '/live_chat_replay') return;

    // if ('twitcasting.tv' == window.location.hostname) {
    //     // Change twitcasting archive video through hash
    //     await DOMHelper.ChangeTwitcastingArchiveVideoThroughHash();
    // }

    await UrlHelper.prepareUrlParams(window.location.href);

    if (!UrlHelper.HasMonitoredParameters()) {
        return;
    }

    try {
        await LoadPlaylists();
        await WaitForDOMLoaded();
    } catch (e) {
        if (e instanceof Error)
            switch (e.message) {
                case 'Skip the song if it is on Google Drive and play in the background.':
                    NextSong(await CheckList() + 1);
                    break;
                case 'Google Drive files in iframe':
                    // ==> And then this contentScript will triggered inside iframe.
                    return;
                default:
                    throw e;
            }
    }

    // first start
    if (urlParams.has('startplaylist')) {
        const shuffle = urlParams.has('shuffle') && urlParams.get('shuffle') !== '0';
        console.debug('Get Shuffle: %s', shuffle);
        if (shuffle) {
            NextSong((await chrome.storage.local.get('shuffleList')).shuffleList[0]);
        } else {
            NextSong(0);
        }
        return;
    }

    // Change twitcasting CSS to playing style
    DOMHelper.ChangeTwitcastingCSSToPlayingStyle();

    await DOMHelper.SetTheStartTimeManually();

    await DoOnVideoChange();

    // For situations where the webpage does not reload, such as clicking a link on YouTube.
    player.onloadedmetadata = DoOnVideoChange;

    async function LoadPlaylists(): Promise<void> {
        await chrome.runtime.sendMessage(new Message('LoadPlaylists', url));
    }

    async function CheckList(): Promise<number> {
        return chrome.runtime.sendMessage(new Message('CheckList'));
    }

    function NextSong(index: number, UIClick = false): void {
        chrome.runtime.sendMessage(new Message('NextSongToBackground', { 'index': index, 'UIClick': UIClick }));
    }

    function StepShuffle(): void {
        chrome.runtime.sendMessage(new Message('StepShuffle'));
    }

    async function WaitForDOMLoaded(): Promise<void> {
        // Gateway
        if (url.host === 'www.youtube.com' && url.pathname === '/') {
            return;
        }

        // Google Drive files in iframe
        if (url.pathname.match(/^\/file(\/u\/\d)?\/d\/.*\/view$/i)) {
            const iframe = await DOMHelper.elementReady('#drive-viewer-video-player-object-0', 'iframe') as HTMLIFrameElement;
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

            throw new Error('Google Drive files in iframe');
        }

        // Skip the song if it is on Google Drive and play in the background.
        if ('/embed/' === url.pathname && 'hidden' === document.visibilityState) {
            throw new Error('Skip the song if it is on Google Drive and play in the background.');
        }

        await DOMHelper.WaitUntilThePlayerIsReady();
        return;
    }

    async function DoOnVideoChange(loadedmetadata: unknown = undefined) {
        const currentIndex = await CheckList();
        const shuffle = urlParams.has('shuffle') && urlParams.get('shuffle') !== '0';
        console.log('Playing on Playlist No.%d', currentIndex);

        player.ontimeupdate = CheckTimeUp;

        if (currentIndex >= 0) {
            // DOMHelper.DisableAutoVideoPause();
            DOMHelper.MakePlaylistUI(currentIndex);
            DOMHelper.MakeSubtitle();
        } else {
            const firstRun = 'undefined' === typeof loadedmetadata;
            if (!firstRun) {
                // Not playing in the playlist
                CleanUp();
            }
        }

        //Stop the player when the end time is up.
        function CheckTimeUp() {
            // Handle Keyboard Media Key 'NextTrack'
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
            if (player.currentTime < ~~(urlParams.get('t') ?? 0)) {
                CleanUp();
                console.log('It is detected that the current time is less than the start time.');
            }
        }

        function CleanUp() {
            console.log('Clean up!');
            player.ontimeupdate = null;
            UrlHelper.prepareUrlParams(window.location.href);
            DOMHelper.DestroySubtitle();
            DOMHelper.HideUI();
        }
    }
})();