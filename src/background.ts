/* eslint-disable @typescript-eslint/no-unused-vars */
import { IPlaylist } from './Models/IPlaylist';
import { IMessage } from './Models/Message';
import * as UrlHelper from './Helper/URLHelper';
import { urlParams, url } from './Helper/URLHelper';

let DisabledPlaylists: string[] = [];
let shuffleList: number[] = [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let myPlaylist: any[][] = [];
let Playlists: IPlaylist[] = [];

let tabId = -1;

// Clear storage
chrome.storage.local.remove(['shuffleList', 'myPlaylist', 'params']);

addListeners();
fetchPlaylists();

async function fetchPlaylists(): Promise<void> {
    const response = await fetch((await UrlHelper.GetBaseUrl()) + 'Playlists.jsonc');
    const json = await response.json();
    Playlists = json;
    return chrome.storage.local.set({ Playlists: Playlists });
}

function updateTabId(_tabId: number | undefined) {
    // Don't change the tabId inside Google Drive iframe
    if (
        '/embed/' !== url.pathname &&
        // Don't change the tabId when tab is from popup (-1)
        _tabId &&
        _tabId !== chrome.tabs.TAB_ID_NONE
    ) {
        console.debug('Update tabId: %d', _tabId);
        tabId = _tabId;

        chrome.tabs.onRemoved.addListener(resetTabId);
    }

    function resetTabId() {
        console.log('Tab %d CLOSED.', tabId);
        tabId = chrome.tabs.TAB_ID_NONE;
        chrome.tabs.onRemoved.removeListener(resetTabId);
    }
}

function addListeners() {
    function _addListener<T>(
        _name: string,
        callback: (
            message: IMessage<T>,
            sender: chrome.runtime.MessageSender,
            sendResponse: (response?: unknown) => void
        ) => void
    ) {
        chrome.runtime.onMessage.addListener(function (message: IMessage<T>, sender, sendResponse) {
            if (!message || message.Name !== _name) return;
            console.debug('Message received from Content Script: %o', message);

            callback(message, sender, sendResponse);
            return true;
        });
    }

    _addListener<string>('LoadPlaylists', async (message, sender, sendResponse) => {
        await UrlHelper.prepareUrlParams(message.Data);
        updateTabId(sender.tab?.id);
        await LoadPlayLists();
        sendResponse();
    });
    _addListener<{ index: number; UIClick: boolean }>(
        'NextSongToBackground',
        (message, sender, sendResponse) => {
            updateTabId(sender.tab?.id);
            NextSong(message.Data.index, message.Data.UIClick);
            sendResponse();
        }
    );
    _addListener<boolean>('StepShuffle', (message, sender, sendResponse) => {
        shuffleList.push(shuffleList.shift() ?? 0);
        chrome.storage.local.set({ shuffleList: shuffleList });
        updateTabId(sender.tab?.id);
        NextSong(shuffleList[0]);
        sendResponse();
    });
    _addListener<string>('CheckList', async (message, sender, sendResponse) => {
        if (typeof message.Data !== 'undefined' && message.Data.length > 0) {
            await UrlHelper.prepareUrlParams(message.Data);
        }

        sendResponse(CheckList());
    });
    _addListener<boolean>('GetNowPlaying', (message, sender, sendResponse) => {
        sendResponse(myPlaylist[CheckList()]);
    });
    _addListener<boolean>('FetchPlaylists', async (message, sender, sendResponse) => {
        await fetchPlaylists();
        sendResponse();
    });
}

async function LoadPlayLists() {
    const LoadedPlaylists = new Map();
    await getStorageLists();

    console.groupCollapsed('Playlists');
    console.table(Playlists);
    console.groupEnd();

    console.groupCollapsed('Loaded Playlists');
    await LoadAllPlaylists();
    await ConcatPlaylistsIntoMyPlaylists();
    console.groupEnd();

    console.groupCollapsed('myPlaylists');
    console.table(myPlaylist);
    console.groupEnd();

    const shuffle = urlParams.has('shuffle') && urlParams.get('shuffle') !== '0';
    console.log('Shuffle: %o', shuffle);
    console.log('StartPlayList: ', urlParams.has('startplaylist'));
    await MakeNewShuffleList();
    return Promise.resolve(true);

    function getStorageLists(): Promise<unknown[]> {
        const promises = [
            chrome.storage.local
                .get({ disabledLists: [] })
                .then((_result) => (DisabledPlaylists = _result.disabledLists)),
            chrome.storage.local
                .get({ shuffleList: [] })
                .then((_result) => (shuffleList = _result.shuffleList)),
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
                return LoadOnePlaylist(route, listName);
            }
        } else {
            console.log('Skip %s', listName);
            return Promise.resolve();
        }
    }

    async function LoadOnePlaylist(route: string, listName: string): Promise<void> {
        const response = await fetch(UrlHelper.baseURL + route);
        const json = await response.json();
        LoadedPlaylists.set(listName, json);
        console.log('Load %s', listName);
        console.table(json);
    }

    async function LoadAllPlaylists(): Promise<void[]> {
        if (!Playlists || Playlists.length === 0) await fetchPlaylists();

        const listName = urlParams.get('playlist');

        const promises: Promise<void>[] = [];

        Playlists.forEach((playlist) => {
            if (listName) {
                if (listName === playlist.name) {
                    promises.push(LoadOnePlaylist(playlist.route, playlist.name));
                }
            } else {
                promises.push(CheckAndLoadPlaylist(playlist));
            }
        });

        return Promise.all(promises);
    }

    async function ConcatPlaylistsIntoMyPlaylists() {
        myPlaylist = [];
        // It is important to load here in the order of 'Playlists'.
        Playlists.forEach((playlist) => {
            if (LoadedPlaylists.has(playlist.name)) {
                myPlaylist = myPlaylist.concat(LoadedPlaylists.get(playlist.name));
            }
        });

        await chrome.storage.local.set({ myPlaylist: myPlaylist });
    }

    function MakeRandomArray(length: number) {
        const array = [];
        for (let i = 0; i < length; ++i) array[i] = i;

        // http://stackoverflow.com/questions/962802#962890
        let tmp,
            current,
            top = array.length;
        if (top)
            while (--top) {
                current = Math.floor(Math.random() * (top + 1));
                tmp = array[current];
                array[current] = array[top];
                array[top] = tmp;
            }

        return array;
    }

    async function MakeNewShuffleList() {
        if (
            shuffle &&
            (shuffleList.length !== myPlaylist.length || urlParams.has('startplaylist'))
        ) {
            console.log('Making new shuffleList...');
            shuffleList = MakeRandomArray(myPlaylist.length);
            await chrome.storage.local.set({ shuffleList: shuffleList });
        }
    }
}

function CheckList(): number {
    /**
     * VideoID: 必須用引號包住，為字串型態。
     * StartTime: 只能是非負數。如果要從頭播放，輸入0
     * EndTime: 只能是非負數。如果要播放至尾，輸入0
     * Title: 必須用引號包住，為字串型態
     */
    //Check myPlaylist
    let i = -1;
    let flag = false;
    const nowParameters = {
        v: urlParams.get('v'),
        t: urlParams.get('t') ?? 0,
        start: urlParams.get('start'),
    };

    if (url.pathname.match(/^\/watch$/i)) {
        // Youtube
        for (i = 0; i < myPlaylist.length; i++) {
            // VideoId
            if (
                myPlaylist[i][0] == nowParameters.v &&
                // StartTime
                myPlaylist[i][1] == nowParameters.t
            ) {
                flag = true;
                break;
            }
        }
    } else {
        // Google Drive iframe, OneDrive, Others
        for (i = 0; i < myPlaylist.length; i++) {
            // VideoId
            if (
                (myPlaylist[i][0] == nowParameters.v ||
                    myPlaylist[i][0] == url.origin + url.pathname ||
                    myPlaylist[i][0] == url.origin + url.pathname + url.hash) &&
                // StartTime
                (myPlaylist[i][1] == nowParameters.t || myPlaylist[i][1] == nowParameters.start)
            ) {
                flag = true;
                break;
            }
        }
    }
    if (flag) {
        console.group('Check List');
        console.log(`Playing on Playlist No.${i}`);
        console.log(`Name : ${myPlaylist[i][3]}`);
        console.log(`URL  : ${myPlaylist[i][0]}`);
        console.log(`Start: ${myPlaylist[i][1]}`);
        console.log(`End  : ${myPlaylist[i][2]}`);
        console.groupEnd();
    } else {
        console.log('Not playing in the playlist.');
        console.log('CheckList with parameters: %o', nowParameters);
        i = -1;
    }
    return i;
}

async function NextSong(index: number, UIClick = false) {
    const shuffle = urlParams.has('shuffle') && urlParams.get('shuffle') !== '0';

    if (tabId < 0) {
        console.warn('TabId not defined!');
        tabId = (await chrome.tabs.create({})).id ?? -1;

        if (tabId < 0) return;
    }

    if (myPlaylist.length == 0) {
        console.warn('Playlist not loaded! Reloading playlists...');
        await LoadPlayLists();
    }

    if (index >= myPlaylist.length) {
        console.warn('Index out of bound! Reloading playlists...');
        await LoadPlayLists();
        index = 0;
    }

    if (UIClick) {
        // Modify Shuffle List on UI Click
        if (shuffle) {
            const indexInShuffleList = shuffleList.findIndex((element) => element === index);
            shuffleList = shuffleList
                .slice(indexInShuffleList)
                .concat(shuffleList.slice(0, indexInShuffleList));

            await chrome.storage.local.set({ shuffleList: shuffleList });
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

    let newURL: string;
    if (nextSong[0].indexOf('http') >= 0) {
        // URL (Onedrive)
        const _url = new URL(nextSong[0]);
        if (nextSong[0].indexOf('?') > 0) {
            _url.searchParams.forEach(function (value, key) {
                urlParams.set(key, value);
            });
        }
        newURL = `${_url.origin}${_url.pathname}?${urlParams.toString()}${_url.hash}`;
    } else {
        // ID
        if (nextSong[0].length > 20) {
            // Google Drive
            newURL = `https://drive.google.com/file/d/${nextSong[0]}/view?${urlParams.toString()}`;
        } else {
            // Youtube
            newURL = `https://www.youtube.com/watch?${urlParams.toString()}`;
        }
    }
    await UrlHelper.SaveToStorage();

    console.log('Redirect: %s', newURL);
    if (typeof (await chrome.tabs.get(tabId)) === 'undefined') {
        tabId = chrome.tabs.TAB_ID_NONE;
    }
    chrome.tabs.update(tabId, { url: newURL });
}
