import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/utils/supabase';

export default function ProfileScreen() {
  const { theme, setTheme, colorScheme } = useTheme();
  const { profile, user } = useAuth();
  const colors = Colors[colorScheme ?? 'light'];
  const isDarkMode = colorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Dados do usuário do perfil ou valores padrão
  const defaultUserData = {
    name: profile?.name || user?.email?.split('@')[0] || 'Usuário',
    username: profile?.username || `@${user?.email?.split('@')[0] || 'usuario'}`,
    bio: profile?.bio || 'Nenhuma biografia ainda',
    avatar: profile?.avatar_url || '👤',
    interests: ['Viagens', 'Festas'], // TODO: Adicionar campo de interesses no perfil
  };

  const [userData, setUserData] = useState(defaultUserData);
  const [editData, setEditData] = useState(defaultUserData);

  // Função para recuperar a imagem do storage usando o ID do usuário
  const loadAvatarFromStorage = async (userId: string) => {
    try {
      // Lista todos os arquivos no bucket para encontrar o que corresponde ao userId
      const { data: files, error: listError } = await supabase.storage
        .from('profile-images')
        .list('', {
          search: userId,
        });

      if (!listError && files && files.length > 0) {
        // Procura o arquivo que corresponde ao padrão {userId}.{ext}
        const matchingFile = files.find(file => 
          file.name.startsWith(`${userId}.`) || file.name === userId
        );

        if (matchingFile) {
          // Se encontrou o arquivo, constrói a URL pública
          const { data: { publicUrl } } = supabase.storage
            .from('profile-images')
            .getPublicUrl(matchingFile.name);
          return publicUrl;
        }
      }

      // Se não encontrou listando, tenta construir URLs diretas para extensões comuns
      const extensions = ['jpg', 'jpeg', 'png', 'webp'];
      for (const ext of extensions) {
        const filePath = `${userId}.${ext}`;
        const { data: { publicUrl } } = supabase.storage
          .from('profile-images')
          .getPublicUrl(filePath);
        
        // Verifica se a URL é acessível fazendo uma requisição HEAD
        try {
          const response = await fetch(publicUrl, { method: 'HEAD' });
          if (response.ok) {
            return publicUrl;
          }
        } catch {
          // Se falhar, continua tentando outras extensões
        }
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar imagem do storage:', error);
      return null;
    }
  };

  // Atualiza userData e editData quando o perfil mudar e recupera imagem do storage
  useEffect(() => {
    const loadAvatar = async () => {
      let avatarUrl = profile?.avatar_url || null;

      // Se não há avatar_url no perfil ou não é uma URL válida, tenta buscar no storage
      if (!avatarUrl || !avatarUrl.startsWith('http')) {
        if (user?.id) {
          const storageUrl = await loadAvatarFromStorage(user.id);
          if (storageUrl) {
            avatarUrl = storageUrl;
          }
        }
      }

      const newUserData = {
        name: profile?.name || user?.email?.split('@')[0] || 'Usuário',
        username: profile?.username || `@${user?.email?.split('@')[0] || 'usuario'}`,
        bio: profile?.bio || 'Nenhuma biografia ainda',
        avatar: avatarUrl || '👤',
        interests: ['Viagens', 'Festas'],
      };
      setUserData(newUserData);
      setEditData(newUserData);
    };

    if (user?.id) {
      loadAvatar();
    }
  }, [profile, user]);

  // Estatísticas
  const stats = {
    rateios: 12,
    grupos: 5,
    avaliacoes: 4.8,
  };

  // Atividades recentes
  const activities = [
    {
      id: 1,
      type: 'group',
      icon: '👥',
      text: 'Entrou no grupo Galera do Churras',
      date: 'Hoje',
      color: colors.primary,
    },
    {
      id: 2,
      type: 'rateio',
      icon: '💰',
      text: 'Criou o rateio Assinatura Netflix Família',
      date: 'Ontem',
      color: colors.secondary,
    },
    {
      id: 3,
      type: 'payment',
      icon: '💵',
      text: 'Recebeu R$ 120,00 em Viagem RJ-SP',
      date: '2 dias atrás',
      color: colors.success,
    },
    {
      id: 4,
      type: 'group',
      icon: '👥',
      text: 'Criou o grupo Viagens Baratas',
      date: '3 dias atrás',
      color: colors.teal,
    },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          // Busca a imagem do storage
          let avatarUrl = data.avatar_url || null;
          if (!avatarUrl || !avatarUrl.startsWith('http')) {
            const storageUrl = await loadAvatarFromStorage(user.id);
            if (storageUrl) {
              avatarUrl = storageUrl;
            }
          }

          const refreshedData = {
            name: data.name || user?.email?.split('@')[0] || 'Usuário',
            username: data.username || `@${user?.email?.split('@')[0] || 'usuario'}`,
            bio: data.bio || 'Nenhuma biografia ainda',
            avatar: avatarUrl || '👤',
            interests: ['Viagens', 'Festas'], // TODO: Adicionar campo de interesses
          };
          setUserData(refreshedData);
          setEditData(refreshedData);
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const uploadImage = async (uri: string) => {
    if (!user?.id) {
      Alert.alert('Erro', 'Usuário não encontrado');
      return null;
    }

    try {
      setUploadingImage(true);

      // Lê o arquivo como arrayBuffer
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error('Não foi possível ler a imagem');
      }
      const arrayBuffer = await response.arrayBuffer();

      // Nome do arquivo usando o ID do usuário
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `${fileName}`;

      // Faz upload para o Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: true, // Substitui se já existir
        });

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        throw uploadError;
      }

      // Obtém a URL pública da imagem
      const {
        data: { publicUrl },
      } = supabase.storage.from('profile-images').getPublicUrl(filePath);

      // Adiciona timestamp para forçar recarregamento (evita cache)
      const urlWithTimestamp = `${publicUrl}?t=${Date.now()}`;

      return urlWithTimestamp;
    } catch (error: any) {
      console.error('Erro ao fazer upload da imagem:', error);
      Alert.alert('Erro no upload', error.message || 'Não foi possível fazer upload da imagem');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePickImage = async () => {
    try {
      // Solicita permissão
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar suas fotos');
        return;
      }

      // Abre o seletor de imagem
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('Resultado do ImagePicker:', result);

      if (result.canceled) {
        // Usuário cancelou, não faz nada
        return;
      }

      if (result.assets && result.assets.length > 0 && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        if (imageUri) {
          const imageUrl = await uploadImage(imageUri);

          if (imageUrl) {
            // Remove o timestamp da URL para salvar no banco (mantém apenas a URL base)
            const baseUrl = imageUrl.split('?')[0];
            
            // Atualiza o estado imediatamente com a URL com timestamp (para recarregar)
            setEditData({ ...editData, avatar: imageUrl });
            setUserData({ ...userData, avatar: imageUrl });

            // Atualiza o perfil no banco de dados com a nova URL
            if (user?.id) {
              const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: baseUrl })
                .eq('id', user.id);

              if (updateError) {
                console.error('Erro ao atualizar avatar_url no perfil:', updateError);
              }
            }

            // Força recarregamento da imagem após um pequeno delay
            setTimeout(() => {
              setUserData(prev => ({ ...prev, avatar: `${baseUrl}?t=${Date.now()}` }));
              setEditData(prev => ({ ...prev, avatar: `${baseUrl}?t=${Date.now()}` }));
            }, 100);
          }
        } else {
          Alert.alert('Erro', 'Não foi possível obter a URI da imagem');
        }
      } else {
        Alert.alert('Erro', 'Nenhuma imagem foi selecionada');
      }
    } catch (error: any) {
      console.error('Erro completo ao selecionar imagem:', error);
      console.error('Stack trace:', error?.stack);
      Alert.alert('Erro', error?.message || error?.toString() || 'Não foi possível selecionar a imagem');
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editData.name,
          username: editData.username,
          bio: editData.bio,
          avatar_url: editData.avatar.startsWith('http') ? editData.avatar : null,
        })
        .eq('id', user.id);

      if (error) {
        Alert.alert('Erro', 'Não foi possível salvar o perfil');
        return;
      }

      setUserData(editData);
      setShowEditModal(false);
      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
      }, 3000);
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao salvar o perfil');
    }
  };

  const toggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  const handleLogout = async () => {
    Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.auth.signOut();
            if (error) {
              Alert.alert('Erro', 'Não foi possível fazer logout');
              return;
            }
            router.replace('/login');
          } catch (error) {
            Alert.alert('Erro', 'Ocorreu um erro ao fazer logout');
          }
        },
      },
    ]);
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  const avatarScale = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0.7],
    extrapolate: 'clamp',
  });

  const interests = ['Viagens', 'Festas', 'Games', 'Compras', 'Eventos', 'Estudos', 'Outros'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            backgroundColor: colors.primary,
            opacity: headerOpacity,
            shadowColor: colors.shadow,
          },
        ]}>
        <View style={styles.headerContent}>
          <View style={styles.headerSpacer} />
          <ThemedText type="title" style={[styles.headerTitle, { color: '#FFFFFF' }]}>
            Meu Perfil
          </ThemedText>
          <TouchableOpacity style={styles.settingsButton} activeOpacity={0.7}>
            <MaterialIcons name="settings" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        {/* Seção de Identidade */}
        <View style={styles.identitySection}>
          <View
            style={[
              styles.identityCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
            ]}>
            <View style={styles.avatarContainer}>
              <Animated.View
                style={[
                  styles.avatarWrapper,
                  {
                    transform: [{ scale: avatarScale }],
                  },
                ]}>
                <TouchableOpacity
                  onPress={handlePickImage}
                  activeOpacity={0.8}
                  style={styles.avatarTouchable}>
                  <View style={[styles.avatar, { backgroundColor: colors.primary + '15' }]}>
                    {userData.avatar && userData.avatar.startsWith('http') ? (
                      <Image
                        source={{ uri: userData.avatar }}
                        style={styles.avatarImage}
                        contentFit="cover"
                        transition={200}
                      />
                    ) : (
                      <ThemedText style={styles.avatarText}>{userData.avatar}</ThemedText>
                    )}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cameraButton, { backgroundColor: colors.primary }]}
                  activeOpacity={0.8}
                  onPress={handlePickImage}>
                  <MaterialIcons name="camera-alt" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </Animated.View>
            </View>

            <ThemedText type="defaultSemiBold" style={[styles.userName, { color: colors.text }]}>
              {userData.name}
            </ThemedText>
            <ThemedText style={[styles.userUsername, { color: colors.textSecondary }]}>
              {userData.username}
            </ThemedText>
            <ThemedText style={[styles.userBio, { color: colors.textSecondary }]}>{userData.bio}</ThemedText>

            <TouchableOpacity
              style={[styles.editButton, { borderColor: colors.primary }]}
              activeOpacity={0.8}
              onPress={() => {
                setEditData(userData);
                setShowEditModal(true);
              }}>
              <MaterialIcons name="edit" size={16} color={colors.primary} />
              <ThemedText style={[styles.editButtonText, { color: colors.primary }]}>
                Editar perfil
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Estatísticas */}
        <View style={styles.statsSection}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.statCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
            ]}>
            <View style={[styles.statIcon, { backgroundColor: colors.primary + '15' }]}>
              <MaterialIcons name="receipt" size={20} color={colors.primary} />
            </View>
            <ThemedText style={[styles.statValue, { color: colors.text }]}>{stats.rateios}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
              Rateios participados
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.statCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
            ]}>
            <View style={[styles.statIcon, { backgroundColor: colors.secondary + '15' }]}>
              <MaterialIcons name="group" size={20} color={colors.secondary} />
            </View>
            <ThemedText style={[styles.statValue, { color: colors.text }]}>{stats.grupos}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>Grupos ativos</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.statCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
            ]}>
            <View style={[styles.statIcon, { backgroundColor: colors.warning + '15' }]}>
              <MaterialIcons name="star" size={20} color={colors.warning} />
            </View>
            <ThemedText style={[styles.statValue, { color: colors.text }]}>
              {stats.avaliacoes.toFixed(1)}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>Avaliações</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Minhas Atividades */}
        <View style={styles.activitiesSection}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Minhas Atividades</ThemedText>
          {activities.map((activity) => (
            <TouchableOpacity
              key={activity.id}
              activeOpacity={0.8}
              style={[
                styles.activityItem,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderLeftColor: activity.color,
                  shadowColor: colors.shadow,
                },
              ]}>
              <View style={[styles.activityIconContainer, { backgroundColor: activity.color + '15' }]}>
                <ThemedText style={styles.activityIcon}>{activity.icon}</ThemedText>
              </View>
              <View style={styles.activityContent}>
                <ThemedText style={[styles.activityText, { color: colors.text }]}>{activity.text}</ThemedText>
                <ThemedText style={[styles.activityDate, { color: colors.textSecondary }]}>
                  {activity.date}
                </ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Preferências e Configurações */}
        <View style={styles.settingsSection}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
            Preferências e Configurações
          </ThemedText>

          <View
            style={[
              styles.settingsCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
            ]}>
            <TouchableOpacity
              style={styles.settingsItem}
              activeOpacity={0.7}
              onPress={() => {}}>
              <View style={styles.settingsItemLeft}>
                <View style={[styles.settingsIcon, { backgroundColor: colors.primary + '15' }]}>
                  <MaterialIcons name="notifications" size={20} color={colors.primary} />
                </View>
                <ThemedText style={[styles.settingsItemText, { color: colors.text }]}>
                  Notificações
                </ThemedText>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

            <TouchableOpacity
              style={styles.settingsItem}
              activeOpacity={0.7}
              onPress={() => {}}>
              <View style={styles.settingsItemLeft}>
                <View style={[styles.settingsIcon, { backgroundColor: colors.secondary + '15' }]}>
                  <MaterialIcons name="account-balance-wallet" size={20} color={colors.secondary} />
                </View>
                <ThemedText style={[styles.settingsItemText, { color: colors.text }]}>Carteira</ThemedText>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

            <TouchableOpacity
              style={styles.settingsItem}
              activeOpacity={0.7}
              onPress={() => {}}>
              <View style={styles.settingsItemLeft}>
                <View style={[styles.settingsIcon, { backgroundColor: colors.teal + '15' }]}>
                  <MaterialIcons name="description" size={20} color={colors.teal} />
                </View>
                <ThemedText style={[styles.settingsItemText, { color: colors.text }]}>
                  Termos e Privacidade
                </ThemedText>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

            <TouchableOpacity
              style={styles.settingsItem}
              activeOpacity={0.7}
              onPress={toggleTheme}>
              <View style={styles.settingsItemLeft}>
                <View style={[styles.settingsIcon, { backgroundColor: colors.orange + '15' }]}>
                  <MaterialIcons name={isDarkMode ? 'dark-mode' : 'light-mode'} size={20} color={colors.orange} />
                </View>
                <View style={styles.settingsItemTextContainer}>
                  <ThemedText style={[styles.settingsItemText, { color: colors.text }]}>Tema</ThemedText>
                  <ThemedText style={[styles.settingsItemSubtext, { color: colors.textSecondary }]}>
                    {isDarkMode ? 'Escuro' : 'Claro'}
                  </ThemedText>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.logoutButton, { borderColor: colors.error + '30', backgroundColor: colors.error + '08' }]}
            activeOpacity={0.8}
            onPress={handleLogout}>
            <MaterialIcons name="exit-to-app" size={20} color={colors.error} />
            <ThemedText style={[styles.logoutButtonText, { color: colors.error }]}>Sair da conta</ThemedText>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>

      {/* Modal de Editar Perfil */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowEditModal(false)} activeOpacity={0.7}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <ThemedText style={[styles.modalTitle, { color: colors.text }]}>Editar Perfil</ThemedText>
              <View style={styles.modalHeaderSpacer} />
            </View>

            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}>
              {/* Foto */}
              <View style={styles.modalPhotoSection}>
                <TouchableOpacity
                  onPress={handlePickImage}
                  disabled={uploadingImage}
                  activeOpacity={0.8}
                  style={styles.modalPhotoTouchable}>
                  <View style={[styles.modalAvatar, { backgroundColor: colors.primary + '15' }]}>
                    {uploadingImage ? (
                      <ActivityIndicator color={colors.primary} size="large" />
                    ) : editData.avatar && editData.avatar.startsWith('http') ? (
                      <Image
                        source={{ uri: editData.avatar }}
                        style={styles.modalAvatarImage}
                        contentFit="cover"
                        transition={200}
                      />
                    ) : (
                      <ThemedText style={styles.modalAvatarText}>{editData.avatar}</ThemedText>
                    )}
                  </View>
                  <View style={[styles.modalCameraButton, { backgroundColor: colors.primary }]}>
                    <MaterialIcons name="camera-alt" size={18} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
                <ThemedText style={[styles.modalPhotoHint, { color: colors.textSecondary }]}>
                  {uploadingImage ? 'Fazendo upload...' : 'Toque para alterar foto'}
                </ThemedText>
              </View>

              {/* Nome */}
              <View style={styles.modalField}>
                <ThemedText style={[styles.modalFieldLabel, { color: colors.text }]}>Nome completo</ThemedText>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: colors.borderLight,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={editData.name}
                  onChangeText={(text) => setEditData({ ...editData, name: text })}
                  placeholder="Seu nome completo"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              {/* Username */}
              <View style={styles.modalField}>
                <ThemedText style={[styles.modalFieldLabel, { color: colors.text }]}>Username</ThemedText>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: colors.borderLight,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={editData.username}
                  onChangeText={(text) => setEditData({ ...editData, username: text })}
                  placeholder="@username"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              {/* Bio */}
              <View style={styles.modalField}>
                <ThemedText style={[styles.modalFieldLabel, { color: colors.text }]}>Bio</ThemedText>
                <TextInput
                  style={[
                    styles.modalTextArea,
                    {
                      backgroundColor: colors.borderLight,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={editData.bio}
                  onChangeText={(text) => setEditData({ ...editData, bio: text })}
                  placeholder="Conte um pouco sobre você..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={true}
                  selectTextOnFocus={false}
                />
              </View>

              {/* Interesses */}
              <View style={styles.modalField}>
                <ThemedText style={[styles.modalFieldLabel, { color: colors.text }]}>Interesses</ThemedText>
                <View style={styles.interestsContainer}>
                  {interests.map((interest) => {
                    const isSelected = editData.interests.includes(interest);
                    return (
                      <TouchableOpacity
                        key={interest}
                        activeOpacity={0.7}
                        onPress={() => {
                          if (isSelected) {
                            setEditData({
                              ...editData,
                              interests: editData.interests.filter((i) => i !== interest),
                            });
                          } else if (editData.interests.length < 5) {
                            setEditData({
                              ...editData,
                              interests: [...editData.interests, interest],
                            });
                          }
                        }}
                        style={[
                          styles.interestChip,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.surface,
                            borderColor: isSelected ? colors.primary : colors.border,
                            opacity: !isSelected && editData.interests.length >= 5 ? 0.5 : 1,
                          },
                        ]}>
                        <ThemedText
                          style={[
                            styles.interestChipText,
                            { color: isSelected ? '#FFFFFF' : colors.text },
                          ]}>
                          {interest}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                activeOpacity={0.8}
                onPress={handleSaveProfile}>
                <ThemedText style={styles.saveButtonText}>Salvar alterações</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Toast de Sucesso */}
      {showSuccessToast && (
        <View style={[styles.toast, { backgroundColor: colors.success }]}>
          <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
          <ThemedText style={styles.toastText}>Perfil atualizado com sucesso ✅</ThemedText>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 12,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  identitySection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },
  identityCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarTouchable: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarText: {
    fontSize: 56,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  userUsername: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 12,
  },
  userBio: {
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  activitiesSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderLeftWidth: 4,
    marginBottom: 12,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },
  activityIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityIcon: {
    fontSize: 22,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 12,
    fontWeight: '400',
  },
  settingsSection: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  settingsCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsItemTextContainer: {
    flex: 1,
  },
  settingsItemText: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingsItemSubtext: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalHeaderSpacer: {
    width: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalScroll: {
    flex: 1,
  },
  modalPhotoSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  modalAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  modalAvatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  modalAvatarText: {
    fontSize: 48,
  },
  modalCameraButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 8,
    right: '35%',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  modalPhotoHint: {
    fontSize: 13,
    fontWeight: '400',
  },
  modalField: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalFieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '400',
  },
  modalTextArea: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '400',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalPhotoTouchable: {
    alignItems: 'center',
    position: 'relative',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  interestChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  interestChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
