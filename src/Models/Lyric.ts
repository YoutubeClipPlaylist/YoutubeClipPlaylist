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
    /**
     * 偏移時間 (s)
     */
    Offset: number;
}

export class Lyric implements ILyric {
    VideoId: string;
    StartTime: number;
    LyricId: number;
    Title: string;
    Offset: number;

    constructor(videoId: string, startTime: number, lyricId: number, title: string, offset = 0) {
        this.VideoId = videoId;
        this.StartTime = startTime;
        this.LyricId = lyricId;
        this.Title = title;
        this.Offset = offset;
    }
}
