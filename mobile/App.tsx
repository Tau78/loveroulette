import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
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

const DEFAULT_HOST = "https://loveroulette.vercel.app";
const STORAGE_HOST = "lr.plancia.host";
const STORAGE_CODE = "lr.plancia.code";
const CASA_BG = "#1a1d24";

function normalizeHost(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, "");
  if (!trimmed) return DEFAULT_HOST;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

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

function WebPlancia({
  adminUrl,
  webRef,
  webError,
  webLoading,
  setWebError,
  setWebLoading,
  retryLoad,
  closeDashboard,
}: {
  adminUrl: string;
  webRef: RefObject<WebView | null>;
  webError: string | null;
  webLoading: boolean;
  setWebError: (value: string | null) => void;
  setWebLoading: (value: boolean) => void;
  retryLoad: () => void;
  closeDashboard: () => void;
}) {
  const insets = useSafeAreaInsets();
  const insetJs = useMemo(() => safeAreaScript(insets), [insets]);

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
          onPress={() => {
            Alert.alert("Uscire?", "Vuoi veramente uscire?", [
              { text: "Annulla", style: "cancel" },
              { text: "Esci", style: "destructive", onPress: closeDashboard },
            ]);
          }}
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel="Cambia evento"
        >
          <Text style={styles.backText}>Evento</Text>
        </Pressable>
      </View>
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
      {webError ? (
        <View style={styles.webCover}>
          <Text style={styles.webCoverText}>{webError}</Text>
          <Pressable
            onPress={retryLoad}
            style={styles.retry}
            accessibilityRole="button"
            accessibilityLabel="Riprova"
          >
            <Text style={styles.retryText}>Riprova</Text>
          </Pressable>
        </View>
      ) : webLoading ? (
        <View style={styles.webCover} pointerEvents="none">
          <Text style={styles.webCoverText}>Apro la plancia…</Text>
        </View>
      ) : null}
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
  const [host, setHost] = useState(DEFAULT_HOST);
  const [code, setCode] = useState("");
  const [opened, setOpened] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [webError, setWebError] = useState<string | null>(null);
  const [webLoading, setWebLoading] = useState(true);
  const webRef = useRef<WebView>(null);
  useKeepAwake();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [savedHost, savedCode] = await Promise.all([
        AsyncStorage.getItem(STORAGE_HOST),
        AsyncStorage.getItem(STORAGE_CODE),
      ]);
      if (cancelled) return;
      if (savedHost) setHost(savedHost);
      if (savedCode) setCode(savedCode);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const adminUrl = useMemo(() => {
    if (!opened) return null;
    const [nextHost, nextCode] = opened.split("\0");
    return `${nextHost}/admin/${encodeURIComponent(nextCode)}/serata`;
  }, [opened]);

  const openDashboard = useCallback(async () => {
    const nextHost = normalizeHost(host);
    const nextCode = normalizeCode(code);
    if (nextCode.length < 3) return;
    Keyboard.dismiss();
    setHost(nextHost);
    setCode(nextCode);
    await AsyncStorage.multiSet([
      [STORAGE_HOST, nextHost],
      [STORAGE_CODE, nextCode],
    ]);
    await waitForKeyboardDown();
    setWebError(null);
    setWebLoading(true);
    setOpened(`${nextHost}\0${nextCode}`);
  }, [code, host]);

  const retryLoad = useCallback(() => {
    setWebError(null);
    setWebLoading(true);
    webRef.current?.reload();
  }, []);

  const closeDashboard = useCallback(() => {
    setOpened(null);
    setWebError(null);
    setWebLoading(true);
  }, []);

  if (!ready) {
    return <View style={styles.boot} />;
  }

  if (adminUrl) {
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
          closeDashboard={closeDashboard}
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
            Stesso host di proiettore e telefoni. Poi il PIN dell'evento.
          </Text>

          <Text style={styles.label}>Codice evento</Text>
          <TextInput
            value={code}
            onChangeText={(value) => setCode(normalizeCode(value))}
            autoCapitalize="characters"
            autoCorrect={false}
            autoComplete="off"
            textContentType="none"
            passwordRules=""
            importantForAutofill="no"
            placeholder="DEMO01"
            placeholderTextColor="#6b6b7a"
            style={styles.input}
            returnKeyType="go"
            onSubmitEditing={() => void openDashboard()}
            blurOnSubmit
          />

          <Text style={styles.label}>Host web</Text>
          <TextInput
            value={host}
            onChangeText={setHost}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            textContentType="URL"
            keyboardType="url"
            placeholder={DEFAULT_HOST}
            placeholderTextColor="#6b6b7a"
            style={styles.input}
            onSubmitEditing={() => void openDashboard()}
            blurOnSubmit
          />

          <Pressable
            onPress={() => void openDashboard()}
            disabled={normalizeCode(code).length < 3}
            style={({ pressed }) => [
              styles.cta,
              normalizeCode(code).length < 3 && styles.ctaDisabled,
              pressed && styles.ctaPressed,
            ]}
          >
            <Text style={styles.ctaText}>Apri plancia</Text>
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
});
