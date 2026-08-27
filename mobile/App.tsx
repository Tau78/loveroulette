import { useCallback, useEffect, useMemo, useState } from "react";
import {
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
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const DEFAULT_HOST = "https://loveroulette.vercel.app";
const STORAGE_HOST = "lr.plancia.host";
const STORAGE_CODE = "lr.plancia.code";

function normalizeHost(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, "");
  if (!trimmed) return DEFAULT_HOST;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

export function App() {
  const [host, setHost] = useState(DEFAULT_HOST);
  const [code, setCode] = useState("");
  const [opened, setOpened] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
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
    setHost(nextHost);
    setCode(nextCode);
    await AsyncStorage.multiSet([
      [STORAGE_HOST, nextHost],
      [STORAGE_CODE, nextCode],
    ]);
    setOpened(`${nextHost}\0${nextCode}`);
  }, [code, host]);

  if (!ready) {
    return <View style={styles.boot} />;
  }

  if (adminUrl) {
    return (
      <View style={styles.webRoot}>
        <StatusBar hidden style="light" />
        <WebView
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
        />
        <Pressable
          onPress={() => setOpened(null)}
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel="Cambia serata"
        >
          <Text style={styles.backText}>Serata</Text>
        </Pressable>
      </View>
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
            Stesso host di proiettore e telefoni. Poi il PIN della serata.
          </Text>

          <Text style={styles.label}>Codice serata</Text>
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
  webRoot: { flex: 1, backgroundColor: "#0D0D12" },
  web: { flex: 1, backgroundColor: "#0D0D12" },
  back: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 2,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  backText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
});
