import { Message } from './Models/Message';
import * as UrlHelper from './Helper/URLHelper';
import * as DOMHelper from './Helper/DOMHelper';
import { player } from './Helper/DOMHelper';
import './contentScript.scss';

(async function () {
    if (
        ['/live_chat', '/live_chat_replay', '/mwebanimation.php'].includes(window.location.pathname)
    ) {
        return;
    }

    const url = new URL(window.location.href);
    const urlParams = await UrlHelper.PrepareUrlParams(url.toString());
    let currentIndex = -1;

    // if ('twitcasting.tv' == window.location.hostname) {
    //     // Change twitcasting archive video through hash
    //     await DOMHelper.ChangeTwitcastingArchiveVideoThroughHash();
    // }

    if (!UrlHelper.HasMonitoredParameters(urlParams)) {
        return;
    } else {
        // Youtube Embed video
        if (window.location != window.parent.location) {
            if (!document.referrer.startsWith('https://drive.google.com/')) return;
        }
    }

    // first start
    if (urlParams.has('startplaylist')) {
        // Clear storage
        chrome.storage.local.remove(['shuffleList', 'myPlaylist', 'params']);
    }

    await UrlHelper.SaveToStorage(urlParams.toString());

    try {
        await LoadPlaylists();
        await WaitForDOMLoaded();
    } catch (e) {
        if (e instanceof Error)
            switch (e.message) {
                case 'Skip the song if it is on Google Drive and play in the background':
                    console.debug(
                        'Skip the song if it is on Google Drive and play in the background'
                    );
                    NextSong((await CheckList(url.toString())) + 1);
                    break;
                case 'Google Drive files in iframe':
                    console.debug('Google Drive files in iframe');
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
    // DOMHelper.ChangeTwitcastingCSSToPlayingStyle(url);

    await DOMHelper.SetTheStartTimeManually(url, urlParams);

    // Wait one second before registering the event listener
    await DoOnVideoChange();

    // For situations where the webpage does not reload, such as clicking a link on YouTube.
    player.onloadedmetadata = DoOnVideoChange;

    // Close the youtube chat message box
    await DOMHelper.CloseChatMessageBoxInYoutube();

    function LoadPlaylists(): Promise<void> {
        return chrome.runtime.sendMessage(new Message('LoadPlaylists', url));
    }

    function CheckList(urlString: string): Promise<number> {
        return chrome.runtime.sendMessage(new Message('CheckList', urlString));
    }

    function NextSong(index: number, UIClick = false): void {
        chrome.runtime.sendMessage(
            new Message('NextSongToBackground', { index: index, UIClick: UIClick })
        );
    }

    async function ReverseStepShuffle(): Promise<void> {
        const shuffleList: number[] = (await chrome.storage.local.get('shuffleList')).shuffleList;
        shuffleList.unshift(shuffleList.pop() ?? 0);
        chrome.storage.local.set({ shuffleList: shuffleList });

        NextSong(shuffleList[0]);
    }

    async function StepShuffle(): Promise<void> {
        const shuffleList: number[] = (await chrome.storage.local.get('shuffleList')).shuffleList;
        shuffleList.push(shuffleList.shift() ?? 0);
        chrome.storage.local.set({ shuffleList: shuffleList });

        NextSong(shuffleList[0]);
    }

    async function WaitForDOMLoaded(): Promise<void> {
        // Gateway
        if (url.host === 'www.youtube.com' && url.pathname === '/') {
            return;
        }

        // Google Drive files in iframe
        if (url.pathname.match(/^\/file(\/u\/\d)?\/d\/.*\/view$/i)) {
            const iframe = (await DOMHelper.elementReady(
                '#drive-viewer-video-player-object-0',
                'iframe'
            )) as HTMLIFrameElement;
            // Forcibly display the thumbnail video
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            (iframe.parentNode!.parentNode!.childNodes[1]! as HTMLImageElement).style.visibility =
                'hidden';
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            (iframe.parentNode!.parentNode!.childNodes[2]! as HTMLImageElement).style.visibility =
                'unset';
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
            throw new Error('Skip the song if it is on Google Drive and play in the background');
        }

        await DOMHelper.WaitUntilThePlayerIsReady();
        return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async function DoOnVideoChange(loadedmetadata: unknown = undefined) {
        const _currentIndex = await CheckList(window.location.href);

        if (currentIndex == _currentIndex) {
            return;
        } else {
            currentIndex = _currentIndex;
            player.ontimeupdate = null;
        }

        const shuffle = urlParams.has('shuffle') && urlParams.get('shuffle') !== '0';

        if (currentIndex >= 0) {
            console.log('Playing on Playlist No.%d', currentIndex);

            player.ontimeupdate = CheckTimeUp;

            // DOMHelper.DisableAutoVideoPause();
            await DOMHelper.MakePlaylistUI(currentIndex, shuffle);
            try {
                await DOMHelper.MakeSubtitle(url.toString(), ~~(urlParams.get('t') ?? '0'));
            } catch (e) {
                console.error(e);
            }
        } else {
            CleanUp();
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

                    navigator.mediaSession.setActionHandler('previoustrack', function () {
                        console.debug('Media Key trigger');
                        player.ontimeupdate = null;

                        if (shuffle) {
                            ReverseStepShuffle();
                        } else {
                            NextSong(currentIndex - 1);
                        }
                    });
                }
            }

            HandleMediaKey();

            //console.debug(player.currentTime);
            let timeUp: boolean = player.currentTime > ~~(urlParams.get('end') ?? 0);
            if ('0' == urlParams.get('end')) timeUp = false;
            if (player.ended) timeUp = true;

            if (timeUp) {
                player.pause();
                player.ontimeupdate = null;
                console.log('Pause player at ' + player.currentTime);

                if (currentIndex < 0) return;

                console.log('The song is over, now play the next song.');
                if (shuffle) {
                    StepShuffle();
                } else {
                    NextSong(currentIndex + 1);
                }
            }

            // "player.currentTime !== 0" is a workaround for the issue that conflicts with the other plugin: "Enhancer for YouTube™"
            // It seems to set player.currentTime to 0 after the video has finished loading. This will cause CheckTimeUp.CleanUp() to be fired.
            // I'm guessing it's due to ad blocking or something?
            if (
                player.currentTime !== 0 &&
                //Clear ontimeupdate when it is detected that the current time is less than the start time.
                player.currentTime < ~~(urlParams.get('t') ?? 0)
            ) {
                CleanUp();
                console.log('Pause player at ' + player.currentTime);
                console.log('It is detected that the current time is less than the start time.');
            }
        }

        function CleanUp() {
            console.log('Clean up!');
            player.ontimeupdate = null;
            UrlHelper.PrepareUrlParams(window.location.href);
            UrlHelper.RemoveFromStorage();
            DOMHelper.DestroySubtitle();
            DOMHelper.HideUI();
        }
    }
})();
