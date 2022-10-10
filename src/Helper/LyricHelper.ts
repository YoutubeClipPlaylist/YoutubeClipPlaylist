import { ILyric, Lyric } from './../Models/Lyric';
import { ISong } from './../Models/Song';

const baseURL = 'https://raw.githubusercontent.com/jim60105/Lyrics/minify/';
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
