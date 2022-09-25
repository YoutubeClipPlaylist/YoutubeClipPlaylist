export interface IPlaylist {
    name: string;
    name_display: string;
    tag: string[];
    route: string;
    maintainer: IMaintainer;
    singer: string;
}

export interface IMaintainer {
    name: string;
    url: string;
}
