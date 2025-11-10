import { useState, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  Animated,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function GroupsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [activeTab, setActiveTab] = useState<'meus' | 'explorar'>('meus');
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Dados mockados - Meus Grupos
  const meusGrupos = [
    {
      id: 1,
      name: 'Amigos do Trampo',
      members: 12,
      activeRateios: 3,
      type: 'public',
      coverEmoji: '💼',
      hasNewMessages: true,
      color: colors.primary,
    },
    {
      id: 2,
      name: 'Família',
      members: 8,
      activeRateios: 1,
      type: 'private',
      coverEmoji: '👨‍👩‍👧‍👦',
      hasNewMessages: false,
      color: colors.secondary,
    },
    {
      id: 3,
      name: 'Viagens Baratas',
      members: 45,
      activeRateios: 5,
      type: 'public',
      coverEmoji: '✈️',
      hasNewMessages: true,
      color: colors.teal,
    },
  ];

  // Dados mockados - Explorar
  const gruposDestaque = [
    {
      id: 101,
      name: 'Gamers Unidos',
      members: 132,
      activeRateios: 8,
      type: 'public',
      coverEmoji: '🎮',
      description: 'Para quem ama jogos e quer rachar assinaturas',
      color: colors.purple,
    },
    {
      id: 102,
      name: 'Assinaturas Premium',
      members: 89,
      activeRateios: 12,
      type: 'public',
      coverEmoji: '📺',
      description: 'Netflix, Spotify, Amazon Prime e mais',
      color: colors.orange,
    },
  ];

  const gruposPopulares = [
    {
      id: 201,
      name: 'Churrasco Semanal',
      members: 24,
      activeRateios: 2,
      type: 'public',
      coverEmoji: '🍖',
      description: 'Todo domingo tem churrasco',
      color: colors.accent,
    },
    {
      id: 202,
      name: 'Festas e Eventos',
      members: 67,
      activeRateios: 4,
      type: 'public',
      coverEmoji: '🎉',
      description: 'Organize festas e divida os custos',
      color: colors.pink,
    },
    {
      id: 203,
      name: 'Casa Compartilhada',
      members: 5,
      activeRateios: 1,
      type: 'private',
      coverEmoji: '🏠',
      description: 'Despesas da casa',
      color: colors.cyan,
    },
  ];

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const searchBarOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const searchBarHeight = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [60, 0],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
        <View style={styles.headerContent}>
          <ThemedText type="title" style={[styles.headerTitle, { color: colors.text }]}>
            Grupos
          </ThemedText>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}>
            <MaterialIcons name="add" size={20} color="#FFFFFF" />
            <ThemedText style={styles.createButtonText}>Criar</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Campo de busca animado */}
        <Animated.View
          style={[
            styles.searchContainer,
            {
              opacity: searchBarOpacity,
              height: searchBarHeight,
            },
          ]}>
          <View style={[styles.searchBox, { backgroundColor: colors.borderLight, borderColor: colors.border }]}>
            <MaterialIcons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Buscar grupos ou interesses…"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </Animated.View>
      </View>

      {/* Abas de navegação */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab('meus')}
          activeOpacity={0.7}>
          <ThemedText
            style={[
              styles.tabText,
              {
                color: activeTab === 'meus' ? colors.primary : colors.textSecondary,
                fontWeight: activeTab === 'meus' ? '700' : '500',
              },
            ]}>
            Meus Grupos
          </ThemedText>
          {activeTab === 'meus' && <View style={[styles.tabIndicator, { backgroundColor: colors.primary }]} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab('explorar')}
          activeOpacity={0.7}>
          <ThemedText
            style={[
              styles.tabText,
              {
                color: activeTab === 'explorar' ? colors.primary : colors.textSecondary,
                fontWeight: activeTab === 'explorar' ? '700' : '500',
              },
            ]}>
            Explorar
          </ThemedText>
          {activeTab === 'explorar' && (
            <View style={[styles.tabIndicator, { backgroundColor: colors.primary }]} />
          )}
        </TouchableOpacity>
      </View>

      {/* Conteúdo das abas */}
      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        {activeTab === 'meus' ? (
          <View style={styles.content}>
            {/* Mensagem de boas-vindas */}
            <View style={styles.welcomeSection}>
              <ThemedText style={[styles.welcomeText, { color: colors.text }]}>
                Encontre sua galera 👋
              </ThemedText>
            </View>

            {/* Lista de grupos */}
            {meusGrupos.length > 0 ? (
              <View style={styles.groupsList}>
                {meusGrupos.map((grupo, index) => (
                  <TouchableOpacity
                    key={grupo.id}
                    activeOpacity={0.8}
                    style={[
                      styles.groupCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        shadowColor: grupo.color + '15',
                      },
                    ]}>
                    {/* Foto de capa */}
                    <View style={[styles.groupCover, { backgroundColor: grupo.color + '15' }]}>
                      <ThemedText style={styles.groupCoverEmoji}>{grupo.coverEmoji}</ThemedText>
                    </View>

                    <View style={styles.groupCardContent}>
                      <View style={styles.groupHeader}>
                        <View style={styles.groupInfo}>
                          <ThemedText type="defaultSemiBold" style={[styles.groupName, { color: colors.text }]}>
                            {grupo.name}
                          </ThemedText>
                          <View style={styles.groupMeta}>
                            <ThemedText style={[styles.groupMetaText, { color: colors.textSecondary }]}>
                              {grupo.members} membros
                            </ThemedText>
                            <View style={styles.metaDot} />
                            <ThemedText style={[styles.groupMetaText, { color: colors.textSecondary }]}>
                              {grupo.activeRateios} rateios ativos
                            </ThemedText>
                          </View>
                        </View>
                        {grupo.hasNewMessages && (
                          <View style={[styles.chatBadge, { backgroundColor: colors.primary }]}>
                            <MaterialIcons name="chat" size={14} color="#FFFFFF" />
                          </View>
                        )}
                      </View>

                      <View style={styles.groupFooter}>
                        <View
                          style={[
                            styles.typeTag,
                            {
                              backgroundColor: grupo.type === 'public' ? '#2ECC71' + '15' : '#F39C12' + '15',
                            },
                          ]}>
                          <ThemedText
                            style={[
                              styles.typeTagText,
                              { color: grupo.type === 'public' ? '#2ECC71' : '#F39C12' },
                            ]}>
                            {grupo.type === 'public' ? 'Público' : 'Privado'}
                          </ThemedText>
                        </View>
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: colors.primary }]}
                          activeOpacity={0.8}>
                          <ThemedText style={styles.actionButtonText}>Abrir</ThemedText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyEmoji}>👥</ThemedText>
                <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
                  Você ainda não participa de nenhum grupo 😅
                </ThemedText>
                <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  Que tal criar o seu ou explorar alguns?
                </ThemedText>
                <View style={styles.emptyActions}>
                  <TouchableOpacity
                    style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                    activeOpacity={0.8}>
                    <ThemedText style={styles.emptyButtonText}>Criar grupo</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.emptyButtonSecondary, { borderColor: colors.primary }]}
                    activeOpacity={0.8}
                    onPress={() => setActiveTab('explorar')}>
                    <ThemedText style={[styles.emptyButtonTextSecondary, { color: colors.primary }]}>
                      Explorar públicos
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.content}>
            {/* Seção Em Destaque */}
            <View style={styles.section}>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>🔥 Em destaque</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {gruposDestaque.map((grupo) => (
                  <TouchableOpacity
                    key={grupo.id}
                    activeOpacity={0.8}
                    style={[
                      styles.featuredCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        shadowColor: grupo.color + '20',
                      },
                    ]}>
                    <View style={[styles.featuredCover, { backgroundColor: grupo.color + '15' }]}>
                      <ThemedText style={styles.featuredEmoji}>{grupo.coverEmoji}</ThemedText>
                    </View>
                    <View style={styles.featuredContent}>
                      <ThemedText type="defaultSemiBold" style={[styles.featuredName, { color: colors.text }]}>
                        {grupo.name}
                      </ThemedText>
                      <ThemedText style={[styles.featuredDescription, { color: colors.textSecondary }]}>
                        {grupo.description}
                      </ThemedText>
                      <View style={styles.featuredMeta}>
                        <ThemedText style={[styles.featuredMetaText, { color: colors.textSecondary }]}>
                          {grupo.members} membros
                        </ThemedText>
                        <View style={styles.metaDot} />
                        <ThemedText style={[styles.featuredMetaText, { color: colors.textSecondary }]}>
                          {grupo.activeRateios} rateios
                        </ThemedText>
                      </View>
                      <TouchableOpacity
                        style={[styles.verGrupoButton, { backgroundColor: grupo.color }]}
                        activeOpacity={0.8}>
                        <ThemedText style={styles.verGrupoButtonText}>Ver grupo</ThemedText>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Seção Populares */}
            <View style={styles.section}>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                💬 Populares na semana
              </ThemedText>
              <View style={styles.groupsList}>
                {gruposPopulares.map((grupo) => (
                  <TouchableOpacity
                    key={grupo.id}
                    activeOpacity={0.8}
                    style={[
                      styles.groupCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        shadowColor: grupo.color + '15',
                      },
                    ]}>
                    <View style={[styles.groupCover, { backgroundColor: grupo.color + '15' }]}>
                      <ThemedText style={styles.groupCoverEmoji}>{grupo.coverEmoji}</ThemedText>
                    </View>

                    <View style={styles.groupCardContent}>
                      <View style={styles.groupHeader}>
                        <View style={styles.groupInfo}>
                          <ThemedText type="defaultSemiBold" style={[styles.groupName, { color: colors.text }]}>
                            {grupo.name}
                          </ThemedText>
                          <ThemedText style={[styles.groupDescription, { color: colors.textSecondary }]}>
                            {grupo.description}
                          </ThemedText>
                          <View style={styles.groupMeta}>
                            <ThemedText style={[styles.groupMetaText, { color: colors.textSecondary }]}>
                              {grupo.members} membros
                            </ThemedText>
                            <View style={styles.metaDot} />
                            <ThemedText style={[styles.groupMetaText, { color: colors.textSecondary }]}>
                              {grupo.activeRateios} rateios ativos
                            </ThemedText>
                          </View>
                        </View>
                      </View>

                      <View style={styles.groupFooter}>
                        <View
                          style={[
                            styles.typeTag,
                            {
                              backgroundColor: grupo.type === 'public' ? '#2ECC71' + '15' : '#F39C12' + '15',
                            },
                          ]}>
                          <ThemedText
                            style={[
                              styles.typeTagText,
                              { color: grupo.type === 'public' ? '#2ECC71' : '#F39C12' },
                            ]}>
                            {grupo.type === 'public' ? 'Público' : 'Privado'}
                          </ThemedText>
                        </View>
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: colors.primary }]}
                          activeOpacity={0.8}>
                          <ThemedText style={styles.actionButtonText}>Entrar</ThemedText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
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
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
  },
  groupsList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  groupCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  groupCover: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupCoverEmoji: {
    fontSize: 48,
  },
  groupCardContent: {
    padding: 16,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  groupDescription: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 8,
    lineHeight: 20,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupMetaText: {
    fontSize: 13,
    fontWeight: '500',
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  chatBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  typeTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
    marginBottom: 32,
    lineHeight: 22,
  },
  emptyActions: {
    width: '100%',
    gap: 12,
  },
  emptyButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyButtonSecondary: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  emptyButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  horizontalScroll: {
    paddingLeft: 20,
  },
  featuredCard: {
    width: 280,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginRight: 16,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  featuredCover: {
    width: '100%',
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredEmoji: {
    fontSize: 56,
  },
  featuredContent: {
    padding: 16,
  },
  featuredName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  featuredDescription: {
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 12,
    lineHeight: 18,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  featuredMetaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  verGrupoButton: {
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  verGrupoButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
