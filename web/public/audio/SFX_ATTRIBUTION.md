# Sound Effects Attribution

Third-party sound effects used in Love Roulette. All listed assets are licensed for commercial use (including live events).

## LR_Quiz_Question_Gong

| Field | Value |
| --- | --- |
| **Track ID** | `LR_Quiz_Question_Gong` |
| **Files** | `dark_fuchsia/stingers/LR_Quiz_Question_Gong_A.mp3`, `LR_Quiz_Question_Gong_B.mp3` |
| **Source** | BigSoundBank (La Sonothèque) |
| **Author** | Joseph SARDIN |
| **Original recordings** | [Gong, strong #1](https://bigsoundbank.com/gong-strong-1-s1483.html) (variant A), [Gong, strong #2](https://bigsoundbank.com/gong-strong-2-s1484.html) (variant B) |
| **License** | **CC0 1.0** (public domain) — free for commercial and personal use; attribution not required |
| **License page** | https://bigsoundbank.com/licenses.html |

### Processing

Original studio recordings (~15 s each, 48 kHz mono) were trimmed to ~2.9 s with a short fade-out for quiz “time’s up” stinger use. Exported as 48 kHz stereo MP3 @ 192 kbps to match other stingers in this project.

### Usage in app

Loaded via `web/public/audio/manifest.json` → `LR_Quiz_Question_Gong`. Fallback synthetic WebAudio gong in `web/src/lib/audio/gong.ts` applies only if manifest playback fails.
