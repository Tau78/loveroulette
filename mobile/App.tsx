import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { useKeepAwake } from "expo-keep-awake";
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import {
  STORAGE_CREDIT_ACTIVATED_AT,
  STORAGE_SESSION,
  loginWithPassword,
  parseStoredSession,
  serializeSession,
  type StaffSession,
} from "./src/auth";
import {
  canRunPlancia,
  creditStatus,
  formatExpiry,
  formatRemaining,
  type CreditStatus,
} from "./src/credits";
import { shouldAutoReloadAfterCrash } from "./src/webview-crash";

const DEFAULT_HOST = "https://loveroulette.vercel.app";
const DEFAULT_EVENT_CODE = "DEMO01";
const CASA_BG = "#1a1d24";

function safeAreaScript(insets: {
  top: number;
  right: number;
  bottom: number;
  left: number;
}): string {
  return `(function(){
    var r=document.documentElement;
    r.classList.add('casa-native-chrome');
    r.style.setProperty('--lr-sat','0px');
    r.style.setProperty('--lr-sar','${Math.round(insets.right)}px');
    r.style.setProperty('--lr-sab','${Math.round(insets.bottom)}px');
    r.style.setProperty('--lr-sal','${Math.round(insets.left)}px');
  })();true;`;
}

function EventoSheet({
  visible,
  session,
  status,
  onClose,
  onActivate,
  onLogout,
  activating,
}: {
  visible: boolean;
  session: StaffSession;
  status: CreditStatus;
  onClose: () => void;
  onActivate: () => void;
  onLogout: () => void;
  activating: boolean;
}) {
  const creditLine =
    status.kind === "unlimited"
      ? "Crediti illimitati"
      : status.kind === "active"
        ? `Attivo · scade alle ${formatExpiry(status.expiresAt)} (${formatRemaining(status.remainingMs)})`
        : "Nessun credito attivo";

  const showActivate = status.kind !== "unlimited";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable
          style={styles.sheetCard}
          onPress={(event) => event.stopPropagation()}
        >
          <Text style={styles.sheetKicker}>Evento</Text>
          <Text style={styles.sheetTitle}>Plancia</Text>
          <Text style={styles.sheetMeta}>Utente · {session.username}</Text>
          <Text style={styles.sheetMeta}>{creditLine}</Text>

          {showActivate ? (
            <Pressable
              onPress={onActivate}
              disabled={activating || status.kind === "active"}
              style={({ pressed }) => [
                styles.sheetPrimary,
                (activating || status.kind === "active") && styles.ctaDisabled,
                pressed && styles.ctaPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Attiva credito"
            >
              <Text style={styles.sheetPrimaryText}>
                {status.kind === "active"
                  ? "Credito già attivo"
                  : activating
                    ? "Attivo…"
                    : "Attiva credito"}
              </Text>
            </Pressable>
          ) : (
            <View style={styles.sheetHint}>
              <Text style={styles.sheetHintText}>
                Account admin: attivazione non necessaria.
              </Text>
            </View>
          )}

          {status.kind !== "unlimited" ? (
            <Text style={styles.sheetFine}>
              Un credito dura 6 ore dal momento dell'attivazione.
            </Text>
          ) : null}

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.sheetSecondary,
              pressed && styles.ctaPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Chiudi"
          >
            <Text style={styles.sheetSecondaryText}>Chiudi</Text>
          </Pressable>

          <Pressable
            onPress={onLogout}
            style={({ pressed }) => [
              styles.sheetDanger,
              pressed && styles.ctaPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Esci"
          >
            <Text style={styles.sheetDangerText}>Esci</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function WebPlancia({
  adminUrl,
  webRef,
  webError,
  webLoading,
  setWebError,
  setWebLoading,
  retryLoad,
  session,
  status,
  onOpenEvento,
  eventoOpen,
  onCloseEvento,
  onActivateCredit,
  onLogout,
  activating,
}: {
  adminUrl: string | null;
  webRef: RefObject<WebView | null>;
  webError: string | null;
  webLoading: boolean;
  setWebError: (value: string | null) => void;
  setWebLoading: (value: boolean) => void;
  retryLoad: () => void;
  session: StaffSession;
  status: CreditStatus;
  onOpenEvento: () => void;
  eventoOpen: boolean;
  onCloseEvento: () => void;
  onActivateCredit: () => void;
  onLogout: () => void;
  activating: boolean;
}) {
  const insets = useSafeAreaInsets();
  const insetJs = useMemo(() => safeAreaScript(insets), [insets]);
  const allowed = canRunPlancia(status);
  const crashReloadsRef = useRef(0);

  const recoverFromCrash = () => {
    const next = crashReloadsRef.current + 1;
    crashReloadsRef.current = next;
    if (!shouldAutoReloadAfterCrash(next - 1)) {
      setWebLoading(false);
      setWebError(
        "La plancia si è chiusa. Tocca Riprova — non ricarico in loop.",
      );
      return;
    }
    setWebError(null);
    setWebLoading(true);
    setTimeout(() => webRef.current?.reload(), 400);
  };

  const retryFromCover = () => {
    crashReloadsRef.current = 0;
    retryLoad();
  };

  return (
    <View style={styles.webRoot}>
      <StatusBar hidden={false} style="light" />
      <View
        style={[
          styles.chrome,
          {
            paddingTop: insets.top,
            paddingRight: insets.right + 8,
            paddingLeft: insets.left + 8,
          },
        ]}
      >
        <Pressable
          onPress={onOpenEvento}
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel="Evento"
        >
          <Text style={styles.backText}>Evento</Text>
        </Pressable>
        {status.kind === "active" ? (
          <Text style={styles.chromeCredit}>
            {formatRemaining(status.remainingMs)}
          </Text>
        ) : status.kind === "unlimited" ? (
          <Text style={styles.chromeCredit}>∞</Text>
        ) : null}
      </View>

      {allowed && adminUrl ? (
        <WebView
          ref={webRef}
          source={{ uri: adminUrl }}
          style={styles.web}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          allowsBackForwardNavigationGestures
          setSupportMultipleWindows={false}
          javaScriptEnabled
          domStorageEnabled
          allowsFullscreenVideo
          cacheEnabled={false}
          decelerationRate="normal"
          hideKeyboardAccessoryView
          keyboardDisplayRequiresUserAction={false}
          automaticallyAdjustContentInsets={false}
          contentInsetAdjustmentBehavior="never"
          injectedJavaScriptBeforeContentLoaded={insetJs}
          injectedJavaScript={insetJs}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.webCover} pointerEvents="none">
              <Text style={styles.webCoverText}>Apro la plancia…</Text>
            </View>
          )}
          onLoadEnd={() => setWebLoading(false)}
          onContentProcessDidTerminate={recoverFromCrash}
          onRenderProcessGone={recoverFromCrash}
          onError={(event) => {
            const failedUrl = event.nativeEvent.url || adminUrl;
            setWebLoading(false);
            setWebError(`Non riesco ad aprire la plancia.\n${failedUrl}`);
          }}
          onHttpError={(event) => {
            const { statusCode, url } = event.nativeEvent;
            const failedUrl = url || adminUrl;
            const isPlancia =
              failedUrl === adminUrl || /\/admin\/[^/]+\/serata/.test(failedUrl);
            if (!isPlancia) return;
            setWebLoading(false);
            setWebError(
              `Errore HTTP ${statusCode}. Non riesco ad aprire la plancia.\n${failedUrl}`,
            );
          }}
        />
      ) : (
        <View style={styles.webCover}>
          <Text style={styles.webCoverText}>
            Attiva un credito per aprire la plancia.
          </Text>
          <Pressable
            onPress={onOpenEvento}
            style={styles.retry}
            accessibilityRole="button"
            accessibilityLabel="Apri Evento"
          >
            <Text style={styles.retryText}>Apri Evento</Text>
          </Pressable>
        </View>
      )}

      {allowed && webError ? (
        <View style={styles.webCover}>
          <Text style={styles.webCoverText}>{webError}</Text>
          <Pressable
            onPress={retryFromCover}
            style={styles.retry}
            accessibilityRole="button"
            accessibilityLabel="Riprova"
          >
            <Text style={styles.retryText}>Riprova</Text>
          </Pressable>
        </View>
      ) : allowed && webLoading ? (
        <View style={styles.webCover} pointerEvents="none">
          <Text style={styles.webCoverText}>Apro la plancia…</Text>
        </View>
      ) : null}

      <EventoSheet
        visible={eventoOpen}
        session={session}
        status={status}
        onClose={onCloseEvento}
        onActivate={onActivateCredit}
        onLogout={onLogout}
        activating={activating}
      />
    </View>
  );
}

function waitForKeyboardDown(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      setTimeout(resolve, 80);
    });
  });
}

export function App() {
  const [session, setSession] = useState<StaffSession | null>(null);
  const [activatedAt, setActivatedAt] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [webError, setWebError] = useState<string | null>(null);
  const [webLoading, setWebLoading] = useState(true);
  const [eventoOpen, setEventoOpen] = useState(false);
  const [activating, setActivating] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const webRef = useRef<WebView>(null);
  useKeepAwake();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [rawSession, rawActivated] = await Promise.all([
        AsyncStorage.getItem(STORAGE_SESSION),
        AsyncStorage.getItem(STORAGE_CREDIT_ACTIVATED_AT),
      ]);
      if (cancelled) return;
      setSession(parseStoredSession(rawSession));
      setActivatedAt(rawActivated);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [session]);

  const status = useMemo(
    () => creditStatus(session, activatedAt, nowMs),
    [session, activatedAt, nowMs],
  );

  const adminUrl = useMemo(() => {
    if (!session) return null;
    if (!canRunPlancia(status)) return null;
    return `${DEFAULT_HOST}/admin/${DEFAULT_EVENT_CODE}/serata`;
  }, [session, status]);

  useEffect(() => {
    if (!session) return;
    if (canRunPlancia(status)) return;
    setEventoOpen(true);
  }, [session, status]);

  const submitLogin = useCallback(async () => {
    setLoginError(null);
    setLoggingIn(true);
    const result = loginWithPassword(username, password);
    if (!result.ok) {
      setLoggingIn(false);
      setLoginError(result.error);
      return;
    }
    Keyboard.dismiss();
    await AsyncStorage.setItem(STORAGE_SESSION, serializeSession(result.session));
    await waitForKeyboardDown();
    setSession(result.session);
    setPassword("");
    setLoggingIn(false);
    setWebError(null);
    setWebLoading(true);
    if (!result.session.unlimitedCredits && !canRunPlancia(creditStatus(result.session, activatedAt))) {
      setEventoOpen(true);
    }
  }, [username, password, activatedAt]);

  const activateCredit = useCallback(async () => {
    if (!session || session.unlimitedCredits) return;
    setActivating(true);
    const iso = new Date().toISOString();
    await AsyncStorage.setItem(STORAGE_CREDIT_ACTIVATED_AT, iso);
    setActivatedAt(iso);
    setActivating(false);
    setWebError(null);
    setWebLoading(true);
    setEventoOpen(false);
  }, [session]);

  const logout = useCallback(async () => {
    setEventoOpen(false);
    await AsyncStorage.removeItem(STORAGE_SESSION);
    setSession(null);
    setWebError(null);
    setWebLoading(true);
  }, []);

  const retryLoad = useCallback(() => {
    setWebError(null);
    setWebLoading(true);
    webRef.current?.reload();
  }, []);

  if (!ready) {
    return <View style={styles.boot} />;
  }

  if (session) {
    return (
      <SafeAreaProvider>
        <WebPlancia
          adminUrl={adminUrl}
          webRef={webRef}
          webError={webError}
          webLoading={webLoading}
          setWebError={setWebError}
          setWebLoading={setWebLoading}
          retryLoad={retryLoad}
          session={session}
          status={status}
          onOpenEvento={() => setEventoOpen(true)}
          eventoOpen={eventoOpen}
          onCloseEvento={() => setEventoOpen(false)}
          onActivateCredit={() => void activateCredit()}
          onLogout={() => void logout()}
          activating={activating}
        />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={["top", "right", "bottom", "left"]}>
        <StatusBar style="light" />
        <KeyboardAvoidingView
          style={styles.form}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Text style={styles.kicker}>Love Roulette</Text>
          <Text style={styles.title}>Plancia animatore</Text>
          <Text style={styles.lead}>
            Accedi con le stesse credenziali animatore di APP Eventi.
          </Text>

          <Text style={styles.label}>Utente</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            textContentType="username"
            placeholder="admin"
            placeholderTextColor="#6b6b7a"
            style={styles.input}
            returnKeyType="next"
            editable={!loggingIn}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password"
            textContentType="password"
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor="#6b6b7a"
            style={styles.input}
            returnKeyType="go"
            onSubmitEditing={() => void submitLogin()}
            blurOnSubmit
            editable={!loggingIn}
          />

          {loginError ? (
            <Text style={styles.errorText}>{loginError}</Text>
          ) : null}

          <Pressable
            onPress={() => void submitLogin()}
            disabled={loggingIn || !username.trim() || !password.trim()}
            style={({ pressed }) => [
              styles.cta,
              (loggingIn || !username.trim() || !password.trim()) &&
                styles.ctaDisabled,
              pressed && styles.ctaPressed,
            ]}
          >
            <Text style={styles.ctaText}>
              {loggingIn ? "Accesso…" : "Entra"}
            </Text>
          </Pressable>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, backgroundColor: "#0D0D12" },
  safe: { flex: 1, backgroundColor: "#0D0D12" },
  form: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
    gap: 10,
  },
  kicker: {
    color: "#E91E8C",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  title: { color: "#FFFFFF", fontSize: 34, fontWeight: "800" },
  lead: { color: "#A0A0B0", fontSize: 16, lineHeight: 22, marginBottom: 8 },
  label: { color: "#A0A0B0", fontSize: 13, fontWeight: "600", marginTop: 6 },
  input: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(0,0,0,0.55)",
    color: "#FFFFFF",
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: "600",
  },
  errorText: {
    color: "#FF8FAB",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  cta: {
    marginTop: 14,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: "#E91E8C",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaDisabled: { opacity: 0.4 },
  ctaPressed: { opacity: 0.85 },
  ctaText: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
  webRoot: {
    flex: 1,
    flexDirection: "column",
    width: "100%",
    height: "100%",
    backgroundColor: CASA_BG,
  },
  web: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: CASA_BG,
  },
  webCover: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: CASA_BG,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 16,
  },
  webCoverText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 24,
  },
  retry: {
    minHeight: 48,
    minWidth: 160,
    borderRadius: 16,
    backgroundColor: "#E91E8C",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  retryText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  chrome: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: CASA_BG,
    paddingBottom: 6,
  },
  back: {
    backgroundColor: "rgba(0,0,0,0.55)",
    borderColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  backText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  chromeCredit: {
    color: "#A0A0B0",
    fontSize: 12,
    fontWeight: "700",
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  sheetCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "#16181f",
    padding: 22,
    gap: 10,
  },
  sheetKicker: {
    color: "#E91E8C",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  sheetTitle: { color: "#FFFFFF", fontSize: 24, fontWeight: "800" },
  sheetMeta: { color: "#A0A0B0", fontSize: 15, lineHeight: 21 },
  sheetFine: { color: "#6b6b7a", fontSize: 13, lineHeight: 18, marginTop: 2 },
  sheetHint: {
    marginTop: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sheetHintText: { color: "#A0A0B0", fontSize: 14, lineHeight: 20 },
  sheetPrimary: {
    marginTop: 8,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: "#E91E8C",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetPrimaryText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  sheetSecondary: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetSecondaryText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  sheetDanger: {
    minHeight: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetDangerText: { color: "#FF8FAB", fontSize: 15, fontWeight: "700" },
});
