(function () {
    if (window.location.pathname == "/live_chat_replay") return;

    chrome.storage.local.get(['params'], function(result) {
        let urlParams = new URLSearchParams(window.location.search);
        if (!result) {
            urlParams = new URLSearchParams(result);
            // chrome.storage.local.remove(['params']);
        }
        
        if (urlParams.has('end') || urlParams.has('startplaylist')) {
            // start
            chrome.runtime.sendMessage('Start Youtube Clip Playlist!', function (response) {
                if (!response.success) {
                    console.log('Error when sending urlParams to background.js');
                    console.error(response);
                }
            });
        } 
    });
})();