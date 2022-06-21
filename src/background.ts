/* eslint-disable @typescript-eslint/no-unused-vars */
import { IMessage } from './Models/Message';
import * as UrlHelper from './Helper/URLHelper';
import { urlParams, url } from './Helper/URLHelper';
import * as PlaylistHelper from './Helper/PlaylistHelper';

let tabId = -1;

// Clear storage
chrome.storage.local.remove(['shuffleList', 'myPlaylist', 'params']);

addListeners();
PlaylistHelper.fetchPlaylists();

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

        if (!chrome.tabs.onRemoved.hasListener(resetTabId)) {
            chrome.tabs.onRemoved.addListener(resetTabId);
        }
    }

    function resetTabId(_tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) {
        if (_tabId === tabId) {
            console.log('Tab %d CLOSED.', tabId);
            tabId = chrome.tabs.TAB_ID_NONE;
        }
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
        await PlaylistHelper.LoadPlayLists();
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
        PlaylistHelper.shuffleList.push(PlaylistHelper.shuffleList.shift() ?? 0);
        chrome.storage.local.set({ shuffleList: PlaylistHelper.shuffleList });
        updateTabId(sender.tab?.id);
        NextSong(PlaylistHelper.shuffleList[0]);
        sendResponse();
    });
    _addListener<string>('CheckList', async (message, sender, sendResponse) => {
        if (typeof message.Data !== 'undefined' && message.Data.length > 0) {
            await UrlHelper.prepareUrlParams(message.Data);
        }

        sendResponse(PlaylistHelper.CheckList());
    });
    _addListener<boolean>('GetNowPlaying', (message, sender, sendResponse) => {
        sendResponse(PlaylistHelper.myPlaylist[PlaylistHelper.CheckList()]);
    });
    _addListener<boolean>('FetchPlaylists', async (message, sender, sendResponse) => {
        await PlaylistHelper.fetchPlaylists();
        sendResponse();
    });
}

async function NextSong(index: number, UIClick = false) {
    const shuffle = urlParams.has('shuffle') && urlParams.get('shuffle') !== '0';

    if (tabId < 0) {
        console.warn('TabId not defined!');
        tabId = (await chrome.tabs.create({})).id ?? -1;

        if (tabId < 0) return;
    }

    if (PlaylistHelper.myPlaylist.length == 0) {
        console.warn('Playlist not loaded! Reloading playlists...');
        await PlaylistHelper.LoadPlayLists();
    }

    if (index >= PlaylistHelper.myPlaylist.length) {
        console.warn('Index out of bound! Reloading playlists...');
        await PlaylistHelper.LoadPlayLists();
        index = 0;
    }

    if (UIClick) {
        // Modify Shuffle List on UI Click
        if (shuffle) {
            const indexInShuffleList = PlaylistHelper.shuffleList.findIndex(
                (element) => element === index
            );
            await PlaylistHelper.SliceShuffleList(indexInShuffleList);
        }
        console.log(`Next Song ${index} by UI click`);
    } else {
        console.log(`Next Song ${index}`);
    }

    urlParams.delete('startplaylist');

    const nextSong = PlaylistHelper.myPlaylist[index];

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
    chrome.tabs.update(tabId, { url: newURL });
}
