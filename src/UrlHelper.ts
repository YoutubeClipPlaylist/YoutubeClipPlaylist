export let url:URL = new URL('https://www.youtube.com/');
export let urlParams: URLSearchParams = url.searchParams;

export async function prepareUrlParams(urlString: string): Promise<URLSearchParams> {
    url = new URL(urlString);
    // Save the url first, as parameters may be removed during WaitForDomLoaded (at Youtube)
    const urlSearch: string = url.search;

    const search: string = (urlSearch.indexOf('startplaylist') >= 0)
        ? urlSearch
        : await GetFromStorage(urlSearch);
    urlParams = new URLSearchParams(search);
    console.log('Get URL: %o', url);
    console.log('Get Search: %o', search);
    console.log('Get URLSearchParams: %o', urlParams);
    return urlParams;
}

export function HasMonitoredParameters(_urlParams?: URLSearchParams): boolean {
    _urlParams = _urlParams || urlParams;
    return _urlParams.has('end')
        || _urlParams.has('startplaylist');
}

export function SaveToStorage(): Promise<void> {
    return chrome.storage.local.set({ params: urlParams.toString() });
}

export async function GetFromStorage(defaultValue: string): Promise<string> {
    return (await chrome.storage.local.get({ params: defaultValue })).params;
}

export function CleanUpParameters(_urlParams?:URLSearchParams): URLSearchParams{
    _urlParams = _urlParams || urlParams;
    _urlParams.forEach(function (value, key) {
        switch (key) {
            case 't':
                //Youtube有時會自動在t後面帶上個s(秒)，在這裡把它去掉
                _urlParams?.set(key, value.replace('s', ''));
                break;
        }
    });
    
    console.debug(_urlParams.toString());
    return _urlParams;
}