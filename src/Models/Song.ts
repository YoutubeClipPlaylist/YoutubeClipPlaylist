export interface ISong {
    /**
     * 影片ID
     */
    VideoID: string;
    /**
     * 歌曲起始時間
     */
    StartTime: number;
    /**
     * 歌曲結束時間
     */
    EndTime: number;
    /**
     * 歌曲名稱
     */
    Title: string | undefined;
    /**
     * 字幕
     */
    SubSrc: string | undefined;
    /**
     * 歌手
     */
    Singer: string | undefined;
}

export class Song implements ISong {
    VideoID: string;
    StartTime: number;
    EndTime: number;
    Title: string | undefined;
    SubSrc: string | undefined;
    Singer: string | undefined;

    constructor(
        videoId: string,
        startTime: number,
        endTime: number,
        title?: string | undefined,
        subSrc?: string | undefined,
        singer?: string | undefined
    ) {
        this.VideoID = videoId;
        this.StartTime = startTime;
        this.EndTime = endTime;
        this.Title = title;
        this.SubSrc = subSrc;
        this.Singer = singer;
    }
}
