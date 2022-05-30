/* eslint-disable @typescript-eslint/no-unused-vars */
import { IPlaylist } from './Models/IPlaylist';
import { IMessage } from './Models/Message';
import * as UrlHelper from './UrlHelper';
import { urlParams } from './UrlHelper';

let url: URL;
let DisabledPlaylists: string[] = [];
let shuffle = false;
let shuffleList: number[] = [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let myPlaylist: any[][] = [];
let Playlists: IPlaylist[] = [];
const LoadedPlaylists = new Map();

function fetchPlaylists() {
    fetch('https://github.com/jim60105/Playlists/raw/minify/Playlists.jsonc')
        .then(response => response.json())
        .then(json => Playlists = json);
}

async function LoadPlayLists() {
    function getStorageLists(): Promise<unknown[]> {
        const promises = [
            chrome.storage.local.get({ disabledLists: [] })
                .then(_result => DisabledPlaylists = _result.disabledLists),
            chrome.storage.local.get({ shuffleList: [] })
                .then(_result => shuffleList = _result.shuffleList)
        ];
        return Promise.all(promises);
    }

    async function CheckAndLoadPlaylist(playlist: IPlaylist): Promise<void> {
        const [listName, tags, route] = [playlist.name, playlist.tag, playlist.route];

        let flag = false;

        const include = urlParams.get('playlistinclude')?.toString().toLowerCase() || '';

        if ('' != include) {
            const includes = include.split('_');
            for (const i in tags) {
                if (includes.includes(tags[i].toLowerCase())) {
                    flag = true;
                    break;
                }
            }
        } else {
            flag = true;
        }

        const exclude = urlParams.get('playlistexclude')?.toString().toLowerCase() || '';

        if ('' != exclude) {
            const excludes = exclude.split('_');
            for (const j in tags) {
                if (excludes.includes(tags[j].toLowerCase())) {
                    flag = false;
                    console.log(`Exclude ${listName} with tag: ${tags[j]}`);
                    break;
                }
            }
        }

        if (flag) {
            if (DisabledPlaylists.includes(listName)) {
                console.warn(`Disabled ${listName}. Please click the menu to enable it again.`);
            } else {
                const baseURL = 'https://raw.githubusercontent.com/jim60105/Playlists/minify/';
                return fetch(baseURL + route)
                    .then(response => {
                        if (!response.ok) {
                            console.error('Load playlist %s failed: %s', listName, response.url);
                        } else {
                            return response.json();
                        }
                    })
                    .then(_playlist => {
                        LoadedPlaylists.set(listName, _playlist);
                        console.log('Load %s: %o', listName, _playlist);
                    });
            }
        } else {
            console.log('Skip %s', listName);
            return Promise.resolve();
        }
    }

    async function LoadAllPlaylists(): Promise<void[]> {
        const promises: Promise<void>[] = [];

        Playlists.forEach((playlist) => {
            promises.push(CheckAndLoadPlaylist(playlist));
        });

        return Promise.all(promises);
    }

    function ConcatPlaylistsIntoMyPlaylists() {
        myPlaylist = [];
        Playlists.forEach((playlist) => {
            if (LoadedPlaylists.has(playlist.name)) {
                myPlaylist = myPlaylist.concat(LoadedPlaylists.get(playlist.name));
            }
        });
        chrome.storage.local.set({ 'myPlaylist': myPlaylist });
    }

    function MakeShuffleList(length: number) {
        const shuffleList = [];
        for (let i = 0; i < length; ++i) shuffleList[i] = i;

        // http://stackoverflow.com/questions/962802#962890
        let tmp,
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

    await getStorageLists();

    console.log(Playlists);
    await LoadAllPlaylists();
    ConcatPlaylistsIntoMyPlaylists();

    shuffle = urlParams.has('shuffle') && urlParams.get('shuffle') !== '0';
    chrome.storage.local.set({ 'shuffle': shuffle });
    console.log('Shuffle: %o', shuffle);

    // Make shuffle list when length not match, or starting playlist
    if (shuffle
        && (urlParams.has('startplaylist')
            || shuffleList.length != myPlaylist.length)) {
        shuffleList = MakeShuffleList(myPlaylist.length);

        chrome.storage.local.set({ 'shuffleList': shuffleList });
    }

}

function CheckList(): number {
    urlParams.forEach(function (value, key) {
        switch (key) {
            case 't':
                //Youtube有時會自動在t後面帶上個s(秒)，在這裡把它去掉
                urlParams.set(key, value.replace('s', ''));
                break;
        }
    });
    console.debug(urlParams.toString());

    //Check myPlaylist
    let i = -1;
    let flag = false;
    if (url.pathname.match(/^\/watch$/i)) {
        // Youtube
        for (i = 0; i < myPlaylist.length; i++) {
            if (myPlaylist[i][0] == urlParams.get('v') && myPlaylist[i][1] == urlParams.get('t') && myPlaylist[i][2] == urlParams.get('end')) {
                flag = true;
                break;
            }
        }
    } else {
        // Google Drive iframe, OneDrive, Others
        for (i = 0; i < myPlaylist.length; i++) {
            if ((myPlaylist[i][0] == urlParams.get('v') ||
                myPlaylist[i][0] == url.origin + url.pathname ||
                myPlaylist[i][0] == url.origin + url.pathname + url.hash) &&
                (myPlaylist[i][1] == urlParams.get('t') ||
                    myPlaylist[i][1] == urlParams.get('start')) &&
                myPlaylist[i][2] == urlParams.get('end')) {
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

async function NextSong(index: number, tabId: number, UIClick = false) {
    if (myPlaylist.length == 0) {
        console.warn('Playlist not loaded! Reloading playlists...');
        await LoadPlayLists();
    }

    if (index >= myPlaylist.length) {
        console.warn('Index out of bound! Reloading playlists...');
        await LoadPlayLists();
        index = 0;
    }

    // // Send "next song" outside the iframe
    // if ('/embed/' == window.location.pathname) {
    //     if (!UIClick) {
    //         parent.postMessage('song end', '*');
    //     } else {
    //         parent.postMessage(index, '*');
    //     }
    //     return;
    // }

    if (UIClick) {
        // Modify Shuffle List on UI Click
        if (shuffle) {
            const indexInShuffleList = shuffleList.findIndex((element) => element === index);
            shuffleList = shuffleList.slice(indexInShuffleList).concat(shuffleList.slice(0, indexInShuffleList));

            await chrome.storage.local.set({ 'shuffleList': shuffleList });
        }
        console.log(`Next Song ${index} by UI click`);
    } else {
        console.log(`Next Song ${index}`);
    }

    urlParams.delete('startplaylist');

    const nextSong = myPlaylist[index];

    urlParams.set('v', nextSong[0]);
    urlParams.set('t', nextSong[1]);
    urlParams.set('end', nextSong[2]);

    if (nextSong[0].indexOf('http') >= 0) {
        // URL
        const url = new URL(nextSong[0]);
        if (nextSong[0].indexOf('?') > 0) {
            url.searchParams.forEach(function (value, key) {
                urlParams.set(key, value);
            });
        }
        await UrlHelper.SaveToStorage();
        chrome.tabs.update(tabId, { url: `${url.origin}${url.pathname}?${urlParams.toString()}${url.hash}` });
    } else {
        await UrlHelper.SaveToStorage();
        // ID
        if (nextSong[0].length > 20) {
            // Google Drive
            chrome.tabs.update(tabId, { url: `https://drive.google.com/file/d/${nextSong[0]}/view?${urlParams.toString()}` });
        } else {
            // Youtube
            chrome.tabs.update(tabId, { url: `https://www.youtube.com/watch?${urlParams.toString()}` });
        }
    }
}

function addListeners() {
    function addLoadPlaylistsListener() {
        chrome.runtime.onMessage.addListener(async function (message: IMessage<string>, sender, sendResponse) {
            if (!message || message.Name !== 'LoadPlaylists')
                return;

            console.debug('Message received from contentScript.js: %o', message);
            await UrlHelper.prepareUrlParams(message.Data);

            await LoadPlayLists();
            sendResponse(true);
        });
    }
    function addCheckListListener() {
        chrome.runtime.onMessage.addListener(function (message: IMessage<unknown>, sender, sendResponse) {
            if (message && message.Name === 'CheckList') {
                sendResponse(CheckList());
            }
        });
    }

    function addNextSongListener() {
        chrome.runtime.onMessage.addListener(async function (message: IMessage<{ 'index': number, 'UIClick': boolean; }>, sender, sendResponse) {
            if (message && message.Name === 'NextSongToBackground'
                && sender.tab?.id) {
                await NextSong(message.Data.index, sender.tab.id, message.Data.UIClick);
            }
        });
    }

    function addStepShuffleListener() {
        chrome.runtime.onMessage.addListener(async function (message: IMessage<boolean>, sender, sendResponse) {
            if (message && message.Name === 'StepShuffle'
                && sender.tab?.id) {
                shuffleList.push(shuffleList.shift() ?? 0);
                chrome.storage.local.set({ 'shuffleList': shuffleList });
                NextSong(shuffleList[0], sender.tab.id);
            }
        });
    }

    function addNowPlayingListener() {
        chrome.runtime.onMessage.addListener(async function (message: IMessage<boolean>, sender, sendResponse) {
            if (message && message.Name === 'GetNowPlaying') {
                sendResponse(myPlaylist[CheckList()]);
            }
        });
    }

    addLoadPlaylistsListener();
    addNextSongListener();
    addCheckListListener();
    addStepShuffleListener();
    addNowPlayingListener();
}

// Clear urlParams
UrlHelper.SaveToStorage();

addListeners();
fetchPlaylists();
