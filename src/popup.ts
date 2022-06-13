import { IPlaylist } from './Models/IPlaylist';
import bootstrap from 'bootstrap';
import { Message } from './Models/Message';

(async () => {
    const Playlists = (await chrome.storage.local.get('Playlists')).Playlists as IPlaylist[] ?? [];
    const DisabledPlaylists = (await chrome.storage.local.get('disabledLists')).disabledLists as string[] ?? [];
    makeList(Playlists, DisabledPlaylists);
})();

function makeList(playlists: IPlaylist[], disabledPlaylists: string[]) {
    const ul = document.getElementById('PlayListContainer') as HTMLUListElement;
    const liTemplate = document.getElementById('liTemplate') as HTMLTemplateElement;
    playlists.forEach(playlist => {
        const liText = liTemplate.content.querySelector('[name="liText"]');
        if (liText) {
            liText.textContent = playlist.name;
            if (disabledPlaylists.includes(playlist.name)) {
                liText.classList.add('list-group-item-secondary');
            }
        }
        // const badge = liTemplate.content.querySelector('[name="badge"]');
        // if (badge) {
        //     badge.textContent = '' + 234;
        // }

        const clone = document.importNode(liTemplate.content, true);
        const li = clone.querySelector('li');
        li?.addEventListener('click', async (event) => {
            const url = new URL(`https://www.youtube.com/?startplaylist&playlist=${playlist.name}`);
            await chrome.runtime.sendMessage(new Message('LoadPlaylists', url.href));
            await chrome.runtime.sendMessage(new Message('NextSongToBackground', { 'index': 0, 'UIClick': false }));
            window.close();
        });
        ul.appendChild(clone);
    });
}