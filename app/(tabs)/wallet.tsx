import { useState, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  Modal,
  Animated,
  RefreshControl,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function WalletScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [refreshing, setRefreshing] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Dados mockados
  const walletData = {
    saldo: 482.75,
    recebido: 1280.0,
    pagamentos: 930.0,
    taxas: 46.5,
  };

  const transactions = [
    {
      id: 1,
      type: 'entrada',
      icon: '💰',
      title: "Recebido do rateio 'Churrasco da Firma'",
      amount: 150.0,
      date: 'Ontem – 14:32',
      status: 'Concluído',
      color: '#2ECC71',
    },
    {
      id: 2,
      type: 'saida',
      icon: '🧾',
      title: "Pagamento no rateio 'Netflix Família'",
      amount: 25.0,
      date: 'Hoje – 09:15',
      status: 'Concluído',
      color: '#E74C3C',
    },
    {
      id: 3,
      type: 'taxa',
      icon: '⚙️',
      title: 'Taxa de administração (5%)',
      amount: 7.5,
      date: 'Hoje – 09:15',
      status: 'Concluído',
      color: colors.primary,
    },
    {
      id: 4,
      type: 'entrada',
      icon: '💰',
      title: "Recebido do rateio 'Viagem para Praia'",
      amount: 320.0,
      date: '2 dias atrás – 18:45',
      status: 'Concluído',
      color: '#2ECC71',
    },
    {
      id: 5,
      type: 'saida',
      icon: '🧾',
      title: "Pagamento no rateio 'Festa de Aniversário'",
      amount: 85.5,
      date: '3 dias atrás – 20:10',
      status: 'Concluído',
      color: '#E74C3C',
    },
  ];

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const handleWithdraw = () => {
    if (withdrawAmount && parseFloat(withdrawAmount) > 0) {
      setShowWithdrawModal(false);
      setTimeout(() => {
        setShowSuccessModal(true);
      }, 300);
    }
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  // Altura fixa para manter o mesmo tamanho durante o scroll
  const headerHeight = 70;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            backgroundColor: colors.primary,
            height: headerHeight,
            opacity: headerOpacity,
            shadowColor: colors.shadow,
          },
        ]}>
        <View style={styles.headerContent}>
          <ThemedText type="title" style={[styles.headerTitle, { color: '#FFFFFF' }]}>
            Minha Carteira
          </ThemedText>
          <TouchableOpacity style={styles.historyButton} activeOpacity={0.7}>
            <MaterialIcons name="history" size={24} color="#FFFFFF" />
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
        {/* Card de Saldo */}
        <View style={styles.balanceSection}>
          <View
            style={[
              styles.balanceCard,
              {
                backgroundColor: colors.primary,
                shadowColor: colors.shadowStrong,
              },
            ]}>
            <View style={styles.balanceHeader}>
              <MaterialIcons name="account-balance-wallet" size={24} color="#FFFFFF" />
              <ThemedText style={styles.balanceLabel}>Saldo disponível</ThemedText>
            </View>
            <View style={styles.balanceAmountContainer}>
              <Text 
                style={styles.balanceAmount} 
                numberOfLines={1} 
                adjustsFontSizeToFit 
                minimumFontScale={0.5}>
                R$ {walletData.saldo.toFixed(2)}
              </Text>
            </View>
            <ThemedText style={styles.balanceSubtitle}>Saldo liberado para saque</ThemedText>

            <View style={styles.balanceActions}>
              <TouchableOpacity
                style={[styles.addPixButton, { backgroundColor: '#FFFFFF' + '20' }]}
                activeOpacity={0.8}>
                <MaterialIcons name="add" size={18} color="#FFFFFF" />
                <ThemedText style={styles.addPixButtonText}>Adicionar conta Pix</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.withdrawButton, { backgroundColor: '#FFFFFF' }]}
                activeOpacity={0.8}
                onPress={() => setShowWithdrawModal(true)}>
                <ThemedText style={[styles.withdrawButtonText, { color: colors.primary }]}>Sacar</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Resumo Financeiro */}
        <View style={styles.summarySection}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Resumo Financeiro</ThemedText>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.summaryItem,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: '#2ECC71' + '15',
              },
            ]}>
            <View style={[styles.summaryIconContainer, { backgroundColor: '#2ECC71' + '15' }]}>
              <MaterialIcons name="trending-up" size={20} color="#2ECC71" />
            </View>
            <View style={styles.summaryItemContent}>
              <ThemedText style={[styles.summaryItemLabel, { color: colors.textSecondary }]}>
                Recebido em rateios
              </ThemedText>
              <ThemedText style={[styles.summaryItemValue, { color: '#2ECC71' }]}>
                R$ {walletData.recebido.toFixed(2)}
              </ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.summaryItem,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: '#E74C3C' + '15',
              },
            ]}>
            <View style={[styles.summaryIconContainer, { backgroundColor: '#E74C3C' + '15' }]}>
              <MaterialIcons name="trending-down" size={20} color="#E74C3C" />
            </View>
            <View style={styles.summaryItemContent}>
              <ThemedText style={[styles.summaryItemLabel, { color: colors.textSecondary }]}>
                Pagamentos feitos
              </ThemedText>
              <ThemedText style={[styles.summaryItemValue, { color: '#E74C3C' }]}>
                R$ {walletData.pagamentos.toFixed(2)}
              </ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.summaryItem,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: colors.primary + '15',
              },
            ]}>
            <View style={[styles.summaryIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <MaterialIcons name="settings" size={20} color={colors.primary} />
            </View>
            <View style={styles.summaryItemContent}>
              <ThemedText style={[styles.summaryItemLabel, { color: colors.textSecondary }]}>
                Taxas (5%) pagas
              </ThemedText>
              <ThemedText style={[styles.summaryItemValue, { color: colors.primary }]}>
                R$ {walletData.taxas.toFixed(2)}
              </ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Últimas Transações */}
        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Últimas Transações</ThemedText>
            <TouchableOpacity activeOpacity={0.7}>
              <ThemedText style={[styles.seeMoreText, { color: colors.primary }]}>Ver mais</ThemedText>
            </TouchableOpacity>
          </View>

          {transactions.map((transaction) => (
            <TouchableOpacity
              key={transaction.id}
              activeOpacity={0.8}
              style={[
                styles.transactionItem,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderLeftColor: transaction.color,
                  shadowColor: colors.shadow,
                },
              ]}>
              <View style={[styles.transactionIconContainer, { backgroundColor: transaction.color + '15' }]}>
                <ThemedText style={styles.transactionIcon}>{transaction.icon}</ThemedText>
              </View>
              <View style={styles.transactionContent}>
                <ThemedText type="defaultSemiBold" style={[styles.transactionTitle, { color: colors.text }]}>
                  {transaction.title}
                </ThemedText>
                <View style={styles.transactionMeta}>
                  <ThemedText style={[styles.transactionDate, { color: colors.textSecondary }]}>
                    {transaction.date}
                  </ThemedText>
                  <View style={[styles.statusBadge, { backgroundColor: '#2ECC71' + '15' }]}>
                    <ThemedText style={[styles.statusText, { color: '#2ECC71' }]}>
                      {transaction.status}
                    </ThemedText>
                  </View>
                </View>
              </View>
              <View style={styles.transactionAmountContainer}>
                <ThemedText
                  style={[
                    styles.transactionAmount,
                    {
                      color: transaction.type === 'entrada' ? '#2ECC71' : transaction.type === 'taxa' ? colors.primary : '#E74C3C',
                    },
                  ]}>
                  {transaction.type === 'entrada' ? '+' : '-'}R$ {transaction.amount.toFixed(2)}
                </ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.ScrollView>

      {/* Modal de Saque */}
      <Modal visible={showWithdrawModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: colors.text }]}>Saque via Pix</ThemedText>
              <TouchableOpacity
                onPress={() => setShowWithdrawModal(false)}
                activeOpacity={0.7}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.modalBalanceInfo}>
                <ThemedText style={[styles.modalBalanceLabel, { color: colors.textSecondary }]}>
                  Saldo disponível
                </ThemedText>
                <ThemedText style={[styles.modalBalanceValue, { color: colors.text }]}>
                  R$ {walletData.saldo.toFixed(2)}
                </ThemedText>
              </View>

              <View style={styles.modalField}>
                <ThemedText style={[styles.modalFieldLabel, { color: colors.text }]}>
                  Valor do saque
                </ThemedText>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: colors.borderLight,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="R$ 0,00"
                  placeholderTextColor={colors.textSecondary}
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.modalField}>
                <ThemedText style={[styles.modalFieldLabel, { color: colors.text }]}>
                  Chave Pix
                </ThemedText>
                <TouchableOpacity
                  style={[styles.pixKeyButton, { backgroundColor: colors.primary + '10', borderColor: colors.primary }]}
                  activeOpacity={0.8}>
                  <MaterialIcons name="account-balance-wallet" size={18} color={colors.primary} />
                  <ThemedText style={[styles.pixKeyButtonText, { color: colors.primary }]}>
                    Usar chave cadastrada
                  </ThemedText>
                </TouchableOpacity>
              </View>

              <ThemedText style={[styles.modalHint, { color: colors.textSecondary }]}>
                Os saques são processados em até 1 hora nos dias úteis.
              </ThemedText>

              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: colors.primary }]}
                activeOpacity={0.8}
                onPress={handleWithdraw}>
                <ThemedText style={styles.confirmButtonText}>Confirmar saque</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Sucesso */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <ThemedText style={styles.successEmoji}>🎉</ThemedText>
            <ThemedText style={[styles.successTitle, { color: colors.text }]}>
              Saque enviado!
            </ThemedText>
            <ThemedText style={[styles.successSubtitle, { color: colors.textSecondary }]}>
              Você receberá o valor em breve na sua conta Pix.
            </ThemedText>
            <TouchableOpacity
              style={[styles.successButton, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
              onPress={() => setShowSuccessModal(false)}>
              <ThemedText style={styles.successButtonText}>Entendi</ThemedText>
            </TouchableOpacity>
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
    height: '100%',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  historyButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  balanceSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    overflow: 'visible',
  },
  balanceCard: {
    borderRadius: 24,
    padding: 24,
    paddingHorizontal: 28,
    paddingRight: 32,
    overflow: 'visible',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  balanceAmountContainer: {
    width: '100%',
    marginBottom: 8,
    overflow: 'visible',
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    includeFontPadding: false,
    textAlign: 'left',
    flexWrap: 'nowrap',
  },
  balanceSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 24,
  },
  balanceActions: {
    flexDirection: 'row',
    gap: 12,
  },
  addPixButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    gap: 6,
  },
  addPixButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  withdrawButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  withdrawButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  summarySection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 12,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryItemContent: {
    flex: 1,
  },
  summaryItemLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryItemValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  transactionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionItem: {
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
  transactionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIcon: {
    fontSize: 24,
  },
  transactionContent: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionDate: {
    fontSize: 12,
    fontWeight: '400',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  modalBody: {
    gap: 20,
  },
  modalBalanceInfo: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalBalanceLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  modalBalanceValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  modalField: {
    gap: 8,
  },
  modalFieldLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalInput: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '600',
  },
  pixKeyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 8,
  },
  pixKeyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalHint: {
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 18,
  },
  confirmButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  successEmoji: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  successButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  successButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
