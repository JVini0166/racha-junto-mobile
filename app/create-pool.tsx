import { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';

export default function CreatePoolScreen() {
  const { group_id } = useLocalSearchParams<{ group_id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [poolType, setPoolType] = useState<'one-time' | 'subscription' | 'recurring' | null>(null);
  const [category, setCategory] = useState('');
  const [frequency, setFrequency] = useState<'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY' | null>(null);
  const [showFrequencyModal, setShowFrequencyModal] = useState(false);
  const [autoRenew, setAutoRenew] = useState(false);
  const [nextDueDate, setNextDueDate] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; amount?: string; type?: string; nextDueDate?: string; frequency?: string }>({});

  const poolTypes = [
    { value: 'one-time', label: 'Único', icon: '💰', description: 'Rateio único (ex: churrasco, viagem)' },
    {
      value: 'subscription',
      label: 'Assinatura',
      icon: '📺',
      description: 'Assinatura mensal (ex: Netflix, Spotify)',
    },
    {
      value: 'recurring',
      label: 'Recorrente',
      icon: '🔄',
      description: 'Evento recorrente (ex: futebol toda semana)',
    },
  ];

  const categories = ['Viagens', 'Festas', 'Games', 'Assinaturas', 'Compras', 'Eventos', 'Outros'];

  const frequencyOptions = [
    { value: 'WEEKLY', label: 'Semanal' },
    { value: 'BIWEEKLY', label: 'Quinzenal (2 semanas)' },
    { value: 'MONTHLY', label: 'Mensal' },
    { value: 'QUARTERLY', label: 'Trimestral' },
    { value: 'SEMIANNUALLY', label: 'Semestral' },
    { value: 'YEARLY', label: 'Anual' },
  ];

  const validateForm = () => {
    const newErrors: { title?: string; amount?: string; type?: string; nextDueDate?: string } = {};

    if (title.length < 3) {
      newErrors.title = 'Título deve ter pelo menos 3 caracteres';
    }

    const amount = parseFloat(totalAmount);
    if (!amount || amount <= 0) {
      newErrors.amount = 'Valor deve ser maior que zero';
    }

    if (!poolType) {
      newErrors.type = 'Selecione o tipo do rateio';
    }

    // Valida frequência e next_due_date para assinaturas e recorrentes
    if (poolType && poolType !== 'one-time') {
      if (!frequency) {
        newErrors.frequency = 'Selecione a frequência';
      }
      
      if (!nextDueDate || nextDueDate.length < 10) {
        newErrors.nextDueDate = 'Selecione a próxima data de vencimento';
      } else {
        // Valida formato de data (DD/MM/AAAA)
        const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        const match = nextDueDate.match(dateRegex);
        if (!match) {
          newErrors.nextDueDate = 'Data inválida. Use o formato DD/MM/AAAA';
        } else {
          const day = parseInt(match[1], 10);
          const month = parseInt(match[2], 10) - 1; // Mês começa em 0
          const year = parseInt(match[3], 10);
          const date = new Date(year, month, day);
          
          // Verifica se a data é válida
          if (
            date.getDate() !== day ||
            date.getMonth() !== month ||
            date.getFullYear() !== year
          ) {
            newErrors.nextDueDate = 'Data inválida';
          } else {
            // Verifica se a data é futura
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (date < today) {
              newErrors.nextDueDate = 'A data deve ser futura';
            }
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreatePool = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user?.id || !group_id) {
      Alert.alert('Erro', 'Dados incompletos');
      return;
    }

    setIsCreating(true);

    try {
      // Converte a data do formato DD/MM/AAAA para YYYY-MM-DD
      let formattedDate = null;
      if (nextDueDate && poolType && poolType !== 'one-time') {
        const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        const match = nextDueDate.match(dateRegex);
        if (match) {
          const day = match[1];
          const month = match[2];
          const year = match[3];
          formattedDate = `${year}-${month}-${day}`;
        }
      }

      const { data: poolData, error: poolError } = await supabase
        .from('financial_pools')
        .insert({
          group_id: parseInt(group_id),
          created_by: user.id,
          title,
          description: description || null,
          pool_type: poolType,
          category: category || null,
          total_amount: parseFloat(totalAmount),
          frequency: poolType !== 'one-time' ? frequency : null,
          next_due_date: poolType !== 'one-time' ? formattedDate : null,
          auto_renew: poolType === 'subscription' ? autoRenew : null,
          status: 'open',
        })
        .select()
        .single();

      if (poolError) {
        console.error('Erro ao criar rateio:', poolError);
        Alert.alert('Erro', 'Não foi possível criar o rateio');
        setIsCreating(false);
        return;
      }

      Alert.alert('Sucesso', 'Rateio criado com sucesso!', [
        {
          text: 'OK',
          onPress: () => {
            router.back();
            router.push(`/pool/${poolData.id}`);
          },
        },
      ]);
    } catch (error: any) {
      console.error('Erro ao criar rateio:', error);
      Alert.alert('Erro', 'Não foi possível criar o rateio');
    } finally {
      setIsCreating(false);
    }
  };

  const isFormValid =
    title.length >= 3 &&
    totalAmount &&
    parseFloat(totalAmount) > 0 &&
    poolType !== null &&
    (poolType === 'one-time' || (poolType !== 'one-time' && frequency !== null && nextDueDate.length === 10));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <ThemedText type="title" style={[styles.headerTitle, { color: '#FFFFFF' }]}>
          Criar Rateio
        </ThemedText>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Título */}
        <View style={styles.fieldContainer}>
          <ThemedText style={[styles.fieldLabel, { color: colors.text }]}>Título do rateio</ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: errors.title ? colors.error : colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Ex: Churrasco domingo"
            placeholderTextColor={colors.textSecondary}
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (errors.title) {
                setErrors({ ...errors, title: undefined });
              }
            }}
            maxLength={50}
          />
          {errors.title && (
            <ThemedText style={[styles.errorText, { color: colors.error }]}>{errors.title}</ThemedText>
          )}
          <ThemedText style={[styles.charCount, { color: colors.textSecondary }]}>
            {title.length}/50
          </ThemedText>
        </View>

        {/* Descrição */}
        <View style={styles.fieldContainer}>
          <ThemedText style={[styles.fieldLabel, { color: colors.text }]}>Descrição (opcional)</ThemedText>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Descreva o rateio..."
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

        {/* Valor total */}
        <View style={styles.fieldContainer}>
          <ThemedText style={[styles.fieldLabel, { color: colors.text }]}>Valor total (R$)</ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: errors.amount ? colors.error : colors.border,
                color: colors.text,
              },
            ]}
            placeholder="0,00"
            placeholderTextColor={colors.textSecondary}
            value={totalAmount}
            onChangeText={(text) => {
              // Permite apenas números e ponto/vírgula
              const cleaned = text.replace(/[^0-9,.]/g, '').replace(',', '.');
              setTotalAmount(cleaned);
              if (errors.amount) {
                setErrors({ ...errors, amount: undefined });
              }
            }}
            keyboardType="decimal-pad"
          />
          {errors.amount && (
            <ThemedText style={[styles.errorText, { color: colors.error }]}>{errors.amount}</ThemedText>
          )}
        </View>

        {/* Tipo de rateio */}
        <View style={styles.fieldContainer}>
          <ThemedText style={[styles.fieldLabel, { color: colors.text }]}>Tipo de rateio</ThemedText>
          {errors.type && (
            <ThemedText style={[styles.errorText, { color: colors.error }]}>{errors.type}</ThemedText>
          )}
          <View style={styles.typeContainer}>
            {poolTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                activeOpacity={0.8}
                onPress={() => {
                  setPoolType(type.value as 'one-time' | 'subscription' | 'recurring');
                  if (errors.type) {
                    setErrors({ ...errors, type: undefined });
                  }
                }}
                style={[
                  styles.typeCard,
                  {
                    backgroundColor: poolType === type.value ? colors.primary : colors.surface,
                    borderColor: poolType === type.value ? colors.primary : colors.border,
                    shadowColor: poolType === type.value ? colors.primary + '30' : colors.shadow,
                  },
                ]}>
                <ThemedText style={styles.typeEmoji}>{type.icon}</ThemedText>
                <View style={styles.typeCardContent}>
                  <ThemedText
                    style={[
                      styles.typeCardTitle,
                      { color: poolType === type.value ? '#FFFFFF' : colors.text },
                    ]}>
                    {type.label}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.typeCardDescription,
                      { color: poolType === type.value ? '#FFFFFF' + 'CC' : colors.textSecondary },
                    ]}>
                    {type.description}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Frequência (se não for one-time) */}
        {poolType && poolType !== 'one-time' && (
          <View style={styles.fieldContainer}>
            <ThemedText style={[styles.fieldLabel, { color: colors.text }]}>Frequência</ThemedText>
            {errors.frequency && (
              <ThemedText style={[styles.errorText, { color: colors.error }]}>{errors.frequency}</ThemedText>
            )}
            <TouchableOpacity
              style={[
                styles.dropdownButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: errors.frequency ? colors.error : colors.border,
                },
              ]}
              onPress={() => setShowFrequencyModal(true)}
              activeOpacity={0.7}>
              <ThemedText
                style={[
                  styles.dropdownButtonText,
                  { color: frequency ? colors.text : colors.textSecondary },
                ]}>
                {frequency
                  ? frequencyOptions.find((opt) => opt.value === frequency)?.label
                  : 'Selecione a frequência'}
              </ThemedText>
              <MaterialIcons name="arrow-drop-down" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Próxima data de vencimento (se não for one-time) */}
        {poolType && poolType !== 'one-time' && (
          <View style={styles.fieldContainer}>
            <ThemedText style={[styles.fieldLabel, { color: colors.text }]}>
              Próxima data de vencimento
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: errors.nextDueDate ? colors.error : colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="DD/MM/AAAA"
              placeholderTextColor={colors.textSecondary}
              value={nextDueDate}
              onChangeText={(text) => {
                // Formata automaticamente como DD/MM/AAAA
                let formatted = text.replace(/\D/g, '');
                if (formatted.length > 2) {
                  formatted = formatted.substring(0, 2) + '/' + formatted.substring(2);
                }
                if (formatted.length > 5) {
                  formatted = formatted.substring(0, 5) + '/' + formatted.substring(5, 9);
                }
                setNextDueDate(formatted);
                if (errors.nextDueDate) {
                  setErrors({ ...errors, nextDueDate: undefined });
                }
              }}
              keyboardType="numeric"
              maxLength={10}
            />
            {errors.nextDueDate && (
              <ThemedText style={[styles.errorText, { color: colors.error }]}>{errors.nextDueDate}</ThemedText>
            )}
            <ThemedText style={[styles.fieldHint, { color: colors.textSecondary }]}>
              Data em que o próximo pagamento será devido
            </ThemedText>
          </View>
        )}

        {/* Auto-renovar (se for subscription) */}
        {poolType === 'subscription' && (
          <View style={styles.fieldContainer}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAutoRenew(!autoRenew)}
              activeOpacity={0.7}>
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: autoRenew ? colors.primary : 'transparent',
                    borderColor: autoRenew ? colors.primary : colors.border,
                  },
                ]}>
                {autoRenew && <MaterialIcons name="check" size={20} color="#FFFFFF" />}
              </View>
              <ThemedText style={[styles.checkboxLabel, { color: colors.text }]}>
                Renovação automática
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Categoria */}
        <View style={styles.fieldContainer}>
          <ThemedText style={[styles.fieldLabel, { color: colors.text }]}>Categoria (opcional)</ThemedText>
          <View style={styles.categoriesContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                activeOpacity={0.7}
                onPress={() => setCategory(category === cat ? '' : cat)}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: category === cat ? colors.primary : colors.surface,
                    borderColor: category === cat ? colors.primary : colors.border,
                  },
                ]}>
                <ThemedText
                  style={[
                    styles.categoryText,
                    { color: category === cat ? '#FFFFFF' : colors.text },
                  ]}>
                  {cat}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Espaço para o botão fixo */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modal de seleção de frequência */}
      <Modal
        visible={showFrequencyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFrequencyModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: colors.text }]}>Selecione a frequência</ThemedText>
              <TouchableOpacity
                onPress={() => setShowFrequencyModal(false)}
                style={styles.modalCloseButton}
                activeOpacity={0.7}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {frequencyOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.frequencyOption,
                    {
                      backgroundColor: frequency === option.value ? colors.primary + '15' : 'transparent',
                      borderColor: frequency === option.value ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    setFrequency(option.value as typeof frequency);
                    setShowFrequencyModal(false);
                    if (errors.frequency) {
                      setErrors({ ...errors, frequency: undefined });
                    }
                  }}
                  activeOpacity={0.7}>
                  <ThemedText
                    style={[
                      styles.frequencyOptionText,
                      {
                        color: frequency === option.value ? colors.primary : colors.text,
                        fontWeight: frequency === option.value ? '700' : '500',
                      },
                    ]}>
                    {option.label}
                  </ThemedText>
                  {frequency === option.value && (
                    <MaterialIcons name="check" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Botão Criar Rateio (fixo) */}
      <View style={[styles.fixedButtonContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.createButton,
            {
              backgroundColor: isFormValid ? colors.primary : colors.border,
              opacity: isFormValid ? 1 : 0.6,
            },
          ]}
          onPress={handleCreatePool}
          disabled={!isFormValid || isCreating}
          activeOpacity={0.8}>
          {isCreating ? (
            <View style={styles.buttonContent}>
              <ActivityIndicator size="small" color="#FFFFFF" style={styles.buttonLoader} />
              <ThemedText style={styles.createButtonText}>Criando...</ThemedText>
            </View>
          ) : (
            <ThemedText style={styles.createButtonText}>Criar rateio</ThemedText>
          )}
        </TouchableOpacity>
      </View>
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
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
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
    fontSize: 12,
    fontWeight: '400',
    marginTop: 6,
    lineHeight: 16,
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
  typeEmoji: {
    fontSize: 32,
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  categoryChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 8,
  },
  dropdownButtonText: {
    fontSize: 16,
    fontWeight: '400',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: {
    maxHeight: 400,
  },
  frequencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  frequencyOptionText: {
    fontSize: 16,
    fontWeight: '500',
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
});

