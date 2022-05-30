export interface IPlaylist {
    name: string;
    tag: string[];
    route: string;
    maintainer: IMaintainer;
}
export interface IMaintainer {
    name: string;
    url: string;
}
