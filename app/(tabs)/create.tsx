import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  Modal,
  Animated,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';

const { width } = Dimensions.get('window');

export default function CreateScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [groupType, setGroupType] = useState<'public' | 'private' | null>(null);
  const [groupImage, setGroupImage] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; type?: string }>({});
  const confettiScale = useState(new Animated.Value(0))[0];

  const validateForm = () => {
    const newErrors: { name?: string; type?: string } = {};

    if (groupName.length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
    } else if (groupName.length > 40) {
      newErrors.name = 'Nome deve ter no máximo 40 caracteres';
    }

    if (!groupType) {
      newErrors.type = 'Selecione o tipo do grupo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

      if (result.canceled) {
        return;
      }

      if (result.assets && result.assets.length > 0 && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        if (imageUri) {
          setGroupImage(imageUri);
        }
      }
    } catch (error: any) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
    }
  };

  const uploadGroupImage = async (groupId: number, imageUri: string) => {
    try {
      setIsUploadingImage(true);

      // Lê o arquivo como arrayBuffer
      const response = await fetch(imageUri);
      if (!response.ok) {
        throw new Error('Não foi possível ler a imagem');
      }
      const arrayBuffer = await response.arrayBuffer();

      // Nome do arquivo usando o ID do grupo
      const fileExt = imageUri.split('.').pop() || 'jpg';
      const fileName = `${groupId}.${fileExt}`;
      const filePath = `${fileName}`;

      // Faz upload para o Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('group-images')
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
      } = supabase.storage.from('group-images').getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('Erro ao fazer upload da imagem:', error);
      throw error;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user?.id) {
      Alert.alert('Erro', 'Usuário não encontrado');
      return;
    }

    setIsCreating(true);

    try {
      // Cria o grupo no Supabase
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: groupName,
          description: description || null,
          visibility: groupType, // Mapeia groupType para visibility
          owner_id: user.id,
          image_url: null, // Será atualizado após o upload da imagem
        })
        .select()
        .single();

      if (groupError) {
        console.error('Erro ao criar grupo:', groupError);
        Alert.alert('Erro', 'Não foi possível criar o grupo');
        setIsCreating(false);
        return;
      }

      // Adiciona o criador como membro do grupo com role "owner"
      if (groupData) {
        const { error: memberError } = await supabase.from('group_members').insert({
          group_id: groupData.id,
          user_id: user.id,
          role: 'owner',
          active: true,
        });

        if (memberError) {
          console.error('Erro ao adicionar membro ao grupo:', memberError);
          // Não bloqueia a criação do grupo, mas loga o erro
        }
      }

      // Se há uma imagem selecionada, faz upload
      let imageUrl = null;
      if (groupImage && groupData) {
        try {
          imageUrl = await uploadGroupImage(groupData.id, groupImage);

          // Atualiza o grupo com a URL da imagem
          const { error: updateError } = await supabase
            .from('groups')
            .update({ image_url: imageUrl })
            .eq('id', groupData.id);

          if (updateError) {
            console.error('Erro ao atualizar imagem do grupo:', updateError);
          }
        } catch (uploadError) {
          console.error('Erro ao fazer upload da imagem:', uploadError);
          // Continua mesmo se o upload falhar
        }
      }

      // Mostra modal de sucesso
      setShowSuccessModal(true);
      Animated.spring(confettiScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();

      // Limpa o formulário
      setGroupName('');
      setDescription('');
      setGroupType(null);
      setGroupImage(null);
    } catch (error: any) {
      console.error('Erro ao criar grupo:', error);
      Alert.alert('Erro', 'Não foi possível criar o grupo');
    } finally {
      setIsCreating(false);
    }
  };

  const isFormValid = groupName.length >= 3 && groupName.length <= 40 && groupType !== null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary, shadowColor: colors.shadow }]}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <ThemedText type="title" style={[styles.headerTitle, { color: '#FFFFFF' }]}>
          Criar Grupo
        </ThemedText>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Foto do grupo */}
        <View style={styles.photoSection}>
          <TouchableOpacity
            style={[styles.photoContainer, { backgroundColor: colors.borderLight, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={handlePickImage}
            disabled={isUploadingImage}>
            {isUploadingImage ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : groupImage ? (
              <Image source={{ uri: groupImage }} style={styles.photoImage} contentFit="cover" />
            ) : (
              <>
                <MaterialIcons name="camera-alt" size={32} color={colors.textSecondary} />
                <ThemedText style={[styles.photoText, { color: colors.textSecondary }]}>
                  Adicionar foto do grupo
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Nome do grupo */}
        <View style={styles.fieldContainer}>
          <ThemedText style={[styles.fieldLabel, { color: colors.text }]}>Nome do grupo</ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: errors.name ? colors.error : colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Ex: Galera do Churras 🍖"
            placeholderTextColor={colors.textSecondary}
            value={groupName}
            onChangeText={(text) => {
              setGroupName(text);
              if (errors.name) {
                setErrors({ ...errors, name: undefined });
              }
            }}
            maxLength={40}
          />
          {errors.name && (
            <ThemedText style={[styles.errorText, { color: colors.error }]}>{errors.name}</ThemedText>
          )}
          <ThemedText style={[styles.charCount, { color: colors.textSecondary }]}>
            {groupName.length}/40
          </ThemedText>
        </View>

        {/* Descrição */}
        <View style={styles.fieldContainer}>
          <ThemedText style={[styles.fieldLabel, { color: colors.text }]}>Descrição do grupo</ThemedText>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Conte sobre o grupo e o que vocês pretendem rachar…"
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={200}
            textAlignVertical="top"
          />
          <ThemedText style={[styles.charCount, { color: colors.textSecondary }]}>
            {description.length}/200
          </ThemedText>
        </View>

        {/* Tipo de Grupo */}
        <View style={styles.fieldContainer}>
          <View style={styles.labelRow}>
            <ThemedText style={[styles.fieldLabel, { color: colors.text }]}>Quem pode entrar?</ThemedText>
            <TouchableOpacity activeOpacity={0.7}>
              <MaterialIcons name="info-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.typeContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setGroupType('public');
                if (errors.type) {
                  setErrors({ ...errors, type: undefined });
                }
              }}
              style={[
                styles.typeCard,
                {
                  backgroundColor: groupType === 'public' ? colors.primary : colors.surface,
                  borderColor: groupType === 'public' ? colors.primary : colors.border,
                  shadowColor: groupType === 'public' ? colors.primary + '30' : colors.shadow,
                },
              ]}>
              <MaterialIcons
                name="lock-open"
                size={24}
                color={groupType === 'public' ? '#FFFFFF' : colors.textSecondary}
              />
              <View style={styles.typeCardContent}>
                <ThemedText
                  style={[
                    styles.typeCardTitle,
                    { color: groupType === 'public' ? '#FFFFFF' : colors.text },
                  ]}>
                  Público
                </ThemedText>
                <ThemedText
                  style={[
                    styles.typeCardDescription,
                    { color: groupType === 'public' ? '#FFFFFF' + 'CC' : colors.textSecondary },
                  ]}>
                  Qualquer pessoa pode ver e entrar
                </ThemedText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setGroupType('private');
                if (errors.type) {
                  setErrors({ ...errors, type: undefined });
                }
              }}
              style={[
                styles.typeCard,
                {
                  backgroundColor: groupType === 'private' ? colors.primary : colors.surface,
                  borderColor: groupType === 'private' ? colors.primary : colors.border,
                  shadowColor: groupType === 'private' ? colors.primary + '30' : colors.shadow,
                },
              ]}>
              <MaterialIcons
                name="lock"
                size={24}
                color={groupType === 'private' ? '#FFFFFF' : colors.textSecondary}
              />
              <View style={styles.typeCardContent}>
                <ThemedText
                  style={[
                    styles.typeCardTitle,
                    { color: groupType === 'private' ? '#FFFFFF' : colors.text },
                  ]}>
                  Privado
                </ThemedText>
                <ThemedText
                  style={[
                    styles.typeCardDescription,
                    { color: groupType === 'private' ? '#FFFFFF' + 'CC' : colors.textSecondary },
                  ]}>
                  Entrada por convite ou aprovação
                </ThemedText>
              </View>
            </TouchableOpacity>
          </View>
          {errors.type && (
            <ThemedText style={[styles.errorText, { color: colors.error }]}>{errors.type}</ThemedText>
          )}
        </View>

        {/* Espaço para o botão fixo */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Botão Criar Grupo (fixo) */}
      <View style={[styles.fixedButtonContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.createButton,
            {
              backgroundColor: isFormValid ? colors.primary : colors.border,
              opacity: isFormValid ? 1 : 0.6,
            },
          ]}
          onPress={handleCreateGroup}
          disabled={!isFormValid || isCreating}
          activeOpacity={0.8}>
          {isCreating ? (
            <View style={styles.buttonContent}>
              <ActivityIndicator size="small" color="#FFFFFF" style={styles.buttonLoader} />
              <ThemedText style={styles.createButtonText}>Criando...</ThemedText>
            </View>
          ) : (
            <ThemedText style={styles.createButtonText}>Criar grupo</ThemedText>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal de Sucesso */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Animated.View
              style={[
                styles.confettiContainer,
                {
                  transform: [{ scale: confettiScale }],
                },
              ]}>
              <ThemedText style={styles.confettiEmoji}>🎉</ThemedText>
            </Animated.View>
            <ThemedText style={[styles.modalTitle, { color: colors.text }]}>
              Grupo criado com sucesso!
            </ThemedText>
            <ThemedText style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Agora é só convidar a galera 🎊
            </ThemedText>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                activeOpacity={0.8}
                onPress={() => {
                  setShowSuccessModal(false);
                  router.back();
                }}>
                <ThemedText style={styles.modalButtonText}>Ver grupo</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButtonSecondary, { borderColor: colors.primary }]}
                activeOpacity={0.8}
                onPress={() => {
                  setShowSuccessModal(false);
                  router.back();
                }}>
                <MaterialIcons name="share" size={18} color={colors.primary} />
                <ThemedText style={[styles.modalButtonTextSecondary, { color: colors.primary }]}>
                  Compartilhar link
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  photoContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 70,
  },
  photoText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  fieldContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  fieldHint: {
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '400',
  },
  textArea: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '400',
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 6,
    textAlign: 'right',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
  },
  typeContainer: {
    gap: 12,
    marginTop: 8,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    gap: 16,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  typeCardContent: {
    flex: 1,
  },
  typeCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  typeCardDescription: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 20,
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  createButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#1E6EEB',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonLoader: {
    marginRight: 4,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  confettiContainer: {
    marginBottom: 20,
  },
  confettiEmoji: {
    fontSize: 64,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  modalButtons: {
    width: '100%',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 8,
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
  },
});
