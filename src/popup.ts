/* eslint-disable @typescript-eslint/no-unused-vars */
// import { Button } from "bootstrap";
import { IPlaylist } from './Models/IPlaylist';
import { Message } from './Models/Message';
import * as UrlHelper from './Helper/URLHelper';

(async () => {
    const Playlists =
        ((await chrome.storage.local.get('Playlists')).Playlists as IPlaylist[]) ?? [];
    const DisabledPlaylists =
        ((await chrome.storage.local.get('disabledLists')).disabledLists as string[]) ?? [];

    await GetBaseUrl();
    MakeList();
    AddEventListener();

    async function GetBaseUrl() {
        (document.getElementById('baseUrl') as HTMLInputElement).value =
            await UrlHelper.GetBaseUrl();
    }

    function MakeList() {
        const container = document.getElementById('PlayListContainer') as HTMLDivElement;
        const listTemplate = document.getElementById('listTemplate') as HTMLTemplateElement;
        container.innerHTML = '';

        Playlists.forEach((playlist) => {
            const clone = document.importNode(listTemplate.content, true);
            const label = clone.querySelector('label');
            const labelText = clone.querySelector('[name="labelText"]');
            const disabledIcon = clone.querySelector('[name="disabled"]');
            if (!labelText || !disabledIcon || !label) {
                return;
            }
            labelText.textContent = playlist.name;

            if (!DisabledPlaylists.includes(playlist.name)) {
                // Enabled
                label.classList.remove('disabled');
                disabledIcon.classList.add('invisible');
                label.addEventListener('click', StartPlaylistClickEvent);
            } else {
                // Disabled
                label.classList.add('disabled');
                disabledIcon.classList.remove('invisible');
                label.removeEventListener('click', StartPlaylistClickEvent);
            }

            container.appendChild(clone);
        });
    }

    function AddEventListener() {
        document.getElementById('edit')?.addEventListener('click', EditClickEvent);
        document.getElementById('editDone')?.addEventListener('click', EditDoneClickEvent);
    }

    // Start editing button
    async function EditClickEvent(event: MouseEvent) {
        const container = document.getElementById('PlayListContainer') as HTMLDivElement;
        MakeList();

        document.getElementById('baseUrlContainer')?.classList.remove('invisible');
        document.getElementById('editDone')?.classList.remove('d-none');
        document.getElementById('edit')?.classList.add('d-none');

        container.querySelectorAll('label').forEach((label) => {
            label.classList.remove('disabled');
            label.removeEventListener('click', StartPlaylistClickEvent);
            label.addEventListener('click', DisableClickEvent);
        });
    }

    // Finish editing button
    async function EditDoneClickEvent(event: MouseEvent) {
        await chrome.storage.local.set({ disabledLists: DisabledPlaylists });
        await UrlHelper.SetBaseUrl((document.getElementById('baseUrl') as HTMLInputElement).value);
        await chrome.runtime.sendMessage(new Message('FetchPlaylists'));

        document.getElementById('baseUrlContainer')?.classList.add('invisible');
        document.getElementById('editDone')?.classList.add('d-none');
        document.getElementById('edit')?.classList.remove('d-none');

        MakeList();
    }

    async function StartPlaylistClickEvent(event: MouseEvent): Promise<void> {
        const label = event.currentTarget as HTMLLabelElement;
        const labelText = label.getElementsByTagName('span')[0];
        if (!labelText) return;

        const url = new URL(
            `https://www.youtube.com/?startplaylist&playlist=${labelText.innerHTML}`
        );
        const shuffle = document.getElementById('shuffle')?.classList.contains('active');
        if (shuffle) {
            url.searchParams.set('shuffle', '1');
            await chrome.runtime.sendMessage(new Message('LoadPlaylists', url.href));
            await chrome.runtime.sendMessage(new Message('StepShuffle'));
        } else {
            await chrome.runtime.sendMessage(new Message('LoadPlaylists', url.href));
            await chrome.runtime.sendMessage(
                new Message('NextSongToBackground', { index: 0, UIClick: false })
            );
        }
        window.close();
    }

    async function DisableClickEvent(event: MouseEvent) {
        const label = event.currentTarget as HTMLLabelElement;
        const labelText = label.getElementsByTagName('span')[0];
        const disabledIcon = label.getElementsByTagName('i')[0];
        const container = document.getElementById('PlayListContainer') as HTMLDivElement;
        if (!labelText || !container || !disabledIcon) return;

        if (!(await EditDisabledPlaylists(labelText.innerHTML))) {
            // Not disabled
            label.classList.remove('disabled');
            disabledIcon.classList.add('invisible');
        } else {
            // Disabled
            disabledIcon.classList.remove('invisible');
        }

        async function EditDisabledPlaylists(playlistName: string): Promise<boolean> {
            const include = DisabledPlaylists.includes(playlistName);
            if (include) {
                DisabledPlaylists.splice(DisabledPlaylists.indexOf(playlistName), 1);
            } else {
                DisabledPlaylists.push(playlistName);
            }
            await chrome.storage.local.set({ disabledLists: DisabledPlaylists });
            return !include;
        }
    }
})();
