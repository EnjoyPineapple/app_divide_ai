import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { markOnboardingDone, saveUser } from '../storage/user';

WebBrowser.maybeCompleteAuthSession();

// ─── CONFIGURAÇÃO GOOGLE OAUTH ────────────────────────────────────────────────
// 1. Acesse: https://console.cloud.google.com
// 2. Crie um projeto → APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
// 3. Crie dois Client IDs:
//    - Tipo "Web application" → cole o ID em WEB_CLIENT_ID
//    - Tipo "Android" → cole o ID em ANDROID_CLIENT_ID
// 4. No Client ID Web, adicione em "Authorized redirect URIs":
//    https://auth.expo.io/@SEU_USUARIO_EXPO/divide-ai
const WEB_CLIENT_ID = 'COLE_SEU_WEB_CLIENT_ID_AQUI';
const ANDROID_CLIENT_ID = 'COLE_SEU_ANDROID_CLIENT_ID_AQUI';
// ─────────────────────────────────────────────────────────────────────────────

export default function LoginScreen({ navigation }) {
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: WEB_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const token = response.authentication?.accessToken;
      if (!token) { navigation.replace('Home'); return; }

      fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(async info => {
          await saveUser({ name: info.name, email: info.email, photo: info.picture });
          navigation.replace('Home');
        })
        .catch(() => navigation.replace('Home'));
    }
  }, [response]);

  async function handleSkip() {
    await markOnboardingDone();
    navigation.replace('Home');
  }

  const configured = WEB_CLIENT_ID !== 'COLE_SEU_WEB_CLIENT_ID_AQUI';

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.logo}>🧾</Text>
        <Text style={styles.appName}>Divide Aí</Text>
        <Text style={styles.tagline}>Divida contas entre amigos{'\n'}de forma simples e rápida</Text>
      </View>

      <View style={styles.bottom}>
        {configured ? (
          <TouchableOpacity
            style={[styles.googleBtn, !request && styles.btnDisabled]}
            onPress={() => promptAsync()}
            disabled={!request}
          >
            {!request ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.googleG}>G</Text>
                <Text style={styles.googleBtnText}>Entrar com Google</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.setupBox}>
            <Text style={styles.setupTitle}>⚙️ Google OAuth não configurado</Text>
            <Text style={styles.setupText}>
              Abra o arquivo{'\n'}
              <Text style={styles.setupCode}>src/screens/LoginScreen.js</Text>
              {'\n'}e siga as instruções para configurar as credenciais do Google.
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Usar sem conta →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'space-between', padding: 32 },
  top: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 80, marginBottom: 16 },
  appName: { fontSize: 36, fontWeight: '800', color: '#111827', marginBottom: 10 },
  tagline: { fontSize: 16, color: '#6B7280', textAlign: 'center', lineHeight: 24 },
  bottom: { gap: 12 },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22C55E',
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  btnDisabled: { opacity: 0.5 },
  googleG: { fontSize: 18, fontWeight: '800', color: '#fff' },
  googleBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  setupBox: {
    backgroundColor: '#FFF7ED',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  setupTitle: { fontSize: 14, fontWeight: '700', color: '#92400E', marginBottom: 8 },
  setupText: { fontSize: 13, color: '#92400E', lineHeight: 20 },
  setupCode: { fontFamily: 'monospace', backgroundColor: '#FFEDD5', fontWeight: '700' },
  skipBtn: { alignItems: 'center', padding: 14 },
  skipText: { fontSize: 15, color: '#6B7280', fontWeight: '600' },
});
