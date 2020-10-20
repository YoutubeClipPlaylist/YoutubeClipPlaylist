// ==UserScript==
// @name     Youtube End Param Handler
// @version  v20.10.20.0
// @author   琳(jim60105)
// @homepage https://blog.maki0419.com/
// @grant    none
// @include  https://www.youtube.com/*
// @require https://github.com/jim60105/TampermonkeyScript/raw/main/QuonTamaPlaylist.js
// ==/UserScript==

(function() {
    'use strict';
    var player = document.getElementsByTagName('video')[0];

    if(window.location.href.indexOf("startplaylist")>=0){
        //playlist由@require載入
        var ele = playlist[0];
        var newParams = new URLSearchParams([
            ["v",ele[0]],
            ["t",ele[1]],
            ["end",ele[2]],
            ["shuffle",0]
        ]);
        document.location.href = "https://www.youtube.com/watch?"+newParams.toString();
    }

    let urlParams = new URLSearchParams(window.location.search);
    var shuffle = 0;
    if(urlParams.has('end')){
        if(urlParams.has('shuffle') && urlParams.get("shuffle") ==1){
            shuffle = 1;
        }
        var stopInterval = setInterval(function(){
            var flag = player.currentTime > urlParams.get('end');
            if(urlParams.get('end') <= 1) flag = false;
            if(player.ended) flag = true;

            if(flag){
                clearInterval(stopInterval);
                player.pause();
                console.log("PausePlayer");

                //Check playlist
                for(var i =0;i<playlist.length;i++){
                    var ele = playlist[i];
                    if(ele[0] == urlParams.get('v') && (ele[1]<=1 || ele[1] == urlParams.get('t')) && ele[2] == urlParams.get('end')){
                        if(shuffle){
                            ele = playlist[Math.floor(Math.random() * playlist.length)];
                        }else{
                            if(i==playlist.length-1) return;
                            ele = playlist[i+1];
                        }
                        var newParams = new URLSearchParams([
                            ["v",ele[0]],
                            ["t",ele[1]],
                            ["end",ele[2]],
                            ["shuffle",shuffle]
                        ]);
                        document.location.href = window.location.origin + window.location.pathname+'?'+newParams.toString();
                        break;
                    }
                }
            }
        }, 1000);
    }
})();


