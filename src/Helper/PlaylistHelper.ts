import { IPlaylist } from '../Models/Playlist';
import { ISong, Song } from '../Models/Song';
import * as UrlHelper from './URLHelper';

const defaultDisabledTags = ['notsongs', 'member', 'onedrive'];

export async function fetchPlaylists(): Promise<IPlaylist[]> {
    const response = await fetch((await UrlHelper.GetBaseUrl()) + 'Playlists.jsonc');
    const json = await response.json();
    const Playlists: IPlaylist[] = json;
    await chrome.storage.local.set({ Playlists: Playlists });
    return Playlists;
}

export async function LoadPlayLists(urlParams: URLSearchParams): Promise<ISong[]> {
    const LoadedPlaylists = new Map();
    // eslint-disable-next-line prefer-const
    let [DisabledPlaylists, shuffleList, Playlists] = await getStorageLists();
    const baseURL = await UrlHelper.GetBaseUrl();

    console.groupCollapsed('Playlists');
    console.table(Playlists);
    console.groupEnd();

    console.groupCollapsed('Loaded Playlists');
    await LoadAllPlaylists();
    const myPlaylist = await ConcatPlaylistsIntoMyPlaylists();
    console.groupEnd();

    console.groupCollapsed('myPlaylists');
    console.table(myPlaylist);
    console.groupEnd();

    const shuffle = urlParams.has('shuffle') && urlParams.get('shuffle') !== '0';
    console.log('Shuffle: %o', shuffle);
    console.log('StartPlayList: ', urlParams.has('startplaylist'));
    await MakeNewShuffleList();
    return myPlaylist;

    async function getStorageLists(): Promise<[string[], number[], IPlaylist[]]> {
        let DisabledPlaylists: string[] = [],
            shuffleList: number[] = [],
            Playlists: IPlaylist[] = [];
        const promises = [
            chrome.storage.sync
                .get({ disabledLists: await GenerateDefaultDisabledPlaylists() })
                .then((_result) => (DisabledPlaylists = _result.disabledLists)),
            chrome.storage.local
                .get({ shuffleList: [] })
                .then((_result) => (shuffleList = _result.shuffleList)),
            chrome.storage.local
                .get({ Playlists: [] })
                .then((_result) => (Playlists = _result.Playlists)),
        ];
        await Promise.all(promises);
        return [DisabledPlaylists, shuffleList, Playlists];
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
        const response = await fetch(baseURL + route);
        const json = (await response.json()) as [
            string,
            number,
            number,
            string | undefined,
            string | undefined
        ][];
        const tempList: ISong[] = [];

        json.forEach((input) => {
            const song: Song = new Song(...input);
            tempList.push(song);
        });
        LoadedPlaylists.set(listName, tempList);
        console.log('Load %s', listName);
        console.table(tempList);
    }

    async function LoadAllPlaylists(): Promise<void[]> {
        if (!Playlists || Playlists.length === 0) Playlists = await fetchPlaylists();

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

    async function ConcatPlaylistsIntoMyPlaylists(): Promise<ISong[]> {
        let myPlaylist: ISong[] = [];
        // It is important to load here in the order of 'Playlists'.
        Playlists.forEach((playlist) => {
            if (LoadedPlaylists.has(playlist.name)) {
                const tempPlaylist = LoadedPlaylists.get(playlist.name);
                tempPlaylist.forEach((element: ISong) => {
                    element.Singer = playlist.singer;
                });

                myPlaylist = myPlaylist.concat(tempPlaylist);
            }
        });

        await chrome.storage.local.set({ myPlaylist: myPlaylist });
        return myPlaylist;
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
            shuffleList.length = 0;
            shuffleList.push(...MakeRandomArray(myPlaylist.length));
            await chrome.storage.local.set({ shuffleList: shuffleList });
        }
    }
}

export async function CheckList(urlString: string): Promise<number> {
    const url = new URL(urlString);
    const urlParams = await UrlHelper.PrepareUrlParams(urlString);
    const myPlaylist: ISong[] = (await chrome.storage.local.get({ myPlaylist: [] })).myPlaylist;

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
                myPlaylist[i].VideoID == nowParameters.v &&
                // StartTime
                myPlaylist[i].StartTime == nowParameters.t
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
                (myPlaylist[i].VideoID == nowParameters.v ||
                    myPlaylist[i].VideoID == url.origin + url.pathname ||
                    myPlaylist[i].VideoID == url.origin + url.pathname + url.hash) &&
                // StartTime
                (myPlaylist[i].StartTime == nowParameters.t ||
                    myPlaylist[i].StartTime.toString() == nowParameters.start)
            ) {
                flag = true;
                break;
            }
        }
    }
    if (flag) {
        console.group('Check List');
        console.log(`Playing on Playlist No.${i}`);
        console.log(`Name : ${myPlaylist[i].Title}`);
        console.log(`URL  : ${myPlaylist[i].VideoID}`);
        console.log(`Start: ${myPlaylist[i].StartTime}`);
        console.log(`End  : ${myPlaylist[i].EndTime}`);
        console.groupEnd();
    } else {
        console.log('Not playing in the playlist.');
        console.log('CheckList with parameters: %o', nowParameters);
        i = -1;
    }
    return i;
}

export async function GenerateDefaultDisabledPlaylists(): Promise<string[]> {
    const Playlists: IPlaylist[] = (await chrome.storage.local.get({ Playlists: [] })).Playlists;
    const disabledPlaylists: string[] = [];
    Playlists.forEach((playlist) => {
        const tags = playlist.tag;
        for (const i in tags) {
            if (defaultDisabledTags.includes(tags[i].toLowerCase())) {
                disabledPlaylists.push(playlist.name);
                break;
            }
        }
    });
    return disabledPlaylists;
}

export async function ReadPlaylistsFromStorage(): Promise<(string[] | IPlaylist[])[]> {
    const Playlists =
        ((await chrome.storage.local.get('Playlists')).Playlists as IPlaylist[]) ?? [];
    const DisabledPlaylists =
        ((
            await chrome.storage.sync.get({
                disabledLists: await GenerateDefaultDisabledPlaylists(),
            })
        ).disabledLists as string[]) ?? [];
    return [Playlists, DisabledPlaylists];
}

export async function SliceShuffleList(currentIndex: number): Promise<number[]> {
    let shuffleList: number[] = (await chrome.storage.local.get({ shuffleList: [] })).shuffleList;
    const indexInShuffleList = shuffleList.findIndex((element: number) => element === currentIndex);
    shuffleList = shuffleList
        .slice(indexInShuffleList)
        .concat(shuffleList.slice(0, indexInShuffleList));
    await chrome.storage.local.set({ shuffleList: shuffleList });
    return shuffleList;
}
