import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import * as NavigationBar from 'expo-navigation-bar';
import { router } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/utils/supabase';

const { width } = Dimensions.get('window');

interface Group {
  id: number;
  name: string;
  description: string | null;
  visibility: 'public' | 'private';
  owner_id: string;
  image_url: string | null;
  created_at: string;
  member_count?: number;
  pools?: Pool[];
}

interface Pool {
  id: number;
  title: string;
  total_amount: number;
  status: string;
  pool_type: string;
  participants_count?: number;
}

export default function FeedScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState('Todos');
  const [publicGroups, setPublicGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Garante que a barra de status fique azul quando a tela ganha foco
  const primaryBlue = Colors.light.primary;
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        SystemUI.setBackgroundColorAsync(primaryBlue).catch(() => {});
        NavigationBar.setStyle('dark');
      }
    }, [primaryBlue])
  );

  // Filtros
  const filters = ['Todos', 'Viagens', 'Festas', 'Games', 'Assinaturas', 'Outros'];

  const loadPublicGroups = useCallback(async () => {
    try {
      setLoading(true);

      // Busca grupos públicos mais recentes
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(20);

      if (groupsError) {
        console.error('Erro ao carregar grupos:', groupsError);
        setPublicGroups([]);
        return;
      }

      // Para cada grupo, busca informações adicionais
      const groupsWithDetails = await Promise.all(
        (groupsData || []).map(async (group) => {
          // Conta membros ativos
          const { count: memberCount } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)
            .eq('active', true);

          // Busca rateios ativos do grupo
          const { data: poolsData } = await supabase
            .from('financial_pools')
            .select('id, title, total_amount, status, pool_type')
            .eq('group_id', group.id)
            .in('status', ['open', 'active'])
            .order('created_at', { ascending: false })
            .limit(3);

          // Para cada rateio, conta participantes
          const poolsWithCounts = await Promise.all(
            (poolsData || []).map(async (pool) => {
              const { count: participantsCount } = await supabase
                .from('pool_participants')
                .select('*', { count: 'exact', head: true })
                .eq('pool_id', pool.id);

              return {
                ...pool,
                participants_count: participantsCount || 0,
              };
            })
          );

          return {
            ...group,
            member_count: memberCount || 0,
            pools: poolsWithCounts,
          };
        })
      );

      setPublicGroups(groupsWithDetails);
    } catch (error) {
      console.error('Erro ao carregar grupos públicos:', error);
      setPublicGroups([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPublicGroups();
  }, [loadPublicGroups]);

  useFocusEffect(
    useCallback(() => {
      loadPublicGroups();
    }, [loadPublicGroups])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadPublicGroups();
  };

  const handleJoinGroup = async (groupId: number) => {
    if (!user?.id) {
      Alert.alert('Erro', 'Você precisa estar logado para entrar em grupos');
      return;
    }

    try {
      // Verifica se já é membro
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .eq('active', true)
        .single();

      if (existingMember) {
        Alert.alert('Info', 'Você já é membro deste grupo');
        router.push(`/group/${groupId}`);
        return;
      }

      // Adiciona como membro
      const { error } = await supabase.from('group_members').insert({
        group_id: groupId,
        user_id: user.id,
        role: 'member',
        active: true,
      });

      if (error) {
        Alert.alert('Erro', 'Não foi possível entrar no grupo');
        return;
      }

      Alert.alert('Sucesso', 'Você entrou no grupo!', [
        {
          text: 'OK',
          onPress: () => router.push(`/group/${groupId}`),
        },
      ]);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível entrar no grupo');
    }
  };

  const getGroupColor = (groupId: number) => {
    const colorsList = [
      colors.primary,
      colors.secondary,
      colors.teal,
      colors.purple,
      colors.orange,
      colors.pink,
      colors.cyan,
      colors.accent,
    ];
    return colorsList[groupId % colorsList.length];
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  const headerHeight = 70;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
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
          <TouchableOpacity style={styles.headerButton} activeOpacity={0.7}>
            <MaterialIcons name="search" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <ThemedText style={[styles.logo, { color: '#FFFFFF' }]}>RachaJunto</ThemedText>
          </View>

          <TouchableOpacity style={styles.headerButton} activeOpacity={0.7}>
            <MaterialIcons name="notifications" size={24} color="#FFFFFF" />
            <View style={[styles.notificationBadge, { backgroundColor: colors.error }]} />
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
        {/* Mensagem de boas-vindas */}
        <View style={styles.welcomeSection}>
          <ThemedText style={[styles.welcomeText, { color: colors.text }]}>
            Descubra grupos públicos 👋
          </ThemedText>
        </View>

        {/* Filtros horizontais */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
          style={styles.filtersScroll}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              activeOpacity={0.7}
              onPress={() => setSelectedFilter(filter)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: selectedFilter === filter ? colors.primary : colors.surface,
                  borderColor: colors.primary,
                },
              ]}>
              <ThemedText
                style={[
                  styles.filterText,
                  { color: selectedFilter === filter ? '#FFFFFF' : colors.primary },
                ]}>
                {filter}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Loading */}
        {loading && publicGroups.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
              Carregando grupos...
            </ThemedText>
          </View>
        ) : publicGroups.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyEmoji}>👥</ThemedText>
            <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
              Nenhum grupo público encontrado
            </ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Que tal criar o primeiro grupo público?
            </ThemedText>
          </View>
        ) : (
          /* Cards de Grupos */
          <View style={styles.groupsContainer}>
            {publicGroups.map((group) => {
              const groupColor = getGroupColor(group.id);
              const activePools = group.pools || [];
              const totalPoolsValue = activePools.reduce((sum, pool) => sum + Number(pool.total_amount), 0);
              const totalParticipants = activePools.reduce((sum, pool) => sum + (pool.participants_count || 0), 0);

              return (
                <TouchableOpacity
                  key={group.id}
                  activeOpacity={0.9}
                  style={[
                    styles.groupCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      shadowColor: groupColor + '20',
                    },
                  ]}
                  onPress={() => router.push(`/group/${group.id}`)}>
                  {/* Foto do grupo */}
                  <View style={[styles.groupCover, { backgroundColor: groupColor + '15' }]}>
                    {group.image_url ? (
                      <Image source={{ uri: group.image_url }} style={styles.groupCoverImage} contentFit="cover" />
                    ) : (
                      <ThemedText style={styles.groupCoverEmoji}>{group.name.charAt(0).toUpperCase()}</ThemedText>
                    )}
                  </View>

                  <View style={styles.cardContent}>
                    {/* Header do card */}
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderLeft}>
                        <ThemedText type="defaultSemiBold" style={[styles.groupName, { color: colors.text }]}>
                          {group.name}
                        </ThemedText>
                        {group.description && (
                          <ThemedText
                            style={[styles.groupDescription, { color: colors.textSecondary }]}
                            numberOfLines={2}>
                            {group.description}
                          </ThemedText>
                        )}
                      </View>
                    </View>

                    {/* Informações do grupo */}
                    <View style={styles.groupMeta}>
                      <View style={styles.metaItem}>
                        <MaterialIcons name="people" size={16} color={colors.textSecondary} />
                        <ThemedText style={[styles.metaText, { color: colors.textSecondary }]}>
                          {group.member_count || 0} membros
                        </ThemedText>
                      </View>
                      {activePools.length > 0 && (
                        <View style={styles.metaItem}>
                          <MaterialIcons name="account-balance-wallet" size={16} color={colors.textSecondary} />
                          <ThemedText style={[styles.metaText, { color: colors.textSecondary }]}>
                            {activePools.length} rateio{activePools.length > 1 ? 's' : ''} ativo{activePools.length > 1 ? 's' : ''}
                          </ThemedText>
                        </View>
                      )}
                    </View>

                    {/* Overview dos rateios */}
                    {activePools.length > 0 && (
                      <View style={styles.poolsOverview}>
                        <ThemedText style={[styles.overviewTitle, { color: colors.text }]}>
                          Rateios em andamento
                        </ThemedText>
                        {activePools.map((pool) => (
                          <View key={pool.id} style={styles.poolItem}>
                            <View style={styles.poolItemLeft}>
                              <View
                                style={[
                                  styles.poolStatusDot,
                                  {
                                    backgroundColor:
                                      pool.status === 'open'
                                        ? '#2ECC71'
                                        : pool.status === 'active'
                                          ? '#3498DB'
                                          : '#95A5A6',
                                  },
                                ]}
                              />
                              <ThemedText style={[styles.poolTitle, { color: colors.text }]} numberOfLines={1}>
                                {pool.title}
                              </ThemedText>
                            </View>
                            <View style={styles.poolItemRight}>
                              <ThemedText style={[styles.poolAmount, { color: colors.primary }]}>
                                R$ {Number(pool.total_amount).toFixed(2)}
                              </ThemedText>
                              {pool.participants_count !== undefined && pool.participants_count > 0 && (
                                <ThemedText style={[styles.poolParticipants, { color: colors.textSecondary }]}>
                                  {pool.participants_count} participante{pool.participants_count > 1 ? 's' : ''}
                                </ThemedText>
                              )}
                            </View>
                          </View>
                        ))}
                        {totalPoolsValue > 0 && (
                          <View style={styles.totalValueContainer}>
                            <ThemedText style={[styles.totalValueLabel, { color: colors.textSecondary }]}>
                              Total em rateios
                            </ThemedText>
                            <ThemedText style={[styles.totalValue, { color: colors.text }]}>
                              R$ {totalPoolsValue.toFixed(2)}
                            </ThemedText>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Botões de ação */}
                    <View style={styles.actionsContainer}>
                      <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                        activeOpacity={0.8}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleJoinGroup(group.id);
                        }}>
                        <ThemedText style={styles.primaryButtonText}>Entrar no grupo</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.secondaryButton, { borderColor: colors.primary }]}
                        activeOpacity={0.7}
                        onPress={(e) => {
                          e.stopPropagation();
                          router.push(`/group/${group.id}`);
                        }}>
                        <ThemedText style={[styles.secondaryButtonText, { color: colors.primary }]}>
                          Ver detalhes
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </Animated.ScrollView>
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
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
  },
  filtersScroll: {
    marginBottom: 16,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyState: {
    paddingVertical: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 20,
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
  groupsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 20,
  },
  groupCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  groupCover: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  groupCoverImage: {
    width: '100%',
    height: '100%',
  },
  groupCoverEmoji: {
    fontSize: 64,
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  groupName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  groupDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '500',
  },
  poolsOverview: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F8FAFF',
    borderRadius: 16,
    gap: 12,
  },
  overviewTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  poolItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  poolItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  poolStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  poolTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  poolItemRight: {
    alignItems: 'flex-end',
  },
  poolAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  poolParticipants: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  totalValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  totalValueLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 14,
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
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
