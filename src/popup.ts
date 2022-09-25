/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { IPlaylist } from './Models/Playlist';
import { Message } from './Models/Message';
import { SetBaseUrl, GetBaseUrl, SaveToStorage } from './Helper/URLHelper';
import { ReadPlaylistsFromStorage } from './Helper/PlaylistHelper';
import { SetStorageWidthHeight, GetStorageWidthHeight } from './Helper/DOMHelper';
import Toast from 'bootstrap/js/dist/toast';

(async () => {
    const [Playlists, DisabledPlaylists] = await ReadPlaylistsFromStorage();

    MakeList();
    await InitSettingForm();
    AddEventListener();
    SetupI18nStrings();

    function SetupI18nStrings() {
        document
            .getElementsByName('shuffle')
            .forEach((element) => (element!.title = chrome.i18n.getMessage('shuffle')));
        document
            .getElementsByName('play')
            .forEach((element) => (element!.title = chrome.i18n.getMessage('play')));
        document
            .getElementsByName('edit')
            .forEach((element) => (element!.title = chrome.i18n.getMessage('edit')));
        document
            .getElementsByName('editDone')
            .forEach((element) => (element!.title = chrome.i18n.getMessage('editDone')));

        // Settings
        document.getElementById('widthHelp')!.innerHTML = chrome.i18n.getMessage('widthHelp');
        document.getElementById('heightHelp')!.innerHTML = chrome.i18n.getMessage('heightHelp');
        document.getElementById('playlistSourceHelp')!.innerHTML =
            chrome.i18n.getMessage('playlistSourceHelp');
        document.getElementById('UIWidth')!.innerHTML = chrome.i18n.getMessage('UIWidth');
        document.getElementById('UIHeight')!.innerHTML = chrome.i18n.getMessage('UIHeight');
        document.getElementById('baseUrlTitle')!.innerHTML = chrome.i18n.getMessage('baseUrlTitle');
        document.getElementById('submitForm')!.innerHTML = chrome.i18n.getMessage('submitForm');
        document.getElementById('savedToast')!.innerHTML = chrome.i18n.getMessage('savedToast');
    }

    function MakeList() {
        const playlistContainer = document.getElementById('Playlists') as HTMLDivElement;
        const singerContainer = document.getElementById('Singers') as HTMLDivElement;
        const listTemplate = document.getElementById('listTemplate') as HTMLTemplateElement;
        playlistContainer.innerHTML = '';
        singerContainer.innerHTML = '';

        const singer: string[] = [];

        Playlists.forEach((playlist) => {
            const clone = document.importNode(listTemplate.content, true);
            const label = clone.querySelector('label');
            const labelText = clone.querySelector('[name="labelText"]');
            const disabledIcon = clone.querySelector('[name="disabled"]');
            if (!labelText || !disabledIcon || !label) {
                return;
            }
            labelText.textContent = playlist.name_display ?? `${playlist.singer} ${playlist.name}`;

            if (!DisabledPlaylists.includes(playlist.name)) {
                // Enabled
                label.classList.remove('disabled');
                disabledIcon.classList.add('invisible');
                label.addEventListener('click', StartPlaylistClickEvent);

                if (!singer.includes(playlist.singer)) {
                    singer.push(playlist.singer);
                }
            } else {
                // Disabled
                label.classList.add('disabled');
                disabledIcon.classList.remove('invisible');
                label.removeEventListener('click', StartPlaylistClickEvent);
            }

            playlistContainer.appendChild(clone);
        });

        // Hint
        [...document.getElementById('Playlists')!.querySelectorAll('label')].forEach((element) => {
            element.title = chrome.i18n.getMessage('listItem');
        });

        singer.forEach((singer) => {
            const clone = document.importNode(listTemplate.content, true);
            const label = clone.querySelector('label');
            const labelText = clone.querySelector('[name="labelText"]');
            const disabledIcon = clone.querySelector('[name="disabled"]');
            if (!labelText || !disabledIcon || !label) {
                return;
            }
            labelText.textContent = singer;

            disabledIcon.classList.add('invisible');
            label.addEventListener('click', StartSingerClickEvent);

            singerContainer.appendChild(clone);
        });

        // Hint
        [...document.getElementById('Singers')!.querySelectorAll('label')].forEach((element) => {
            element.title = chrome.i18n.getMessage('listItem');
        });
    }

    function AddEventListener() {
        document
            .getElementsByName('edit')
            .forEach((element) => element?.addEventListener('click', EditClickEvent));
        document
            .getElementsByName('editDone')
            .forEach((element) => element?.addEventListener('click', EditDoneClickEvent));
        document
            .getElementsByName('play')
            .forEach((element) => element?.addEventListener('click', StartPlaylistClickEvent));
    }

    // Start editing button
    async function EditClickEvent(event: MouseEvent) {
        const container = document.getElementById('Playlists') as HTMLDivElement;
        MakeList();

        document.getElementsByName('play').forEach((element) => element?.classList.add('disabled'));
        document
            .getElementsByName('editDone')
            .forEach((element) => element?.classList.remove('d-none'));
        document.getElementsByName('edit').forEach((element) => element?.classList.add('d-none'));

        container.querySelectorAll('label').forEach((label) => {
            label.classList.remove('disabled');
            label.removeEventListener('click', StartPlaylistClickEvent);
            label.addEventListener('click', DisableClickEvent);
        });
    }

    // Finish editing button
    async function EditDoneClickEvent(event: MouseEvent) {
        await chrome.storage.sync.set({ disabledLists: DisabledPlaylists });
        await SetBaseUrl((document.getElementById('baseUrl') as HTMLInputElement).value);
        await chrome.runtime.sendMessage(new Message('FetchPlaylists'));

        document
            .getElementsByName('play')
            .forEach((element) => element?.classList.remove('disabled'));
        document
            .getElementsByName('editDone')
            .forEach((element) => element?.classList.add('d-none'));
        document
            .getElementsByName('edit')
            .forEach((element) => element?.classList.remove('d-none'));

        window.location.reload();
    }

    async function StartPlaylistClickEvent(event: MouseEvent): Promise<void> {
        const url = new URL(`https://www.youtube.com/?startplaylist`);

        const label = event.currentTarget as HTMLLabelElement | null;
        const labelText = label?.getElementsByTagName('span')[0];
        if (labelText && labelText.textContent) {
            url.searchParams.set(
                'playlist',
                (await GetPlaylistFromDisplayName(labelText.textContent))?.name ?? ''
            );
        }

        const shuffle = document.getElementsByName('shuffle')[0]?.classList.contains('active');
        if (shuffle) {
            url.searchParams.set('shuffle', '1');
        } else {
            url.searchParams.delete('shuffle');
        }

        await chrome.runtime.sendMessage(new Message('LoadPlaylists', url.href));
        SaveToStorage(url.search);

        if (shuffle) {
            const shuffleList: number[] = (await chrome.storage.local.get({ shuffleList: [] }))
                .shuffleList;
            await chrome.runtime.sendMessage(
                new Message('NextSongToBackground', { index: shuffleList[0], UIClick: false })
            );
        } else {
            await chrome.runtime.sendMessage(
                new Message('NextSongToBackground', { index: 0, UIClick: false })
            );
        }
        window.close();
    }

    async function StartSingerClickEvent(event: MouseEvent): Promise<void> {
        const url = new URL(`https://www.youtube.com/?startplaylist`);

        const label = event.currentTarget as HTMLLabelElement | null;
        const labelText = label?.getElementsByTagName('span')[0];
        if (labelText) {
            url.searchParams.set('playlistinclude', labelText.innerHTML);
        }

        const shuffle = document.getElementsByName('shuffle')[1]?.classList.contains('active');
        if (shuffle) {
            url.searchParams.set('shuffle', '1');
        } else {
            url.searchParams.delete('shuffle');
        }

        await chrome.runtime.sendMessage(new Message('LoadPlaylists', url.href));
        SaveToStorage(url.search);

        if (shuffle) {
            const shuffleList: number[] = (await chrome.storage.local.get({ shuffleList: [] }))
                .shuffleList;
            await chrome.runtime.sendMessage(
                new Message('NextSongToBackground', { index: shuffleList[0], UIClick: false })
            );
        } else {
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
        const container = document.getElementById('Playlists') as HTMLDivElement;
        if (!labelText || !labelText.textContent || !container || !disabledIcon) return;

        const disabled = await EditDisabledPlaylists(
            (await GetPlaylistFromDisplayName(labelText.textContent))?.name ?? ''
        );
        if (null !== disabled)
            if (!disabled) {
                // Not disabled
                label.classList.remove('disabled');
                disabledIcon.classList.add('invisible');
            } else {
                // Disabled
                disabledIcon.classList.remove('invisible');
            }

        /**
         * Toggle the disabled state of the playlist
         * @param playlistName
         * @returns true if Disabled. or false if not disabled. Null if playlistName is empty
         */
        async function EditDisabledPlaylists(playlistName: string): Promise<boolean | null> {
            if (!playlistName) return null;

            const include = DisabledPlaylists.includes(playlistName);
            if (include) {
                // Enabled (Remove from disabled list)
                DisabledPlaylists.splice(DisabledPlaylists.indexOf(playlistName), 1);
            } else {
                // Disabled
                DisabledPlaylists.push(playlistName);
            }
            await chrome.storage.sync.set({ disabledLists: DisabledPlaylists });
            return !include;
        }
    }

    async function GetPlaylistFromDisplayName(display: string): Promise<IPlaylist | null> {
        const [LoadPlaylists] = await ReadPlaylistsFromStorage();
        const playlist = LoadPlaylists.find((p) => p.name_display === display);
        if (playlist && playlist.name) {
            return playlist;
        }

        return null;
    }

    async function InitSettingForm() {
        [
            (document.getElementById('width') as HTMLInputElement).value,
            (document.getElementById('height') as HTMLInputElement).value,
        ] = await GetStorageWidthHeight();

        (document.getElementById('baseUrl') as HTMLInputElement).value = await GetBaseUrl();

        (document.getElementById('submitForm') as HTMLButtonElement).addEventListener(
            'click',
            async (e) => {
                await SetStorageWidthHeight(
                    (document.getElementById('width') as HTMLInputElement).value,
                    (document.getElementById('height') as HTMLInputElement).value
                );
                await SetBaseUrl((document.getElementById('baseUrl') as HTMLInputElement).value);
                InitSettingForm();

                const toast = new Toast(document.getElementById('toast') as Element);
                toast.show();
            }
        );
    }
})();
