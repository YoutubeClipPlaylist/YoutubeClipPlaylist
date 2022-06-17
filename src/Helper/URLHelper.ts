export let url: URL = new URL('https://www.youtube.com/');
export let urlParams: URLSearchParams = url.searchParams;
export let baseURL = 'https://raw.githubusercontent.com/jim60105/Playlists/minify/';

export async function prepareUrlParams(urlString: string): Promise<URLSearchParams> {
    url = new URL(urlString);
    // Save the url first, as parameters may be removed during WaitForDomLoaded (at Youtube)
    const urlSearch: string = url.search;

    const search: string = (urlSearch.indexOf('startplaylist') >= 0)
        ? urlSearch
        : await GetFromStorage(urlSearch);
    urlParams = new URLSearchParams(search);
    CleanUpParameters();

    console.debug('Get URL: %o', url);
    console.debug('Get Search: %s', search);
    console.log('Get URLSearchParams: %s', urlParams.toString());
    return urlParams;
}

export function HasMonitoredParameters(_urlParams?: URLSearchParams): boolean {
    _urlParams = _urlParams || urlParams;
    return _urlParams.has('end')
        || _urlParams.has('startplaylist');
}

export async function RemoveFromStorage(): Promise<void> {
    await chrome.storage.local.remove('params');
    console.debug('Remove params from storage');
}

export async function SaveToStorage(_urlSearch?: string): Promise<void> {
    if (typeof _urlSearch === 'undefined') {
        _urlSearch = urlParams.toString();
    }
    console.debug('Save params to storage: %s', _urlSearch);
    await chrome.storage.local.set({ params: _urlSearch });
}

export async function GetFromStorage(defaultValue: string): Promise<string> {
    const result: string = (await chrome.storage.local.get({ params: defaultValue })).params;
    console.debug('Get params from storage: %s', result);
    return result;
}

export function CleanUpParameters(_urlParams?: URLSearchParams): URLSearchParams {
    _urlParams = _urlParams || urlParams;
    _urlParams.forEach(function (value, key) {
        switch (key) {
            case 't':
                //Youtube有時會自動在t後面帶上個s(秒)，在這裡把它去掉
                _urlParams?.set(key, value.replace('s', ''));
                break;
        }
    });

    // console.debug('Clean up URLSearchParams: %s', urlParams.toString());
    return _urlParams;
}

export async function SetBaseUrl(url: string): Promise<void> {
    await chrome.storage.local.set({ baseUrl: url });
    baseURL = url;
}

export async function GetBaseUrl(): Promise<string> {
    baseURL = (await chrome.storage.local.get({ baseUrl: 'https://raw.githubusercontent.com/jim60105/Playlists/minify/' })).baseUrl;
    return baseURL;
}
