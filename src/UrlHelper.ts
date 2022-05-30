export let urlParams: URLSearchParams = new URLSearchParams();

export async function prepareUrlParams(url: string): Promise<URLSearchParams> {
    // Save the url first, as parameters may be removed during WaitForDomLoaded (at Youtube)
    const urlSearch: string = new URL(url).search;

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
