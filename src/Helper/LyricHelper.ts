import { Message } from '../Models/Message';
import { ILyric, Lyric } from './../Models/Lyric';
import { ISong } from './../Models/Song';
import { player } from './DOMHelper';

const baseURL = 'https://raw.githubusercontent.com/YoutubeClipPlaylist/Lyrics/minify/';
let LyricList: ILyric[] = [];

async function LoadLyricsList(): Promise<ILyric[]> {
    const response = await fetch(baseURL + 'Lyrics.json');
    const json = (await response.json()) as [string, number, number, string, number][];
    const tempList: ILyric[] = [];

    json.forEach((input) => {
        const lyric: Lyric = new Lyric(...input);
        tempList.push(lyric);
    });
    return tempList;
}

export async function SearchLyricFromSong(song: ISong): Promise<ILyric | undefined> {
    if (!LyricList || !LyricList.length) LyricList = await LoadLyricsList();
    return (
        LyricList.find(
            (lyric) => lyric.VideoId === song.VideoID && lyric.StartTime === song.StartTime
        ) ?? undefined
    );
}

export async function LoadLyricContent(lyricId: number): Promise<string> {
    const response = await fetch(`${baseURL}Lyrics/${lyricId}.lrc`);
    return await response.text();
}

// https://www.cnblogs.com/Wayou/p/sync_lyric_with_html5_audio.html
export function ParseLyric(text: string) {
    //将文本分隔成一行一行，存入数组
    let lines = text.replaceAll('\\\n', '\n').split('\n'),
        //用于匹配时间的正则表达式，匹配的结果类似[xx:xx.xx]
        // eslint-disable-next-line prefer-const
        pattern = /\[\d{2}:\d{2}(.\d{1,5})?\]/g,
        //保存最终结果的数组
        // eslint-disable-next-line prefer-const
        result: [number, string][] = [];

    console.debug(lines);

    //去掉不含时间的行
    while (!pattern.test(lines[0])) {
        lines = lines.slice(1);
        if (lines.length === 0) {
            throw new Error("Can't find time in the lyric");
        }
    }
    //上面用'\n'生成生成数组时，结果中最后一个为空元素，这里将去掉
    lines[lines.length - 1].length === 0 && lines.pop();
    lines.forEach(function (v /*数组元素值*/, i /*元素索引*/, a /*数组本身*/) {
        //提取出时间[xx:xx.xx]
        // eslint-disable-next-line prefer-const
        const time = v.match(pattern);
        const value = v
            //提取歌词
            .replace(pattern, '')
            // 調整歌詞資訊常出現的簡體字
            .replace('词', '詞')
            .replace('编', '編')
            .replace('贝', '貝')
            .replace('乐', '樂')
            .replace('呗', '唄');
        if (time) {
            //因为一行里面可能有多个时间，所以time有可能是[xx:xx.xx][xx:xx.xx][xx:xx.xx]的形式，需要进一步分隔
            time.forEach(function (v1: string, i1: any, a1: any) {
                //去掉时间里的中括号得到xx:xx.xx
                const t = v1.slice(1, -1).split(':');
                //将结果压入最终数组
                result.push([parseInt(t[0], 10) * 60 + parseFloat(t[1]), value]);
            });
        }
    });
    //最后将结果数组中的元素按时间大小排序，以便保存之后正常显示歌词
    result.sort(function (a, b) {
        return a[0] - b[0];
    });
    return result;
}

export async function MakeLyricHelperUI(lyric: ILyric, track: TextTrack, cues: VTTCue[]) {
    if (process.env.NODE_ENV !== 'development') return;

    const offset = lyric.Offset;
    const range = 10;
    let _track = track;

    // Make UI
    document.getElementById('lyricHelper')?.remove();
    await fetch(chrome.runtime.getURL('/contentScript_lyricHelper.html'))
        .then((response) => response.text())
        .then((response) => {
            document.body.insertAdjacentHTML('beforeend', response);
        });
    const lyricHelperContainer = document.getElementById('lyricHelper') as HTMLDivElement;
    const rangeInput = lyricHelperContainer.getElementsByTagName('input')[0];
    const output = lyricHelperContainer.getElementsByTagName('output')[0];

    const btnSave = document.getElementById('btnSave') as HTMLButtonElement;
    const btnDump = document.getElementById('btnDump') as HTMLButtonElement;
    const btnReset = document.getElementById('btnReset') as HTMLButtonElement;
    const btnSubmit = document.getElementById('btnSubmit') as HTMLButtonElement;

    rangeInput.min = (offset - range).toString();
    rangeInput.max = (offset + range).toString();
    rangeInput.value = offset.toString();
    output.value = offset.toString();

    // Add listener
    rangeInput.oninput = rebuildTrack;
    btnSave.onclick = save;
    btnDump.onclick = async () => {
        const jsonText = await dump();
        navigator.clipboard.writeText(jsonText);
        console.log(jsonText);
    };
    btnReset.onclick = async () => {
        await clearCurrent();
        // input.value = offset.toString();
        await ReloadLastSong();
    };
    btnSubmit.onclick = async () => {
        const dumpText = await dump();
        const rawResponse = await fetch(
            'https://api.github.com/repos/YoutubeClipPlaylist/Lyrics/dispatches',
            {
                method: 'POST',
                headers: {
                    Accept: 'application/vnd.github+json',
                    Authorization:
                        'Bearer ' + (await chrome.storage.local.get('GITHUB_PAT')).GITHUB_PAT,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: JSON.stringify({
                    event_type: 'fetch_lyrics',
                    client_payload: {
                        lyrics: dumpText,
                    },
                }),
                redirect: 'follow',
            }
        );
        if (rawResponse.status === 204) {
            alert('Submit Success!');
            await chrome.storage.local.remove('Lyrics');
        } else if (rawResponse.status === 401 || rawResponse.status === 422) {
            console.warn('Validation failed when triggering github workflow!');
            window.open(
                'https://github.com/YoutubeClipPlaylist/Lyrics/issues/new?' +
                    new URLSearchParams({
                        title: '[Submit lyrics]',
                        body: '```\n' + dumpText + '\n```',
                    }),
                '_blank'
            );
        }
    };

    async function dump() {
        const lyrics = await save();
        const json: [string, number, number, string, number][] = [];
        lyrics.forEach((lyric) => {
            json.push([lyric.VideoId, lyric.StartTime, lyric.LyricId, lyric.Title, lyric.Offset]);
        });
        return JSON.stringify(json);
    }

    function rebuildTrack() {
        output.value = rangeInput.value;
        _track.mode = 'hidden';

        _track = player.addTextTrack('subtitles', 'Traditional Chinese', 'zh');

        for (let index = 0; index < cues.length; index++) {
            const cue = cues[index];
            const newCue = new VTTCue(
                cue.startTime - offset + parseFloat(rangeInput.value),
                cue.endTime - offset + parseFloat(rangeInput.value),
                cue.text
            );
            _track.addCue(newCue);
        }
        console.log('offset', rangeInput.value);
        // console.log('tracks', _track.cues);
        _track.mode = 'showing';
    }

    async function clearCurrent() {
        let lyrics = await ReadLyricsFromStorage();
        lyrics = lyrics.filter(
            (p) => p.VideoId !== lyric.VideoId || p.StartTime !== lyric.StartTime
        );
        await chrome.storage.local.set({ Lyrics: lyrics });
        return lyrics;
    }
    async function save() {
        const lyrics = await clearCurrent();

        const _lyric = Object.assign(lyric);
        _lyric.Offset = parseFloat(rangeInput.value);
        lyrics.push(_lyric);
        console.debug('Save to storage', lyrics);

        await chrome.storage.local.set({ Lyrics: lyrics });
        return lyrics;
    }
}

export async function ReadLyricsFromStorage() {
    const lyrics = ((await chrome.storage.local.get('Lyrics')).Lyrics ?? []) as ILyric[];
    console.debug('Get from storage', lyrics);
    return lyrics;
}

async function ReloadLastSong(): Promise<void> {
    await chrome.runtime.sendMessage(new Message('ReloadLastSong'));
}
