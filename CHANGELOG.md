# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [16.0.2] - 2025-12-28

### Changed

- Changed: Remove OneDrive from extension descriptions in all locales (English, Japanese, Traditional Chinese) and package.json

## [16.0.1] - 2025-12-28

### Changed

- Changed: Consolidate CI/CD workflows into single build and release pipeline
- Changed: Merge Publish.yml and Upload.yml into unified build.yml workflow
- Changed: Remove Chrome Web Store upload and publish jobs due to integration issues
- Changed: Retain build functionality with artifact generation and build provenance attestation
- Changed: Add GitHub release creation for tagged versions
- Changed: Update permissions to allow contents write for release creation

### Fixed

- Fixed: Normalize links and fix Markdown examples in documentation
- Fixed: Wrap playlist link conversion tool URL in angle brackets in changelog
- Fixed: Update README article link to xn--jgy.tw URL
- Fixed: Correct Markdown example blockquote and emphasis formatting

## [16.0.0] - 2025-12-28

### Removed

- Removed: OneDrive and SharePoint video playback support (BREAKING CHANGE)
- Removed: OneDrive and SharePoint URL patterns from manifest
- Removed: OneDrive parameter storage logic and URL generation
- Removed: OneDrive videojs handling from DOM helper
- Removed: 'onedrive' from default disabled tags

### Changed

- Changed: Updated README.md to remove OneDrive badge and references
- Changed: Updated AGENTS.md project description

## [15.2.9] - 2025-12-28

### Changed

- Changed: Update GitHub Actions to latest major versions (checkout v4→v6, setup-node v4→v6, upload-artifact v3→v6, download-artifact v3→v7, action-gh-release v1→v2)
- Changed: Updated Playlists submodule to commit 3882307

### Security

- Security: Add SLSA build provenance attestations for Chrome extension artifacts to improve supply chain security

## [15.2.8] - 2025-12-28

### Added

- Added: Comprehensive AI agent instructions file (AGENTS.md) with project overview, repository structure, technology stack, build instructions, code style conventions, and architecture notes

### Changed

- Changed: Updated Lyrics submodule to commit ed97b138efe860a8d94d081994e9c51903b24e80
- Changed: Updated Playlists submodule to commit ff1e89f

### Security

- Security: Fixed 12 security vulnerabilities (1 low, 6 moderate, 5 high) by updating dependencies
- Security: Updated webpack from 5.84.1 to 5.104.1
- Security: Updated semver from 7.5.1 to 7.7.3
- Security: Updated braces from 3.0.2 to 3.0.3
- Security: Updated cross-spawn from 7.0.3 to 7.0.6
- Security: Updated tar from 6.1.15 to 6.2.1
- Security: Updated serialize-javascript from 6.0.1 to 6.0.2
- Security: Updated nanoid from 3.3.6 to 3.3.11
- Security: Updated js-yaml from 4.1.0 to 4.1.1
- Security: Updated micromatch from 4.0.5 to 4.0.8
- Security: Updated multiple @webassemblyjs packages and other dependencies

## [15.2.7] - 2024-08-10

### Changed

- Changed: Remove the "Youtube" in title

## [15.2.6] - 2023-12-10

### Changed

- Changed: Update GitHub Actions to latest versions
- Changed: Refactor code based on CodeFactor suggestions

## [15.2.5] - 2023-12-10

### Changed

- Changed: Change LICENSE to GPLv3
- Changed: Update README.md
- Changed: Apply CodeFactor fixes

### Security

- Security: Bump postcss from 8.4.24 to 8.4.31

## [15.2.4] - 2023-09-28

### Changed

- Changed: Change extension icon

## [15.2.3] - 2023-08-15

### Security

- Security: Bump word-wrap from 1.2.3 to 1.2.5

## [15.2.2] - 2023-05-30

### Changed

- Changed: Update node-sass to v8.0.0

### Security

- Security: Bump webpack from 5.74.0 to 5.76.0

## [15.2.1] - 2023-02-21

### Changed

- Changed: Update README.md

### Security

- Security: Bump http-cache-semantics from 4.1.0 to 4.1.1

## [15.2.0] - 2022-11-16

### Fixed

- Fixed: Improve compatibility with non-standard LRC files

## [15.1.0] - 2022-11-04

### Fixed

- Fixed: Trim lyrics content

## [15.0.0] - 2022-11-04

### Added

- Added: Media key previoustrack support

### Changed

- Changed: CSS adjustments

## [14.2.0] - 2022-11-03

### Fixed

- Fixed: YouTube new UI chat message box collapse issue
- Fixed: Hide lyricHelper when hiding UI

## [14.1.0] - 2022-10-28

### Added

- Added: Submit button to LyricHelper

### Changed

- Changed: Move project to Organization
- Changed: Adjust LyricHelper Dump button JSON output format

## [14.0.0] - 2022-10-27

### Added

- Added: LyricHelper feature for editing and submitting lyrics

## [13.7.0] - 2022-10-26

### Changed

- Changed: Accept lyrics timing with only one decimal place
- Changed: Update README.md and pictures

## [13.6.0] - 2022-10-23

### Fixed

- Fixed: Adjust commonly appearing simplified Chinese in lyrics info

## [13.5.0] - 2022-10-22

### Fixed

- Fixed: Handle LyricId less than 0

## [13.4.0] - 2022-10-16

### Added

- Added: Close YouTube chat message box feature

### Fixed

- Fixed: Clear LRC subtitles when exiting

## [13.3.0] - 2022-10-11

### Fixed

- Fixed: Fix jim60105/Lyrics#9

## [13.2.0] - 2022-10-10

### Added

- Added: Offset support for lyrics

### Changed

- Changed: Update submodules

## [13.1.0] - 2022-10-06

### Fixed

- Fixed: Lyrics functionality improvements

## [13.0.0] - 2022-10-02

### Added

- Added: Automatic lyrics feature
- Added: Git submodule for Lyrics repository

## [12.21.0] - 2022-09-26

### Added

- Added: LRC lyrics file support
- Added: WebVTT offset support

### Changed

- Changed: Rewrite WebVTT offset handling
- Changed: Update submodule

## [12.20.0] - 2022-09-26

### Added

- Added: Settings page
- Added: Singer tab to popup

### Changed

- Changed: Discard bootstrap.min.js.map and bootstrap.min.css.map from build

## [12.19.3] - 2022-09-25

### Changed

- Changed: Popup now shows playlist display name instead of filename

## [12.19.2] - 2022-09-24

### Changed

- Changed: Update Chrome Web Store publishing GitHub workflow

## [12.19.1] - 2022-09-24

### Fixed

- Fixed: Share link error when in shuffle mode
- Fixed: Update README.md

## [12.19.0] - 2022-09-24

### Fixed

- Fixed: Twitcasting not starting playback
- Fixed: Google Drive to YouTube t parameter error
- Fixed: OneDrive redirect searchParam storage logic causing issues on other pages

## [12.18.0] - 2022-09-24

### Added

- Added: Share link startup logic

### Changed

- Changed: CSS adjustments

## [12.17.0] - 2022-09-23

### Added

- Added: Share link logic
- Added: UI filter logic
- Added: UI toggle animation
- Added: Option panel UI

## [12.16.0] - 2022-09-22

### Added

- Added: ISong interface definition
- Added: Singer name display in UI

## [12.15.2] - 2022-09-22

### Changed

- Changed: Separate UI HTML and CSS into files
- Changed: Add singer info to Playlists (Resolved #52)

## [12.15.1] - 2022-09-21

### Fixed

- Fixed: Twitcasting not auto-playing (make it load before playing)

## [12.15.0] - 2022-09-21

### Fixed

- Fixed: Twitcasting not auto-playing
- Fixed: Missing "allow autoplay" URLs
- Fixed: Exit when YouTube embed iframe is embedded in other pages
- Fixed: Playlist parameter disappears when auto-playing next song (Fix #46)

### Changed

- Changed: Update README.md

## [12.14.1] - 2022-09-10

### Fixed

- Fixed: Playlist name parameter lost when playing next song (fix #45)
- Fixed: Sometimes not stopping at end or not playing next song

## [12.14.0] - 2022-09-10

### Fixed

- Fixed: OneDrive video time now passed as parameter (fix #44)

## [12.13.1] - 2022-09-09

### Security

- Security: Bump terser from 5.13.1 to 5.15.0

## [12.13.0] - 2022-09-09

### Fixed

- Fixed: Playlist UI sometimes disappearing
- Fixed: Popup Shuffle state lost (fix #43)

## [12.12.3] - 2022-06-25

### Fixed

- Fixed: DisabledPlaylist not properly initialized when changing versions

## [12.12.2] - 2022-06-25

### Fixed

- Fixed: Reload playlist when myPlaylist content doesn't exist

## [12.12.0] - 2022-06-25

### Changed

- Changed: Split GitHub workflow release and upload, changed to upload instead of publish

### Fixed

- Fixed: Twitcasting parameters being overwritten on auto NextSong
- Fixed: Error when playing sequentially to last song
- Fixed: UI window repeatedly popping up on startup
- Fixed: Playlist resetting when playing next song (fix #29)

## [12.11.0] - 2022-06-22

### Added

- Added: Default disabled playlists feature

### Changed

- Changed: Popup reloads after changing BaseUrl (#21)
- Changed: Use default value when BaseUrl is not entered
- Changed: Description text adjustments
- Changed: Minor animation adjustments for playlist toggle

## [12.10.3] - 2022-06-18

### Changed

- Changed: Description text adjustments

## [12.10.2] - 2022-06-18

### Changed

- Changed: Clean up locales

## [12.9.0] - 2022-06-18

### Fixed

- Fixed: TabId incorrectly reset when closing other tabs

### Added

- Added: Japanese localization

### Changed

- Changed: Update README.md and NOTICE

## [12.8.0] - 2022-06-18

### Added

- Added: Chrome Extension style i18n support
- Added: Official release

### Changed

- Changed: Update README.md and pictures

## [12.7.0] - 2022-06-18

### Added

- Added: Popup "Play All" button
- Added: Demo picture

## [12.6.0] - 2022-06-17

### Added

- Added: Popup shuffle functionality
- Added: popup.css

### Fixed

- Fixed: Not correctly catching /live_chat_replay
- Fixed: YouTube removing t=0 parameter causing CheckList() to fail

## [12.5.4] - 2022-06-17

### Changed

- Changed: Update icon

### Fixed

- Fixed: Icon error

## [12.5.3] - 2022-06-17

### Changed

- Changed: Change Upload to Chrome Web Store action

## [12.5.2] - 2022-06-17

### Fixed

- Fixed: SyntaxError: Unexpected number

## [12.5.1] - 2022-06-17

### Added

- Added: ESLint & Prettier integration
- Added: Write git tag version into manifest.json / package.json in GitHub workflow CI

## [12.5.0] - 2022-06-17

### Added

- Added: Popup UI editing functionality
- Added: Enable upload CI to Chrome Web Store

## [12.4.0] - 2022-06-16

### Fixed

- Fixed: Not correctly cleaning up when clicking other videos in YouTube
- Fixed: CheckList() no longer validates end
- Fixed: Don't clean up when player.currentTime is set to 0

## [12.3.1] - 2022-06-16

### Changed

- Changed: Configure Source map and organize dist folder

## [12.3.0] - 2022-06-15

### Changed

- Changed: Wait one second before registering the "DoOnVideoChange" event listener
- Changed: Remove "activeTab" permission as it is not required
- Changed: Stop "Upload to Chrome Web Store" CD action before Chrome Web Store approval

### Fixed

- Fixed: Handle tabId not found exception

## [12.2.0] - 2022-06-14

### Fixed

- Fixed: Handle "DOMException: The play() request was interrupted by a call to pause()"
- Fixed: Use vjs for time control in OneDrive
- Fixed: Program executing in live_chat_replay
- Fixed: Clean up params in storage after read
- Fixed: CheckList() executing before player starts playing

## [12.1.1] - 2022-06-14

### Changed

- Changed: Cursor changed to pointer on popup

### Fixed

- Fixed: TabId abnormality causing repeated new tab opening on next song

## [12.1.0] - 2022-06-14

### Added

- Added: Popup UI click to start
- Added: Playlist parameter to play specific playlist
- Added: npm webpack plugin minifier for HTML & JSON
- Added: NOTICE, LICENSE, README.md to dist

## [12.0.5] - 2022-06-13

### Added

- Added: CI publish workflow
- Added: Rewrite project to TypeScript
- Added: Chrome Extension support

### Changed

- Changed: Complete TypeScript rewrite
- Changed: Refactor DOMHelper, addListener, logging, and bug handling
- Changed: Refactor urlParams
- Changed: Load ASS JS
- Changed: Change from Promise to async/await
- Changed: Chrome extension and complete urlSearchParams parsing

### Fixed

- Fixed: Google Drive functionality (iframe related)

## [11.8.0] - 2022-02-25

### Added

- Added: Extension icon

### Changed

- Changed: Update Playlist submodule

## [11.7.0] - 2022-01-10

### Fixed

- Fixed: Cannot jump when there's only one song
- Fixed: OneDrive not correctly redirecting recently

### Changed

- Changed: Update README.md and submodule

## [11.5.0] - 2021-06-23

### Fixed

- Fixed: Menu button shuffle error

## [11.4.0] - 2021-06-22

### Fixed

- Fixed: Hash-related playlist matching

## [11.3.0] - 2021-06-22

### Fixed

- Fixed: Twitcasting links without # not loading

### Changed

- Changed: Update README.md and submodule

## [11.2.0] - 2021-06-22

### Added

- Added: Support for Twitcasting multi-video archive playback

### Fixed

- Fixed: ID with hash not handled

### Changed

- Changed: Update README.md

## [11.1.0] - 2021-06-19

### Changed

- Changed: Pass URL for matching when comparing playlists, simplifying single song startup link

### Changed

- Changed: Update README.md

## [11.0.0] - 2021-06-19

### Added

- Added: Twitcasting (ツイキャス) support

## [10.3.0] - 2021-06-14

### Fixed

- Fixed: PlaylistContainer being repeatedly initialized
- Fixed: WaitDOM not working correctly
- Fixed: ShuffleList reconstruction logic
- Fixed: ShuffleList behavior when UI clicked

### Changed

- Changed: Fixed playlist order
- Changed: Added version notes

## [10.2.0] - 2021-06-10

### Fixed

- Fixed: Bug typo
- Fixed: OneDrive UI issues

## [10.1.0] - 2021-06-08

### Fixed

- Fixed: YouTube not correctly clearing program parameters when changing videos

## [10.0.0] - 2021-03-19

### Added

- Added: OneDrive support
- Added: OneDrive URL pattern and playlist URL matching
- Added: Params handling

### Changed

- Changed: Update README.md

### Fixed

- Fixed: Parameter merging error
- Fixed: Use GM_setValue to solve OneDrive redirect issue

## [9.3.0] - 2021-03-07

### Fixed

- Fixed: Issue caused by YouTube auto-removing extra parameters since early March

### Changed

- Changed: Update README and pics

## [9.2.0] - 2021-02-08

### Added

- Added: Exclude and Include functions can now pass multiple tags separated by underscore "_"

## [9.1.0] - 2021-02-08

### Added

- Added: "StartPlaylist" menu button

### Fixed

- Fixed: Typo

## [9.0.0] - 2021-02-06

### Added

- Added: Top-right menu bar with shuffle mode toggle
- Added: "Disable playlist" feature in menu bar
- Added: Shuffle mode now inserts finished songs at playlist end instead of removing

### Changed

- Changed: Update README.md

### Fixed

- Fixed: Playlist downloading even when not in playlist mode on YouTube

## [8.0.0] - 2021-02-05

### Changed

- Changed: Modified playlist loading logic

## [7.4.0] - 2021-02-01

### Added

- Added: Little rice fork (#2)

## [7.3.0] - 2021-01-31

### Added

- Added: Use Auto Minify playlists

### Fixed

- Fixed: Remove assContainer safely

## [7.2.0] - 2021-01-31

### Fixed

- Fixed: ASS subtitle issue when player size changes

## [7.1.0] - 2021-01-31

### Added

- Added: ASS subtitle support (code format)

### Changed

- Changed: Update URLTemplate
- Changed: Update README.md and homepage link

## [7.0.0] - 2021-01-31

### Changed

- Changed: Project structure adjustment
- Changed: Create LICENSE

## [6.4.0] - 2021-01-12

### Fixed

- Fixed: Subtitles not clearing when switching videos (YouTube doesn't refresh page when clicking other videos, so track element needs manual cleanup)

## [6.3.0] - 2021-01-12

### Fixed

- Fixed: Fine-tune playback behavior at t=0 (YouTube doesn't reset to 0 seconds for t=0, so manual reset needed. Due to inability to disable autoplay, pause before playing, or adjust time before playing, double playback from start may occur. Double check implemented here.)

## [6.2.0] - 2021-01-12

### Changed

- Changed: Code refactoring

## [6.1.0] - 2021-01-11

### Added

- Added: Modified sequential playlist UI to loop from beginning after end

### Fixed

- Fixed: UI click nextSong error in GDrive
- Fixed: Merge Subtitle branch

### Changed

- Changed: Update README.md

## [6.0.0] - 2021-01-11

### Added

- Added: Complete subtitle implementation

## [5.4.0] - 2021-01-04

### Fixed

- Fixed: End param not stopping for videos not in playlist
- Fixed: Media Key not working in shuffle mode

### Changed

- Changed: Update README.md
- Changed: Move playlist link conversion tool to <https://github.com/jim60105/SongLists>

## [5.3.0] - 2020-12-10

### Changed

- Changed: Adjust playlist links
- Changed: Split playlists to jim60105/SongLists

## [5.2.0] - 2020-12-10

### Fixed

- Fixed: Residual v parameter when playing Google Drive
- Fixed: Adjust DOM init check interval to one second

## [5.1.0] - 2020-12-10

### Added

- Added: Google Drive playlist functionality

## [4.0.0] - 2020-11-30

### Added

- Added: "Video paused. Continue watching?" bypass feature
- Added: Capture Media Key next track

### Changed

- Changed: Update playlist link conversion tool to new format

## [3.4.0] - 2020-11-29

### Fixed

- Fixed: Queue exit not correctly clearing UI display

### Changed

- Changed: Update demo pic

## [3.3.0] - 2020-11-29

### Fixed

- Fixed: Sequential playback starting from second song

### Changed

- Changed: Update README.md

## [3.2.0] - 2020-11-29

- Initial changelog version

---

[Unreleased]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v16.0.2...HEAD
[16.0.2]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v16.0.1...v16.0.2
[16.0.1]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v16.0.0...v16.0.1
[16.0.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v15.2.9...v16.0.0
[15.2.9]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v15.2.8...v15.2.9
[15.2.8]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v15.2.7...v15.2.8
[15.2.7]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v15.2.6...v15.2.7
[15.2.6]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v15.2.5...v15.2.6
[15.2.5]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v15.2.4...v15.2.5
[15.2.4]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v15.2.3...v15.2.4
[15.2.3]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v15.2.2...v15.2.3
[15.2.2]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v15.2.1...v15.2.2
[15.2.1]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v15.2...v15.2.1
[15.2.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v15.1...v15.2
[15.1.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v15.0...v15.1
[15.0.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v14.2...v15.0
[14.2.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v14.1...v14.2
[14.1.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v14...v14.1
[14.0.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v13.7...v14
[13.7.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v13.6...v13.7
[13.6.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v13.5...v13.6
[13.5.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v13.4...v13.5
[13.4.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v13.3...v13.4
[13.3.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v13.2...v13.3
[13.2.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v13.1...v13.2
[13.1.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v13.0...v13.1
[13.0.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.21...v13.0
[12.21.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.20...v12.21
[12.20.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.19.3...v12.20
[12.19.3]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.19.2...v12.19.3
[12.19.2]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.19.1...v12.19.2
[12.19.1]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.19...v12.19.1
[12.19.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.18...v12.19
[12.18.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.17...v12.18
[12.17.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.16...v12.17
[12.16.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.15.2...v12.16
[12.15.2]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.15.1...v12.15.2
[12.15.1]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.15...v12.15.1
[12.15.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.14.1...v12.15
[12.14.1]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.14...v12.14.1
[12.14.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.13.1...v12.14
[12.13.1]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.13...v12.13.1
[12.13.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.12.3...v12.13
[12.12.3]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.12.2...v12.12.3
[12.12.2]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.12...v12.12.2
[12.12.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.11...v12.12
[12.11.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.10.3...v12.11
[12.10.3]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.10.2...v12.10.3
[12.10.2]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.9...v12.10.2
[12.9.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.8...v12.9
[12.8.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.7...v12.8
[12.7.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.6...v12.7
[12.6.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.5.4...v12.6
[12.5.4]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.5.3...v12.5.4
[12.5.3]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.5.2...v12.5.3
[12.5.2]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.5.1...v12.5.2
[12.5.1]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.5...v12.5.1
[12.5.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.4...v12.5
[12.4.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.3.1...v12.4
[12.3.1]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.3...v12.3.1
[12.3.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.2...v12.3
[12.2.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.1.1...v12.2
[12.1.1]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.1...v12.1.1
[12.1.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v12.0.5...v12.1
[12.0.5]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v11.8...v12.0.5
[11.8.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v11.7...v11.8
[11.7.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v11.5...v11.7
[11.5.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v11.4...v11.5
[11.4.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v11.3...v11.4
[11.3.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v11.2...v11.3
[11.2.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v11.1...v11.2
[11.1.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v11.0...v11.1
[11.0.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v10.3...v11.0
[10.3.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v10.2...v10.3
[10.2.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v10.1...v10.2
[10.1.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v10.0...v10.1
[10.0.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v9.3...v10.0
[9.3.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v9.2...v9.3
[9.2.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v9.1...v9.2
[9.1.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v9.0...v9.1
[9.0.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v8.0...v9.0
[8.0.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v7.4...v8.0
[7.4.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v7.3...v7.4
[7.3.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v7.2...v7.3
[7.2.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v7.1...v7.2
[7.1.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/v7...v7.1
[7.0.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/YoutubeEndParamHandler_v6.4...v7
[6.4.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/YoutubeEndParamHandler_v6.3...YoutubeEndParamHandler_v6.4
[6.3.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/YoutubeEndParamHandler_v6.2...YoutubeEndParamHandler_v6.3
[6.2.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/YoutubeEndParamHandler_v6.1...YoutubeEndParamHandler_v6.2
[6.1.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/YoutubeEndParamHandler_v6.0...YoutubeEndParamHandler_v6.1
[6.0.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/YoutubeEndParamHandler_v5.4...YoutubeEndParamHandler_v6.0
[5.4.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/YoutubeEndParamHandler_v5.3...YoutubeEndParamHandler_v5.4
[5.3.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/YoutubeEndParamHandler_v5.2...YoutubeEndParamHandler_v5.3
[5.2.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/YoutubeEndParamHandler_v5.1...YoutubeEndParamHandler_v5.2
[5.1.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/YoutubeEndParamHandler_v4.0...YoutubeEndParamHandler_v5.1
[4.0.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/YoutubeEndParamHandler_v3.4...YoutubeEndParamHandler_v4.0
[3.4.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/YoutubeEndParamHandler_v3.3...YoutubeEndParamHandler_v3.4
[3.3.0]: https://github.com/jim60105/YoutubeClipPlaylist/compare/YoutubeEndParamHandler_v3.2...YoutubeEndParamHandler_v3.3
[3.2.0]: https://github.com/jim60105/YoutubeClipPlaylist/releases/tag/YoutubeEndParamHandler_v3.2
