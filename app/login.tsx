import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/utils/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  // Sempre usa o azul do tema claro para a barra de status
  const primaryBlue = Colors.light.primary;

  useEffect(() => {
    // Configura a barra de status do Android para azul
    if (Platform.OS === 'android') {
      SystemUI.setBackgroundColorAsync(primaryBlue).catch(() => {
        // Ignora erros
      });
    }
  }, [primaryBlue]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        Alert.alert('Erro ao fazer login', error.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Ocorreu um erro ao fazer login');
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: 'google' | 'facebook' | 'apple') => {
    // TODO: Implementar login social
    Alert.alert('Em breve', 'Login social será implementado em breve');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <StatusBar style="light" backgroundColor={colors.primary} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}>
          <View style={styles.content}>
            <View style={styles.header}>
              <ThemedText type="title" style={[styles.title, { color: '#FFFFFF' }]}>
                Racha Junto
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: 'rgba(255, 255, 255, 0.9)' }]}>
                Divida despesas de forma simples e justa
              </ThemedText>
            </View>

            {/* Decoração visual */}
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <ThemedText style={[styles.inputLabel, { color: 'rgba(255, 255, 255, 0.9)' }]}>
                  Email
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: '#FFFFFF',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      color: colors.text,
                    },
                  ]}
                  placeholder="seu@email.com"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={[styles.inputLabel, { color: 'rgba(255, 255, 255, 0.9)' }]}>
                  Senha
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: '#FFFFFF',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      color: colors.text,
                    },
                  ]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.loginButton,
                  { backgroundColor: loading ? 'rgba(255, 255, 255, 0.7)' : '#FFFFFF' },
                ]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}>
                {loading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <ThemedText style={[styles.loginButtonText, { color: colors.primary }]}>Entrar</ThemedText>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <ThemedText style={[styles.dividerText, { color: 'rgba(255, 255, 255, 0.7)' }]}>
                  ou continue com
                </ThemedText>
                <View style={styles.dividerLine} />
              </View>

              {/* Botões de Login Social */}
              <View style={styles.socialButtons}>
                <TouchableOpacity
                  style={[styles.socialButton, { borderColor: 'rgba(255, 255, 255, 0.4)' }]}
                  onPress={() => handleSocialLogin('google')}
                  activeOpacity={0.85}>
                  <FontAwesome name="google" size={22} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.socialButton, { borderColor: 'rgba(255, 255, 255, 0.4)' }]}
                  onPress={() => handleSocialLogin('facebook')}
                  activeOpacity={0.85}>
                  <FontAwesome name="facebook" size={22} color="#FFFFFF" />
                </TouchableOpacity>

                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={[styles.socialButton, { borderColor: 'rgba(255, 255, 255, 0.4)' }]}
                    onPress={() => handleSocialLogin('apple')}
                    activeOpacity={0.85}>
                    <MaterialIcons name="phone-iphone" size={22} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                onPress={() => router.push('/signup')}
                activeOpacity={0.7}
                style={styles.signupLink}>
                <ThemedText style={[styles.signupText, { color: '#FFFFFF' }]}>
                  Não tem conta? <ThemedText style={styles.signupLinkText}>Cadastre-se</ThemedText>
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: -50,
    right: -50,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    bottom: 100,
    left: -30,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 56,
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '400',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  input: {
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 18,
    fontSize: 16,
    borderWidth: 1.5,
    fontWeight: '400',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  loginButton: {
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  signupLink: {
    marginTop: 8,
    alignItems: 'center',
  },
  signupText: {
    fontSize: 15,
    fontWeight: '400',
  },
  signupLinkText: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
