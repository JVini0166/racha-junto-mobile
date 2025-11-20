import { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Animated,
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

interface Group {
  id: number;
  name: string;
  description: string | null;
  visibility: 'public' | 'private';
  owner_id: string;
  image_url: string | null;
  created_at: string;
}

interface GroupMember {
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  active: boolean;
  joined_at: string;
  profile: {
    id: string;
    name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

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
}

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'rateios' | 'membros' | 'chat'>('rateios');
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [pools, setPools] = useState<FinancialPool[]>([]);
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'member' | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadGroupData = useCallback(async () => {
    if (!id || !user?.id) return;

    try {
      setLoading(true);

      // Carrega o grupo
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', parseInt(id))
        .single();

      if (groupError || !groupData) {
        Alert.alert('Erro', 'Grupo não encontrado');
        router.back();
        return;
      }

      setGroup(groupData);

      // Carrega os membros do grupo
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('user_id, role, active, joined_at')
        .eq('group_id', parseInt(id))
        .eq('active', true);

      if (!membersError && membersData) {
        // Carrega os perfis dos membros
        const userIds = membersData.map((m) => m.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, username, avatar_url')
          .in('id', userIds);

        const profilesMap = new Map((profilesData || []).map((p) => [p.id, p]));

        const formattedMembers = membersData.map((m: any) => ({
          user_id: m.user_id,
          role: m.role,
          active: m.active,
          joined_at: m.joined_at,
          profile: profilesMap.get(m.user_id) || { id: m.user_id, name: null, username: null, avatar_url: null },
        }));
        setMembers(formattedMembers);

        // Verifica se o usuário é membro e qual seu role
        const currentUserMember = formattedMembers.find((m) => m.user_id === user.id);
        if (currentUserMember) {
          setIsMember(true);
          setUserRole(currentUserMember.role as 'owner' | 'admin' | 'member');
        } else {
          setIsMember(false);
          setUserRole(null);
        }
      }

      // Carrega os rateios do grupo
      const { data: poolsData, error: poolsError } = await supabase
        .from('financial_pools')
        .select('*')
        .eq('group_id', parseInt(id))
        .order('created_at', { ascending: false });

      if (!poolsError && poolsData) {
        setPools(poolsData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do grupo:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, user?.id]);

  useEffect(() => {
    loadGroupData();
  }, [loadGroupData]);

  useFocusEffect(
    useCallback(() => {
      loadGroupData();
    }, [loadGroupData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadGroupData();
  };

  const handleJoinGroup = async () => {
    if (!user?.id || !group) return;

    try {
      const { error } = await supabase.from('group_members').insert({
        group_id: group.id,
        user_id: user.id,
        role: 'member',
        active: true,
      });

      if (error) {
        Alert.alert('Erro', 'Não foi possível entrar no grupo');
        return;
      }

      Alert.alert('Sucesso', 'Você entrou no grupo!');
      loadGroupData();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível entrar no grupo');
    }
  };

  const handlePromoteToAdmin = async (userId: string) => {
    if (!user?.id || !group || userRole !== 'owner') return;

    try {
      const { error } = await supabase
        .from('group_members')
        .update({ role: 'admin' })
        .eq('group_id', group.id)
        .eq('user_id', userId);

      if (error) {
        Alert.alert('Erro', 'Não foi possível promover o membro');
        return;
      }

      Alert.alert('Sucesso', 'Membro promovido a admin!');
      loadGroupData();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível promover o membro');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!user?.id || !group || (userRole !== 'owner' && userRole !== 'admin')) return;

    Alert.alert('Confirmar', 'Tem certeza que deseja remover este membro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('group_members')
              .update({ active: false, left_at: new Date().toISOString() })
              .eq('group_id', group.id)
              .eq('user_id', userId);

            if (error) {
              Alert.alert('Erro', 'Não foi possível remover o membro');
              return;
            }

            Alert.alert('Sucesso', 'Membro removido do grupo');
            loadGroupData();
          } catch (error) {
            Alert.alert('Erro', 'Não foi possível remover o membro');
          }
        },
      },
    ]);
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

  if (!group) {
    return null;
  }

  const groupColor = getGroupColor(group.id);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header fixo no topo */}
      <SafeAreaView style={[styles.headerContainer, { backgroundColor: colors.primary }]} edges={['top']}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <ThemedText type="title" style={[styles.headerTitle, { color: '#FFFFFF' }]} numberOfLines={1}>
            {group.name}
          </ThemedText>
          <View style={styles.backButton} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        {/* Foto e informações do grupo */}
        <View style={styles.groupHeader}>
          <View style={[styles.groupCover, { backgroundColor: groupColor + '15' }]}>
            {group.image_url ? (
              <Image source={{ uri: group.image_url }} style={styles.groupCoverImage} contentFit="cover" />
            ) : (
              <ThemedText style={styles.groupCoverEmoji}>{group.name.charAt(0).toUpperCase()}</ThemedText>
            )}
          </View>

          <View style={styles.groupInfo}>
            <ThemedText type="defaultSemiBold" style={[styles.groupName, { color: colors.text }]}>
              {group.name}
            </ThemedText>
            {group.description && (
              <ThemedText style={[styles.groupDescription, { color: colors.textSecondary }]}>
                {group.description}
              </ThemedText>
            )}
            <View style={styles.groupMeta}>
              <View
                style={[
                  styles.typeTag,
                  {
                    backgroundColor: group.visibility === 'public' ? '#2ECC71' + '15' : '#F39C12' + '15',
                  },
                ]}>
                <ThemedText
                  style={[
                    styles.typeTagText,
                    { color: group.visibility === 'public' ? '#2ECC71' : '#F39C12' },
                  ]}>
                  {group.visibility === 'public' ? 'Público' : 'Privado'}
                </ThemedText>
              </View>
              <ThemedText style={[styles.memberCount, { color: colors.textSecondary }]}>
                {members.length} {members.length === 1 ? 'membro' : 'membros'}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Botões de ação */}
        <View style={styles.actionsContainer}>
          {!isMember ? (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleJoinGroup}
              activeOpacity={0.8}>
              <ThemedText style={styles.actionButtonText}>Entrar no grupo</ThemedText>
            </TouchableOpacity>
          ) : (
            <>
              {(userRole === 'owner' || userRole === 'admin') && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.primary }]}
                  onPress={() => router.push(`/create-pool?group_id=${group.id}`)}
                  activeOpacity={0.8}>
                  <MaterialIcons name="add" size={20} color="#FFFFFF" />
                  <ThemedText style={styles.actionButtonText}>Criar Rateio</ThemedText>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Abas */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => setActiveTab('rateios')}
            activeOpacity={0.7}>
            <ThemedText
              style={[
                styles.tabText,
                {
                  color: activeTab === 'rateios' ? colors.primary : colors.textSecondary,
                  fontWeight: activeTab === 'rateios' ? '700' : '500',
                },
              ]}>
              Rateios ({pools.length})
            </ThemedText>
            {activeTab === 'rateios' && <View style={[styles.tabIndicator, { backgroundColor: colors.primary }]} />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('membros')} activeOpacity={0.7}>
            <ThemedText
              style={[
                styles.tabText,
                {
                  color: activeTab === 'membros' ? colors.primary : colors.textSecondary,
                  fontWeight: activeTab === 'membros' ? '700' : '500',
                },
              ]}>
              Membros ({members.length})
            </ThemedText>
            {activeTab === 'membros' && <View style={[styles.tabIndicator, { backgroundColor: colors.primary }]} />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('chat')} activeOpacity={0.7}>
            <ThemedText
              style={[
                styles.tabText,
                {
                  color: activeTab === 'chat' ? colors.primary : colors.textSecondary,
                  fontWeight: activeTab === 'chat' ? '700' : '500',
                },
              ]}>
              Chat
            </ThemedText>
            {activeTab === 'chat' && <View style={[styles.tabIndicator, { backgroundColor: colors.primary }]} />}
          </TouchableOpacity>
        </View>

        {/* Conteúdo das abas */}
        {activeTab === 'rateios' && (
          <View style={styles.tabContent}>
            {pools.length > 0 ? (
              <View style={styles.poolsList}>
                {pools.map((pool) => (
                  <TouchableOpacity
                    key={pool.id}
                    style={[styles.poolCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => router.push(`/pool/${pool.id}`)}
                    activeOpacity={0.8}>
                    <View style={styles.poolHeader}>
                      <ThemedText type="defaultSemiBold" style={[styles.poolTitle, { color: colors.text }]}>
                        {pool.title}
                      </ThemedText>
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
                    </View>
                    {pool.description && (
                      <ThemedText style={[styles.poolDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                        {pool.description}
                      </ThemedText>
                    )}
                    <View style={styles.poolMeta}>
                      <ThemedText style={[styles.poolAmount, { color: colors.text }]}>
                        R$ {Number(pool.total_amount).toFixed(2)}
                      </ThemedText>
                      <ThemedText style={[styles.poolType, { color: colors.textSecondary }]}>
                        {pool.pool_type === 'one-time' ? 'Único' : pool.pool_type === 'subscription' ? 'Assinatura' : 'Recorrente'}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyEmoji}>💰</ThemedText>
                <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
                  Nenhum rateio ainda
                </ThemedText>
                <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  {isMember && (userRole === 'owner' || userRole === 'admin')
                    ? 'Crie o primeiro rateio do grupo!'
                    : 'Ainda não há rateios neste grupo'}
                </ThemedText>
              </View>
            )}
          </View>
        )}

        {activeTab === 'membros' && (
          <View style={styles.tabContent}>
            {members.length > 0 ? (
              <View style={styles.membersList}>
                {members.map((member) => (
                  <View
                    key={member.user_id}
                    style={[styles.memberCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.memberInfo}>
                      <View style={[styles.memberAvatar, { backgroundColor: colors.primary + '15' }]}>
                        {member.profile?.avatar_url ? (
                          <Image
                            source={{ uri: member.profile.avatar_url }}
                            style={styles.memberAvatarImage}
                            contentFit="cover"
                          />
                        ) : (
                          <ThemedText style={styles.memberAvatarText}>
                            {member.profile?.name?.charAt(0).toUpperCase() || '👤'}
                          </ThemedText>
                        )}
                      </View>
                      <View style={styles.memberDetails}>
                        <ThemedText type="defaultSemiBold" style={[styles.memberName, { color: colors.text }]}>
                          {member.profile?.name || 'Usuário'}
                        </ThemedText>
                        <ThemedText style={[styles.memberUsername, { color: colors.textSecondary }]}>
                          {member.profile?.username || '@usuario'}
                        </ThemedText>
                        <View
                          style={[
                            styles.roleTag,
                            {
                              backgroundColor:
                                member.role === 'owner'
                                  ? '#E74C3C' + '15'
                                  : member.role === 'admin'
                                    ? '#F39C12' + '15'
                                    : '#3498DB' + '15',
                            },
                          ]}>
                          <ThemedText
                            style={[
                              styles.roleTagText,
                              {
                                color:
                                  member.role === 'owner'
                                    ? '#E74C3C'
                                    : member.role === 'admin'
                                      ? '#F39C12'
                                      : '#3498DB',
                              },
                            ]}>
                            {member.role === 'owner' ? 'Dono' : member.role === 'admin' ? 'Admin' : 'Membro'}
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                    {userRole === 'owner' && member.role !== 'owner' && member.user_id !== user?.id && (
                      <View style={styles.memberActions}>
                        {member.role === 'member' && (
                          <TouchableOpacity
                            style={[styles.memberActionButton, { backgroundColor: colors.primary }]}
                            onPress={() => handlePromoteToAdmin(member.user_id)}
                            activeOpacity={0.8}>
                            <MaterialIcons name="star" size={16} color="#FFFFFF" />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={[styles.memberActionButton, { backgroundColor: '#E74C3C' }]}
                          onPress={() => handleRemoveMember(member.user_id)}
                          activeOpacity={0.8}>
                          <MaterialIcons name="remove" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyEmoji}>👥</ThemedText>
                <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>Nenhum membro</ThemedText>
              </View>
            )}
          </View>
        )}

        {activeTab === 'chat' && (
          <View style={styles.tabContent}>
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyEmoji}>💬</ThemedText>
              <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>Chat em breve</ThemedText>
              <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                O chat do grupo estará disponível em breve
              </ThemedText>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
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
  headerContainer: {
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
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
    marginHorizontal: 8,
  },
  scrollView: {
    flex: 1,
  },
  groupHeader: {
    padding: 20,
    gap: 16,
  },
  groupCover: {
    width: '100%',
    height: 200,
    borderRadius: 20,
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
  groupInfo: {
    gap: 8,
  },
  groupName: {
    fontSize: 24,
    fontWeight: '700',
  },
  groupDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  typeTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  memberCount: {
    fontSize: 14,
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
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 2,
  },
  tabContent: {
    paddingBottom: 32,
  },
  poolsList: {
    paddingHorizontal: 20,
    gap: 16,
    marginTop: 20,
  },
  poolCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    gap: 12,
  },
  poolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  poolTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  poolDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  poolMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  poolAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  poolType: {
    fontSize: 13,
    fontWeight: '500',
  },
  membersList: {
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 20,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  memberAvatarImage: {
    width: '100%',
    height: '100%',
  },
  memberAvatarText: {
    fontSize: 20,
  },
  memberDetails: {
    flex: 1,
    gap: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
  },
  memberUsername: {
    fontSize: 13,
  },
  roleTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  roleTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8,
  },
  memberActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
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
});

