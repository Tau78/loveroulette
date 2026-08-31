/** Auto-reload after WKWebView jetsam. Beyond this, show Riprova — no infinite loop. */
export const MAX_WEBVIEW_CRASH_RELOADS = 2;

export function shouldAutoReloadAfterCrash(failedLoads: number): boolean {
  return failedLoads < MAX_WEBVIEW_CRASH_RELOADS;
}
