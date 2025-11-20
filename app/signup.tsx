import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Alert,
  ActivityIndicator,
  Text,
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

const interests = ['Viagens', 'Festas', 'Games'];

type SignupMethod = 'email' | 'google' | 'facebook' | 'apple' | null;

export default function SignupScreen() {
  const [step, setStep] = useState<1 | 2>(1);
  const [signupMethod, setSignupMethod] = useState<SignupMethod>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
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

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleMethodSelection = (method: SignupMethod) => {
    setSignupMethod(method);
    if (method === 'email') {
      // Se escolher email, fica no step 1 para preencher dados
    } else {
      // Se escolher social, vai direto para step 2
      // TODO: Implementar login social
      Alert.alert('Em breve', 'Login social será implementado em breve');
    }
  };

  const handleEmailSignupContinue = () => {
    if (!name || !email || password.length < 6) {
      Alert.alert('Atenção', 'Preencha todos os campos corretamente');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Atenção', 'As senhas não coincidem');
      return;
    }

    setStep(2);
  };

  const createProfile = async (userId: string) => {
    // Cria o perfil do usuário na tabela profiles
    const { error } = await supabase.from('profiles').insert({
      id: userId,
      name: name.trim(),
      username: null, // Pode ser preenchido depois
      bio: null,
      avatar_url: null,
    });

    if (error) {
      console.error('Erro ao criar perfil:', error);
      // Não bloqueia o cadastro se falhar ao criar perfil
    }
  };

  const handleInterestsContinue = async () => {
    if (selectedInterests.length === 0) {
      Alert.alert('Atenção', 'Selecione pelo menos um interesse');
      return;
    }

    if (signupMethod === 'email') {
      setLoading(true);
      try {
        // Cria a conta no Supabase
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
        });

        if (error) {
          Alert.alert('Erro ao criar conta', error.message);
          setLoading(false);
          return;
        }

        if (data.user) {
          // Cria o perfil do usuário
          await createProfile(data.user.id);

          // Verifica se precisa confirmar email
          if (data.session) {
            // Sessão criada, usuário já está logado
            router.replace('/(tabs)');
          } else {
            // Precisa confirmar email
            Alert.alert(
              'Confirme seu email',
              'Enviamos um link de confirmação para seu email. Por favor, verifique sua caixa de entrada.',
              [
                {
                  text: 'OK',
                  onPress: () => router.replace('/login'),
                },
              ]
            );
          }
        }
      } catch (error: any) {
        Alert.alert('Erro', error.message || 'Ocorreu um erro ao criar a conta');
        setLoading(false);
      }
    } else {
      // TODO: Implementar cadastro social
      Alert.alert('Em breve', 'Cadastro social será implementado em breve');
    }
  };

  const canContinueEmail =
    name.length > 0 && email.length > 0 && password.length >= 6 && password === confirmPassword;
  const canContinueInterests = selectedInterests.length > 0 && !loading;

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            <View style={styles.content}>
              {step === 1 && (
                <>
                  <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
                    <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                  </TouchableOpacity>

                  <View style={styles.header}>
                    <ThemedText type="title" style={[styles.title, { color: '#FFFFFF' }]}>
                      Criar conta
                    </ThemedText>
                    <ThemedText style={[styles.subtitle, { color: 'rgba(255, 255, 255, 0.9)' }]}>
                      Escolha como deseja se cadastrar
                    </ThemedText>
                  </View>

                  {/* Decoração visual */}
                  <View style={styles.decorativeCircle1} />
                  <View style={styles.decorativeCircle2} />

                  <View style={styles.form}>
                    {signupMethod === null ? (
                      <>
                        {/* Botões de Método de Cadastro */}
                        <View style={styles.methodButtons}>
                          <TouchableOpacity
                            style={[styles.methodButton, { borderColor: 'rgba(255, 255, 255, 0.4)' }]}
                            onPress={() => handleMethodSelection('email')}
                            activeOpacity={0.85}>
                            <MaterialIcons name="email" size={24} color="#FFFFFF" />
                            <ThemedText style={[styles.methodButtonText, { color: '#FFFFFF' }]}>
                              Email
                            </ThemedText>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.methodButton, { borderColor: 'rgba(255, 255, 255, 0.4)' }]}
                            onPress={() => handleMethodSelection('google')}
                            activeOpacity={0.85}>
                            <FontAwesome name="google" size={24} color="#FFFFFF" />
                            <ThemedText style={[styles.methodButtonText, { color: '#FFFFFF' }]}>
                              Google
                            </ThemedText>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.methodButton, { borderColor: 'rgba(255, 255, 255, 0.4)' }]}
                            onPress={() => handleMethodSelection('facebook')}
                            activeOpacity={0.85}>
                            <FontAwesome name="facebook" size={24} color="#FFFFFF" />
                            <ThemedText style={[styles.methodButtonText, { color: '#FFFFFF' }]}>
                              Facebook
                            </ThemedText>
                          </TouchableOpacity>

                          {Platform.OS === 'ios' && (
                            <TouchableOpacity
                              style={[styles.methodButton, { borderColor: 'rgba(255, 255, 255, 0.4)' }]}
                              onPress={() => handleMethodSelection('apple')}
                              activeOpacity={0.85}>
                              <MaterialIcons name="phone-iphone" size={24} color="#FFFFFF" />
                              <ThemedText style={[styles.methodButtonText, { color: '#FFFFFF' }]}>
                                Apple
                              </ThemedText>
                            </TouchableOpacity>
                          )}
                        </View>

                        <TouchableOpacity
                          onPress={() => router.back()}
                          activeOpacity={0.7}
                          style={styles.loginLink}>
                          <ThemedText style={[styles.loginText, { color: '#FFFFFF' }]}>
                            Já tem conta? <ThemedText style={styles.loginLinkText}>Entrar</ThemedText>
                          </ThemedText>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        {/* Formulário de Email */}
                        <View style={styles.inputContainer}>
                          <ThemedText style={[styles.inputLabel, { color: 'rgba(255, 255, 255, 0.9)' }]}>
                            Nome completo
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
                            placeholder="Seu nome completo"
                            placeholderTextColor={colors.textSecondary}
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="words"
                          />
                        </View>

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
                            placeholder="Mínimo 6 caracteres"
                            placeholderTextColor={colors.textSecondary}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                          />
                        </View>

                        <View style={styles.inputContainer}>
                          <ThemedText style={[styles.inputLabel, { color: 'rgba(255, 255, 255, 0.9)' }]}>
                            Confirmar senha
                          </ThemedText>
                          <TextInput
                            style={[
                              styles.input,
                              {
                                backgroundColor: '#FFFFFF',
                                borderColor:
                                  confirmPassword && password !== confirmPassword
                                    ? colors.error
                                    : 'rgba(255, 255, 255, 0.3)',
                                color: colors.text,
                              },
                            ]}
                            placeholder="Digite a senha novamente"
                            placeholderTextColor={colors.textSecondary}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                          />
                          {confirmPassword && password !== confirmPassword && (
                            <ThemedText style={[styles.errorText, { color: colors.error }]}>
                              As senhas não coincidem
                            </ThemedText>
                          )}
                        </View>

                        <TouchableOpacity
                          style={[
                            styles.continueButton,
                            {
                              backgroundColor: canContinueEmail ? colors.primary : 'rgba(255, 255, 255, 0.3)',
                              opacity: canContinueEmail ? 1 : 0.6,
                            },
                          ]}
                          onPress={handleEmailSignupContinue}
                          disabled={!canContinueEmail}
                          activeOpacity={0.85}>
                          <Text
                            style={[
                              styles.continueButtonText,
                              { color: '#FFFFFF' },
                            ]}>
                            Continuar
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </>
              )}

              {step === 2 && (
                <>
                  <TouchableOpacity
                    onPress={() => setStep(1)}
                    style={styles.backButton}
                    activeOpacity={0.7}>
                    <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                  </TouchableOpacity>

                  <View style={styles.header}>
                    <ThemedText type="title" style={[styles.title, { color: '#FFFFFF' }]}>
                      Seus interesses
                    </ThemedText>
                    <ThemedText style={[styles.subtitle, { color: 'rgba(255, 255, 255, 0.9)' }]}>
                      Selecione pelo menos um interesse
                    </ThemedText>
                  </View>

                  {/* Decoração visual */}
                  <View style={styles.decorativeCircle1} />
                  <View style={styles.decorativeCircle2} />

                  <View style={styles.form}>
                    <View style={styles.interestsContainer}>
                      <View style={styles.interestsList}>
                        {interests.map((interest) => {
                          const isSelected = selectedInterests.includes(interest);
                          return (
                            <TouchableOpacity
                              key={interest}
                              onPress={() => toggleInterest(interest)}
                              activeOpacity={0.7}
                              style={[
                                styles.interestChip,
                                {
                                  backgroundColor: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.2)',
                                  borderColor: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)',
                                },
                              ]}>
                              <ThemedText
                                style={[
                                  styles.interestText,
                                  { color: isSelected ? colors.primary : '#FFFFFF' },
                                ]}>
                                {interest}
                              </ThemedText>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.continueButton,
                        {
                          backgroundColor: canContinueInterests ? colors.primary : 'rgba(255, 255, 255, 0.3)',
                          opacity: canContinueInterests && !loading ? 1 : 0.6,
                        },
                      ]}
                      onPress={handleInterestsContinue}
                      disabled={!canContinueInterests || loading}
                      activeOpacity={0.85}>
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text
                          style={[
                            styles.continueButtonText,
                            { color: '#FFFFFF' },
                          ]}>
                          Finalizar cadastro
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </ScrollView>
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
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
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
  methodButtons: {
    gap: 16,
    marginBottom: 32,
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  methodButtonText: {
    fontSize: 17,
    fontWeight: '600',
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
  interestsContainer: {
    marginBottom: 32,
  },
  interestsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  interestChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  interestText: {
    fontSize: 15,
    fontWeight: '600',
  },
  continueButton: {
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
  continueButtonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
    marginLeft: 4,
  },
  loginLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 15,
    fontWeight: '400',
  },
  loginLinkText: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
