(function () {
    let urlParams;
    let DisabledPlaylists = [];
    let MenuLists = {};
    let shuffle = false;
    let shuffleList = [];

    let Playlists = {};
    let LoadedCount = 0;
    let LoadedPlaylists = new Map();
    let player;
    let waitDOMInterval;
    let plBox;

    fetch('https://github.com/jim60105/Playlists/raw/minify/Playlists.jsonc')
        .then(response => response.json())
        .then(json => Playlists = json);

    chrome.runtime.onMessage.addListener(async function (message, sender, sendResponse) {
        if (message && message === 'Start Youtube Clip Playlist!') {
            console.log('Message received from contentScript.js: ' + message);

            urlParams = await GetParams(sender.url);
            if (hasParam(urlParams)) {
                await getStorageLists();
                Load();
            }
        }

        async function GetParams(_params) {
            _result = await chrome.storage.local.get(['params']);
            chrome.storage.local.remove(['params']);
            return new URLSearchParams(new URL(_result.params ?? _params).search);
        }

        const hasParam = _urlParams => _urlParams.has('end')
                                    || _urlParams.has('startplaylist');

        function getStorageLists() {
            let promises = [
                chrome.storage.local.get(['disabledLists'])
                    .then(_result => DisabledPlaylists = _result.disabledLists),
                chrome.storage.local.get(['shuffleList'])
                    .then(_result => shuffleList = _result.shuffleList)
            ];
            return Promise.all(promises);
        }
    });

    function Load() {
        shuffle = urlParams.has('shuffle') && urlParams.get('shuffle') != 0;
        console.log('Shuffle: %o', shuffle);

        console.log('START!!');
        console.log(Playlists);

    }

})();