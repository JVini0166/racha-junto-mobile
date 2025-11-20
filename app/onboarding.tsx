import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    icon: 'groups',
    title: 'Crie rateios com amigos',
    description: 'Organize despesas em grupo de forma simples e rápida. Divida contas, viagens e muito mais!',
    color: '#FFFFFF',
    gradient: ['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.1)'],
  },
  {
    id: 2,
    icon: 'explore',
    title: 'Participe de grupos',
    description: 'Entre em grupos temáticos e encontre pessoas com os mesmos interesses para rachar custos.',
    color: '#FFFFFF',
    gradient: ['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.1)'],
  },
  {
    id: 3,
    icon: 'account-balance-wallet',
    title: 'Pague e receba fácil',
    description: 'Transações seguras e rápidas. Receba o que te deve e pague o que deve, tudo em um só lugar.',
    color: '#FFFFFF',
    gradient: ['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.1)'],
  },
];

export default function OnboardingScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const iconScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Resetar animações ao mudar de slide
    iconScaleAnim.setValue(1);

    // Animação suave e contínua de flutuação vertical
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(iconScaleAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(iconScaleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    floatAnimation.start();

    return () => {
      floatAnimation.stop();
    };
  }, [currentIndex]);


  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
      setCurrentIndex(nextIndex);
      animateSlide();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      scrollViewRef.current?.scrollTo({
        x: prevIndex * width,
        animated: true,
      });
      setCurrentIndex(prevIndex);
      animateSlide();
    }
  };

  const animateSlide = () => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.8);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSkip = async () => {
    await SecureStore.setItemAsync('hasSeenOnboarding', 'true');
    router.replace('/login');
  };

  const handleCreateAccount = async () => {
    await SecureStore.setItemAsync('hasSeenOnboarding', 'true');
    router.replace('/login');
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    if (index !== currentIndex) {
      setCurrentIndex(index);
      animateSlide();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.primary }]} edges={['top']}>
      {/* Botão Pular */}
      <View style={styles.skipContainer}>
        <TouchableOpacity onPress={handleSkip} activeOpacity={0.7} style={styles.skipButton}>
          <ThemedText style={[styles.skipText, { color: '#FFFFFF' }]}>Pular</ThemedText>
        </TouchableOpacity>
      </View>

      {/* ScrollView com os slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}>
        {onboardingData.map((item, index) => {
          const isActive = index === currentIndex;

          // Animação de translação vertical suave
          const translateY = iconScaleAnim.interpolate({
            inputRange: [1, 1.05],
            outputRange: [0, -8],
          });

          return (
            <View key={item.id} style={[styles.slide, { width }]}>
              <Animated.View
                style={[
                  styles.slideContent,
                  {
                    opacity: isActive ? fadeAnim : 0.3,
                    transform: [{ scale: isActive ? scaleAnim : 0.9 }],
                  },
                ]}>
                {/* Container do Ícone com efeitos */}
                <View style={styles.iconWrapper}>
                  {/* Container principal do ícone */}
                  <Animated.View
                    style={[
                      styles.iconContainer,
                      {
                        transform: [
                          { scale: iconScaleAnim },
                          { translateY: isActive ? translateY : 0 },
                        ],
                      },
                    ]}>
                    <MaterialIcons name={item.icon as any} size={80} color="#FFFFFF" style={styles.iconStyle} />
                  </Animated.View>
                </View>

              {/* Título */}
              <View style={styles.titleContainer}>
                <ThemedText type="title" style={[styles.title, { color: '#FFFFFF' }]} numberOfLines={2}>
                  {item.title}
                </ThemedText>
              </View>

                {/* Descrição */}
                <ThemedText style={[styles.description, { color: 'rgba(255, 255, 255, 0.95)' }]}>
                  {item.description}
                </ThemedText>
              </Animated.View>
            </View>
          );
        })}
      </ScrollView>

      {/* Indicadores de página */}
      <View style={styles.indicators}>
        {onboardingData.map((_, index) => {
          const isActive = index === currentIndex;
          return (
            <Animated.View
              key={index}
              style={[
                styles.indicator,
                {
                  backgroundColor: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)',
                  width: isActive ? 32 : 8,
                  transform: [
                    {
                      scale: isActive
                        ? iconScaleAnim.interpolate({
                            inputRange: [1, 1.1],
                            outputRange: [1, 1.1],
                          })
                        : 1,
                    },
                  ],
                },
              ]}
            />
          );
        })}
      </View>

      {/* Botões de navegação */}
      <View style={styles.buttonsContainer}>
        {currentIndex > 0 && (
          <TouchableOpacity
            onPress={handlePrevious}
            activeOpacity={0.7}
            style={[styles.navButton, { borderColor: 'rgba(255, 255, 255, 0.5)' }]}>
            <View style={styles.navButtonContent}>
              <MaterialIcons name="arrow-back" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        )}

        {currentIndex < onboardingData.length - 1 ? (
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.9}
            style={[styles.nextButton, { backgroundColor: '#FFFFFF' }]}>
            <ThemedText style={[styles.nextButtonText, { color: colors.primary }]}>Próximo</ThemedText>
            <Animated.View
              style={{
                transform: [
                  {
                    translateX: iconScaleAnim.interpolate({
                      inputRange: [1, 1.1],
                      outputRange: [0, 4],
                    }),
                  },
                ],
              }}>
              <MaterialIcons name="arrow-forward" size={22} color={colors.primary} />
            </Animated.View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleCreateAccount}
            activeOpacity={0.9}
            style={[styles.createButton, { backgroundColor: '#FFFFFF' }]}>
            <MaterialIcons name="person-add" size={22} color={colors.primary} style={{ marginRight: 8 }} />
            <ThemedText style={[styles.createButtonText, { color: colors.primary }]}>Criar conta</ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: 'flex-end',
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  slideContent: {
    alignItems: 'center',
    width: '100%',
  },
  iconWrapper: {
    position: 'relative',
    marginBottom: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  iconStyle: {
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  titleContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
    minHeight: 100,
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    includeFontPadding: false,
    lineHeight: 44,
  },
  description: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: 32,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    shadowColor: '#FFFFFF',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 12,
  },
  navButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
  },
  navButtonContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 24,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  createButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 24,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

