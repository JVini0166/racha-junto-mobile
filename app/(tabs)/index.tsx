import { useState, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width } = Dimensions.get('window');

export default function FeedScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [selectedFilter, setSelectedFilter] = useState('Todos');
  const scrollY = useRef(new Animated.Value(0)).current;

  // Filtros
  const filters = ['Todos', 'Viagens', 'Festas', 'Games', 'Assinaturas', 'Outros'];

  // Dados mockados de rateios
  const rateios = [
    {
      id: 1,
      name: 'Churrasco da Firma 🍖',
      group: 'Amigos do Trampo',
      creator: { name: 'João Silva', avatar: '👨' },
      category: 'Festa',
      totalValue: 480,
      participants: 6,
      valuePerPerson: 80,
      progress: 75,
      timeLeft: 'Faltam 2 dias',
      coverEmoji: '🍖',
      friendsCount: 3,
      color: colors.primary,
    },
    {
      id: 2,
      name: 'Viagem para Praia 🏖️',
      group: 'Família',
      creator: { name: 'Maria Santos', avatar: '👩' },
      category: 'Viagem',
      totalValue: 1200,
      participants: 4,
      valuePerPerson: 300,
      progress: 50,
      timeLeft: 'Faltam 5 dias',
      coverEmoji: '🏖️',
      friendsCount: 2,
      color: colors.secondary,
    },
    {
      id: 3,
      name: 'Festa de Aniversário 🎉',
      group: 'Amigos',
      creator: { name: 'Pedro Costa', avatar: '👨' },
      category: 'Festa',
      totalValue: 850,
      participants: 8,
      valuePerPerson: 106.25,
      progress: 100,
      timeLeft: 'Encerrado',
      coverEmoji: '🎉',
      friendsCount: 5,
      color: colors.accent,
    },
  ];

  // Grupos sugeridos
  const suggestedGroups = [
    { id: 1, name: 'Gamers Unidos', members: 132, emoji: '🎮', color: colors.purple },
    { id: 2, name: 'Assinaturas Premium', members: 89, emoji: '📺', color: colors.orange },
    { id: 3, name: 'Viagens Baratas', members: 245, emoji: '✈️', color: colors.teal },
  ];

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [100, 70],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Animated.View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            height: headerHeight,
            opacity: headerOpacity,
            shadowColor: colors.shadow,
          },
        ]}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.headerButton} activeOpacity={0.7}>
            <MaterialIcons name="search" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <ThemedText style={[styles.logo, { color: colors.primary }]}>RachaJunto</ThemedText>
          </View>

          <TouchableOpacity style={styles.headerButton} activeOpacity={0.7}>
            <MaterialIcons name="notifications" size={24} color={colors.text} />
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
        scrollEventThrottle={16}>
        {/* Mensagem de boas-vindas */}
        <View style={styles.welcomeSection}>
          <ThemedText style={[styles.welcomeText, { color: colors.text }]}>
            Bom te ver de novo, João 👋
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

        {/* Cards de Rateio */}
        <View style={styles.rateiosContainer}>
          {rateios.map((rateio, index) => (
            <TouchableOpacity
              key={rateio.id}
              activeOpacity={0.9}
              style={[
                styles.rateioCard,
                {
                  backgroundColor: colors.surface,
                  shadowColor: rateio.color + '20',
                },
              ]}>
              {/* Imagem de capa */}
              <View style={[styles.coverImage, { backgroundColor: rateio.color + '15' }]}>
                <ThemedText style={styles.coverEmoji}>{rateio.coverEmoji}</ThemedText>
              </View>

              <View style={styles.cardContent}>
                {/* Header do card */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <ThemedText type="defaultSemiBold" style={[styles.rateioName, { color: colors.text }]}>
                      {rateio.name}
                    </ThemedText>
                    <View style={styles.groupInfo}>
                      <MaterialIcons name="group" size={14} color={colors.textSecondary} />
                      <ThemedText style={[styles.groupName, { color: colors.textSecondary }]}>
                        {rateio.group}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={[styles.categoryTag, { backgroundColor: rateio.color + '15' }]}>
                    <ThemedText style={[styles.categoryText, { color: rateio.color }]}>
                      {rateio.category}
                    </ThemedText>
                  </View>
                </View>

                {/* Criador */}
                <View style={styles.creatorInfo}>
                  <View style={[styles.avatar, { backgroundColor: colors.borderLight }]}>
                    <ThemedText style={styles.avatarText}>{rateio.creator.avatar}</ThemedText>
                  </View>
                  <ThemedText style={[styles.creatorName, { color: colors.textSecondary }]}>
                    por {rateio.creator.name}
                  </ThemedText>
                  {rateio.friendsCount > 0 && (
                    <View style={styles.friendsBadge}>
                      <ThemedText style={[styles.friendsText, { color: colors.primary }]}>
                        +{rateio.friendsCount} amigos aqui
                      </ThemedText>
                    </View>
                  )}
                </View>

                {/* Valores */}
                <View style={styles.valuesContainer}>
                  <View>
                    <ThemedText style={[styles.valueLabel, { color: colors.textSecondary }]}>
                      Total
                    </ThemedText>
                    <ThemedText style={[styles.totalValue, { color: colors.text }]}>
                      R$ {rateio.totalValue.toFixed(2)}
                    </ThemedText>
                  </View>
                  <View style={styles.divider} />
                  <View>
                    <ThemedText style={[styles.valueLabel, { color: colors.textSecondary }]}>
                      Por pessoa
                    </ThemedText>
                    <ThemedText style={[styles.perPersonValue, { color: colors.primary }]}>
                      R$ {rateio.valuePerPerson.toFixed(2)}
                    </ThemedText>
                  </View>
                  <View style={styles.divider} />
                  <View>
                    <ThemedText style={[styles.valueLabel, { color: colors.textSecondary }]}>
                      {rateio.participants} pessoas
                    </ThemedText>
                    <ThemedText style={[styles.participantsValue, { color: colors.text }]}>
                      {rateio.progress}% preenchido
                    </ThemedText>
                  </View>
                </View>

                {/* Barra de progresso */}
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { backgroundColor: colors.borderLight }]}>
                    <Animated.View
                      style={[
                        styles.progressFill,
                        {
                          width: `${rateio.progress}%`,
                          backgroundColor: rateio.color,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Tempo restante */}
                <View style={styles.timeContainer}>
                  <MaterialIcons name="access-time" size={16} color={colors.textSecondary} />
                  <ThemedText style={[styles.timeText, { color: colors.textSecondary }]}>
                    {rateio.timeLeft}
                  </ThemedText>
                </View>

                {/* Botões de ação */}
                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                    activeOpacity={0.8}>
                    <ThemedText style={styles.primaryButtonText}>Participar</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.secondaryButton, { borderColor: colors.primary }]}
                    activeOpacity={0.7}>
                    <ThemedText style={[styles.secondaryButtonText, { color: colors.primary }]}>
                      Ver grupo
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Seção de Sugestões */}
        <View style={styles.suggestionsSection}>
          <ThemedText style={[styles.suggestionsTitle, { color: colors.text }]}>
            Talvez você curta esses grupos 👇
          </ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsContainer}>
            {suggestedGroups.map((group) => (
              <TouchableOpacity
                key={group.id}
                activeOpacity={0.8}
                style={[
                  styles.groupCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    shadowColor: group.color + '15',
                  },
                ]}>
                <View style={[styles.groupCover, { backgroundColor: group.color + '15' }]}>
                  <ThemedText style={styles.groupEmoji}>{group.emoji}</ThemedText>
                </View>
                <View style={styles.groupCardContent}>
                  <ThemedText type="defaultSemiBold" style={[styles.groupCardName, { color: colors.text }]}>
                    {group.name}
                  </ThemedText>
                  <ThemedText style={[styles.groupMembers, { color: colors.textSecondary }]}>
                    {group.members} membros
                  </ThemedText>
                  <TouchableOpacity
                    style={[styles.joinButton, { backgroundColor: group.color }]}
                    activeOpacity={0.8}>
                    <ThemedText style={styles.joinButtonText}>Entrar</ThemedText>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
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
  rateiosContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 20,
  },
  rateioCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  coverImage: {
    width: '100%',
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverEmoji: {
    fontSize: 64,
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  rateioName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupName: {
    fontSize: 13,
    fontWeight: '500',
  },
  categoryTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
  },
  creatorName: {
    fontSize: 13,
    fontWeight: '500',
  },
  friendsBadge: {
    marginLeft: 'auto',
  },
  friendsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  valuesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  valueLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
  },
  perPersonValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  participantsValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 12,
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
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '500',
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
  suggestionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  suggestionsContainer: {
    gap: 16,
  },
  groupCard: {
    width: 200,
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
  groupEmoji: {
    fontSize: 48,
  },
  groupCardContent: {
    padding: 16,
  },
  groupCardName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  groupMembers: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
  },
  joinButton: {
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
