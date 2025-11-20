import { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';

interface FinancialPool {
  id: number;
  group_id: number;
  created_by: string;
  title: string;
  description: string | null;
  pool_type: string;
  category: string | null;
  total_amount: number;
  frequency: string | null;
  next_due_date: string | null;
  auto_renew: boolean | null;
  status: string;
  created_at: string;
  group: {
    id: number;
    name: string;
    image_url: string | null;
  };
  creator: {
    id: string;
    name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

interface PoolParticipant {
  id: number;
  pool_id: number;
  user_id: string;
  share_amount: number;
  has_paid: boolean;
  paid_at: string | null;
  created_at: string;
  profile: {
    id: string;
    name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export default function PoolDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const [pool, setPool] = useState<FinancialPool | null>(null);
  const [participants, setParticipants] = useState<PoolParticipant[]>([]);
  const [isParticipant, setIsParticipant] = useState(false);
  const [userParticipant, setUserParticipant] = useState<PoolParticipant | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPoolData = useCallback(async () => {
    if (!id || !user?.id) return;

    try {
      setLoading(true);

      // Carrega o rateio
      const { data: poolData, error: poolError } = await supabase
        .from('financial_pools')
        .select('*')
        .eq('id', parseInt(id))
        .single();

      if (poolError || !poolData) {
        Alert.alert('Erro', 'Rateio não encontrado');
        router.back();
        return;
      }

      // Carrega o grupo
      const { data: groupData } = await supabase
        .from('groups')
        .select('id, name, image_url')
        .eq('id', poolData.group_id)
        .single();

      // Carrega o criador
      const { data: creatorData } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url')
        .eq('id', poolData.created_by)
        .single();

      const formattedPool = {
        ...poolData,
        group: groupData || { id: poolData.group_id, name: 'Grupo', image_url: null },
        creator: creatorData || { id: poolData.created_by, name: null, username: null, avatar_url: null },
      };

      setPool(formattedPool as FinancialPool);

      // Carrega os participantes
      const { data: participantsData, error: participantsError } = await supabase
        .from('pool_participants')
        .select('*')
        .eq('pool_id', parseInt(id))
        .order('created_at', { ascending: true });

      if (!participantsError && participantsData) {
        // Carrega os perfis dos participantes
        const participantUserIds = participantsData.map((p) => p.user_id);
        const { data: participantProfiles } = await supabase
          .from('profiles')
          .select('id, name, username, avatar_url')
          .in('id', participantUserIds);

        const profilesMap = new Map((participantProfiles || []).map((p) => [p.id, p]));

        const formattedParticipants = participantsData.map((p: any) => ({
          ...p,
          profile: profilesMap.get(p.user_id) || { id: p.user_id, name: null, username: null, avatar_url: null },
        }));
        setParticipants(formattedParticipants);

        // Verifica se o usuário é participante
        const currentUserParticipant = formattedParticipants.find((p) => p.user_id === user.id);
        if (currentUserParticipant) {
          setIsParticipant(true);
          setUserParticipant(currentUserParticipant);
        } else {
          setIsParticipant(false);
          setUserParticipant(null);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do rateio:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, user?.id]);

  useEffect(() => {
    loadPoolData();
  }, [loadPoolData]);

  useFocusEffect(
    useCallback(() => {
      loadPoolData();
    }, [loadPoolData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadPoolData();
  };

  const handleJoinPool = async () => {
    if (!user?.id || !pool) return;

    try {
      // Calcula o novo valor por pessoa (redistribuindo entre todos)
      const currentParticipantCount = participants.length;
      const newParticipantCount = currentParticipantCount + 1;
      const newShareAmount = pool.total_amount / newParticipantCount;

      // Atualiza o share_amount de todos os participantes existentes
      if (participants.length > 0) {
        const updatePromises = participants.map((participant) =>
          supabase
            .from('pool_participants')
            .update({ share_amount: newShareAmount })
            .eq('id', participant.id)
        );

        const updateResults = await Promise.all(updatePromises);
        const hasUpdateError = updateResults.some((result) => result.error);

        if (hasUpdateError) {
          Alert.alert('Erro', 'Não foi possível atualizar os valores dos participantes');
          return;
        }
      }

      // Adiciona o novo participante
      const { error } = await supabase.from('pool_participants').insert({
        pool_id: pool.id,
        user_id: user.id,
        share_amount: newShareAmount,
        has_paid: false,
      });

      if (error) {
        Alert.alert('Erro', 'Não foi possível participar do rateio');
        return;
      }

      Alert.alert('Sucesso', 'Você entrou no rateio!');
      loadPoolData();
    } catch (error) {
      console.error('Erro ao participar do rateio:', error);
      Alert.alert('Erro', 'Não foi possível participar do rateio');
    }
  };

  const handleMarkAsPaid = async () => {
    if (!userParticipant || !user?.id) return;

    Alert.alert('Confirmar pagamento', 'Marcar como pago?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('pool_participants')
              .update({
                has_paid: true,
                paid_at: new Date().toISOString(),
              })
              .eq('id', userParticipant.id);

            if (error) {
              Alert.alert('Erro', 'Não foi possível marcar como pago');
              return;
            }

            Alert.alert('Sucesso', 'Pagamento confirmado!');
            loadPoolData();
          } catch (error) {
            Alert.alert('Erro', 'Não foi possível marcar como pago');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>Carregando...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (!pool) {
    return null;
  }

  const paidCount = participants.filter((p) => p.has_paid).length;
  const totalParticipants = participants.length;
  const remainingAmount = pool.total_amount - participants.filter((p) => p.has_paid).reduce((sum, p) => sum + Number(p.share_amount), 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <ThemedText type="title" style={[styles.headerTitle, { color: '#FFFFFF' }]}>
          Rateio
        </ThemedText>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        {/* Informações do grupo */}
        {pool.group && (
          <TouchableOpacity
            style={[styles.groupBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push(`/group/${pool.group.id}`)}
            activeOpacity={0.8}>
            <View style={[styles.groupBannerAvatar, { backgroundColor: colors.primary + '15' }]}>
              {pool.group.image_url ? (
                <Image source={{ uri: pool.group.image_url }} style={styles.groupBannerImage} contentFit="cover" />
              ) : (
                <ThemedText style={styles.groupBannerEmoji}>{pool.group.name.charAt(0).toUpperCase()}</ThemedText>
              )}
            </View>
            <ThemedText style={[styles.groupBannerName, { color: colors.text }]}>{pool.group.name}</ThemedText>
            <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}

        {/* Informações do rateio */}
        <View style={styles.poolHeader}>
          <ThemedText type="defaultSemiBold" style={[styles.poolTitle, { color: colors.text }]}>
            {pool.title}
          </ThemedText>
          {pool.description && (
            <ThemedText style={[styles.poolDescription, { color: colors.textSecondary }]}>
              {pool.description}
            </ThemedText>
          )}

          <View style={styles.poolMeta}>
            <View style={[styles.amountCard, { backgroundColor: colors.primary + '15' }]}>
              <ThemedText style={[styles.amountLabel, { color: colors.textSecondary }]}>Valor Total</ThemedText>
              <ThemedText style={[styles.amountValue, { color: colors.primary }]}>
                R$ {Number(pool.total_amount).toFixed(2)}
              </ThemedText>
            </View>
            <View style={[styles.amountCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ThemedText style={[styles.amountLabel, { color: colors.textSecondary }]}>Por pessoa</ThemedText>
              <ThemedText style={[styles.amountValue, { color: colors.text }]}>
                R$ {totalParticipants > 0 ? (pool.total_amount / totalParticipants).toFixed(2) : pool.total_amount.toFixed(2)}
              </ThemedText>
            </View>
          </View>

          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusTag,
                {
                  backgroundColor:
                    pool.status === 'open'
                      ? '#2ECC71' + '15'
                      : pool.status === 'active'
                        ? '#3498DB' + '15'
                        : '#95A5A6' + '15',
                },
              ]}>
              <ThemedText
                style={[
                  styles.statusTagText,
                  {
                    color:
                      pool.status === 'open'
                        ? '#2ECC71'
                        : pool.status === 'active'
                          ? '#3498DB'
                          : '#95A5A6',
                  },
                ]}>
                {pool.status === 'open' ? 'Aberto' : pool.status === 'active' ? 'Ativo' : 'Concluído'}
              </ThemedText>
            </View>
            <ThemedText style={[styles.poolType, { color: colors.textSecondary }]}>
              {pool.pool_type === 'one-time' ? 'Único' : pool.pool_type === 'subscription' ? 'Assinatura' : 'Recorrente'}
            </ThemedText>
          </View>

          {/* Progresso do pagamento */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <ThemedText style={[styles.progressLabel, { color: colors.text }]}>
                Progresso do pagamento
              </ThemedText>
              <ThemedText style={[styles.progressValue, { color: colors.text }]}>
                {paidCount}/{totalParticipants} pagos
              </ThemedText>
            </View>
            <View style={[styles.progressBar, { backgroundColor: colors.borderLight }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${totalParticipants > 0 ? (paidCount / totalParticipants) * 100 : 0}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>
            {remainingAmount > 0 && (
              <ThemedText style={[styles.remainingAmount, { color: colors.textSecondary }]}>
                Faltam R$ {remainingAmount.toFixed(2)}
              </ThemedText>
            )}
          </View>
        </View>

        {/* Botões de ação */}
        <View style={styles.actionsContainer}>
          {!isParticipant ? (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleJoinPool}
              activeOpacity={0.8}>
              <ThemedText style={styles.actionButtonText}>Participar do Rateio</ThemedText>
            </TouchableOpacity>
          ) : (
            <>
              {!userParticipant?.has_paid && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.primary }]}
                  onPress={handleMarkAsPaid}
                  activeOpacity={0.8}>
                  <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
                  <ThemedText style={styles.actionButtonText}>
                    Marcar como Pago (R$ {Number(userParticipant.share_amount).toFixed(2)})
                  </ThemedText>
                </TouchableOpacity>
              )}
              {userParticipant?.has_paid && (
                <View style={[styles.paidBadge, { backgroundColor: '#2ECC71' + '15' }]}>
                  <MaterialIcons name="check-circle" size={20} color="#2ECC71" />
                  <ThemedText style={[styles.paidText, { color: '#2ECC71' }]}>Você já pagou!</ThemedText>
                </View>
              )}
            </>
          )}
        </View>

        {/* Lista de participantes */}
        <View style={styles.participantsSection}>
          <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, { color: colors.text }]}>
            Participantes ({totalParticipants})
          </ThemedText>

          {participants.length > 0 ? (
            <View style={styles.participantsList}>
              {participants.map((participant) => (
                <View
                  key={participant.id}
                  style={[styles.participantCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.participantInfo}>
                    <View style={[styles.participantAvatar, { backgroundColor: colors.primary + '15' }]}>
                      {participant.profile?.avatar_url ? (
                        <Image
                          source={{ uri: participant.profile.avatar_url }}
                          style={styles.participantAvatarImage}
                          contentFit="cover"
                        />
                      ) : (
                        <ThemedText style={styles.participantAvatarText}>
                          {participant.profile?.name?.charAt(0).toUpperCase() || '👤'}
                        </ThemedText>
                      )}
                    </View>
                    <View style={styles.participantDetails}>
                      <ThemedText type="defaultSemiBold" style={[styles.participantName, { color: colors.text }]}>
                        {participant.profile?.name || 'Usuário'}
                      </ThemedText>
                      <ThemedText style={[styles.participantAmount, { color: colors.textSecondary }]}>
                        R$ {Number(participant.share_amount).toFixed(2)}
                      </ThemedText>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.paymentStatus,
                      {
                        backgroundColor: participant.has_paid ? '#2ECC71' + '15' : '#F39C12' + '15',
                      },
                    ]}>
                    <MaterialIcons
                      name={participant.has_paid ? 'check-circle' : 'schedule'}
                      size={20}
                      color={participant.has_paid ? '#2ECC71' : '#F39C12'}
                    />
                    <ThemedText
                      style={[
                        styles.paymentStatusText,
                        { color: participant.has_paid ? '#2ECC71' : '#F39C12' },
                      ]}>
                      {participant.has_paid ? 'Pago' : 'Aguardando'}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyEmoji}>👥</ThemedText>
              <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
                Nenhum participante ainda
              </ThemedText>
              <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Seja o primeiro a participar!
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
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
  groupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 20,
    marginBottom: 0,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  groupBannerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  groupBannerImage: {
    width: '100%',
    height: '100%',
  },
  groupBannerEmoji: {
    fontSize: 20,
  },
  groupBannerName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  poolHeader: {
    padding: 20,
    gap: 16,
  },
  poolTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  poolDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  poolMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  amountCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 4,
  },
  amountLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  poolType: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: 8,
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  remainingAmount: {
    fontSize: 13,
    fontWeight: '500',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  paidText: {
    fontSize: 16,
    fontWeight: '700',
  },
  participantsSection: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  participantsList: {
    gap: 12,
  },
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  participantAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  participantAvatarImage: {
    width: '100%',
    height: '100%',
  },
  participantAvatarText: {
    fontSize: 20,
  },
  participantDetails: {
    flex: 1,
    gap: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '700',
  },
  participantAmount: {
    fontSize: 14,
    fontWeight: '500',
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  paymentStatusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    minHeight: 200,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 20,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
  },
});

