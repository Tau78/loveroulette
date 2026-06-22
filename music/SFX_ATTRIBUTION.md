# Sound Effects Attribution

Third-party sound effects used in Love Roulette. All listed assets are licensed for commercial use (including live events).

## LR_Quiz_Question_Gong

| Field | Value |
| --- | --- |
| **Track ID** | `LR_Quiz_Question_Gong` |
| **Files** | `dark_fuchsia/stingers/LR_Quiz_Question_Gong_A.mp3`, `LR_Quiz_Question_Gong_B.mp3` |
| **Source** | [Pixabay — Musical Old Zildjian Gong Quite Natural](https://pixabay.com/sound-effects/musical-old-zildjian-gong-quite-natural-34294/) |
| **Original recording** | SaftJesus — «Old Zildjian Gong Quite Natural» (Freesound #151532) |
| **License** | **Pixabay Content License** — free for commercial use; no attribution required |
| **Archive** | `dark_fuchsia/stingers/candidates/Pixabay_Zildjian_Gong_Natural_full.flac` (54 s source) |

### Processing

Trimmed to **~4.0 s** from the natural strike (fade-out from 3.0 s, 1.0 s), loudness-normalized, exported 48 kHz stereo MP3 @ 192 kbps. Variant B is a duplicate of A (manifest placeholder).

### Usage in app

Loaded via `web/public/audio/manifest.json` → `LR_Quiz_Question_Gong`. Plays once at end of quiz answers countdown (`useQuizGongAtCountdownEnd`). Fallback synthetic bell in `web/src/lib/audio/gong.ts` if manifest playback fails.
