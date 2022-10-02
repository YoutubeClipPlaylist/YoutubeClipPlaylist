export interface ILyric {
    /**
     * 歌詞ID
     */
    LyricId: number;
    /**
     * 歌曲啟始時間
     */
    StartTime: number;
    /**
     * 影片ID
     */
    VideoId: string;
    /**
     * 歌曲名稱
     */
    Title: string;
}

export class Lyric implements ILyric {
    LyricId: number;
    StartTime: number;
    VideoId: string;
    Title: string;

    constructor(lyricId: number, startTime: number, videoId: string, title: string) {
        this.LyricId = lyricId;
        this.StartTime = startTime;
        this.VideoId = videoId;
        this.Title = title;
    }
}
