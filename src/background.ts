/* eslint-disable @typescript-eslint/no-unused-vars */
import { IMessage } from './Models/Message';
import { ISong } from './Models/Song';
import * as UrlHelper from './Helper/URLHelper';
import * as PlaylistHelper from './Helper/PlaylistHelper';

addListeners();
PlaylistHelper.fetchPlaylists();

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
        const urlParams = await UrlHelper.PrepareUrlParams(message.Data);
        await PlaylistHelper.LoadPlayLists(urlParams);

        if (!chrome.tabs.onRemoved.hasListener(resetTabId)) {
            chrome.tabs.onRemoved.addListener(resetTabId);
        }

        function resetTabId(_tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) {
            if (sender.tab?.id && _tabId === sender.tab.id) {
                console.log('Tab %d CLOSED.', _tabId);
                UrlHelper.RemoveFromStorage();
                chrome.tabs.onRemoved.removeListener(resetTabId);
            }
        }

        sendResponse();
    });
    _addListener<{ index: number; UIClick: boolean }>(
        'NextSongToBackground',
        (message, sender, sendResponse) => {
            let tabId: number = chrome.tabs.TAB_ID_NONE;
            if (sender.tab && sender.tab.url) {
                if (sender.tab.url.indexOf('/embed/') > 0) {
                    tabId = sender.tab.openerTabId ?? tabId;
                } else {
                    tabId = sender.tab.id ?? tabId;
                }
            }

            NextSong(tabId, message.Data.index, message.Data.UIClick);
            sendResponse();
        }
    );
    _addListener<string>('CheckList', async (message, sender, sendResponse) => {
        sendResponse(await PlaylistHelper.CheckList(message.Data));
    });
    _addListener<string>('GetNowPlaying', async (message, sender, sendResponse) => {
        const myPlaylist: ISong[] = (await chrome.storage.local.get('myPlaylist')).myPlaylist;
        sendResponse(myPlaylist[await PlaylistHelper.CheckList(message.Data)]);
    });
    _addListener<boolean>('FetchPlaylists', async (message, sender, sendResponse) => {
        sendResponse(await PlaylistHelper.fetchPlaylists());
    });
    _addListener<boolean>('ReloadLastSong', async (message, sender, sendResponse) => {
        const url = `https://www.youtube.com/watch?${await UrlHelper.GetFromStorage('')}`;
        console.log('Redirect to last song: %s', url);

        let tabId: number = chrome.tabs.TAB_ID_NONE;
        if (sender.tab && sender.tab.url) {
            if (sender.tab.url.indexOf('/embed/') > 0) {
                tabId = sender.tab.openerTabId ?? tabId;
            } else {
                tabId = sender.tab.id ?? tabId;
            }
        }
        if (tabId < 0) {
            console.warn('TabId not defined!');
            tabId = (await chrome.tabs.create({})).id ?? -1;

            if (tabId < 0) return;
        }
        chrome.tabs.update(tabId, { url: url });
        sendResponse();
    });
}

async function NextSong(tabId: number, _index: number, UIClick = false) {
    const urlParams = new URLSearchParams(await UrlHelper.GetFromStorage(''));
    const shuffle = urlParams.has('shuffle') && urlParams.get('shuffle') !== '0';
    let index = _index;

    if (tabId < 0) {
        console.warn('TabId not defined!');
        tabId = (await chrome.tabs.create({})).id ?? -1;

        if (tabId < 0) return;
    }

    let myPlaylist = (await chrome.storage.local.get({ myPlaylist: [] })).myPlaylist as ISong[];
    const shuffleList = (await chrome.storage.local.get('shuffleList')).shuffleList;

    if (myPlaylist.length == 0) {
        console.warn('Playlist not loaded! Reloading playlists...');
        myPlaylist = await PlaylistHelper.LoadPlayLists(urlParams);
    }

    if (index >= myPlaylist.length) {
        console.warn('Index out of bound! Reloading playlists...');
        myPlaylist = await PlaylistHelper.LoadPlayLists(urlParams);
        index = 0;
    }

    if (myPlaylist.length == 0) {
        console.error('Playlist is empty!');
        return;
    }

    if (UIClick) {
        // Modify Shuffle List on UI Click
        if (shuffle) {
            await PlaylistHelper.SliceShuffleList(index);
        }
        console.log(`Next Song ${index} by UI click`);
    } else {
        console.log(`Next Song ${index}`);
    }

    urlParams.delete('startplaylist');
    urlParams.delete('share');

    // 'start' parameter will be left by Google Drive player
    // and Youtube will overwrite 't' parameter with 'start' parameter
    urlParams.delete('start');

    const nextSong = myPlaylist[index];

    urlParams.set('v', nextSong.VideoID);
    urlParams.set('t', nextSong.StartTime.toString());
    urlParams.set('end', nextSong.EndTime.toString());

    const newURL = await UrlHelper.GenerateURLFromSong(nextSong, urlParams);
    await UrlHelper.SaveToStorage(urlParams.toString());

    console.log('Redirect: %s', newURL);
    chrome.tabs.update(tabId, { url: newURL });
}
