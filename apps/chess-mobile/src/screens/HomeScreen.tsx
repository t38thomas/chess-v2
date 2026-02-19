import React, { useEffect, useRef } from 'react';

import { View, StyleSheet, Animated, Pressable, useWindowDimensions, TextInput, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '../ui/responsive/Screen';
import { Container } from '../ui/responsive/Container';
import { useBreakpoint } from '../ui/responsive/useBreakpoint';
import { Text } from '../ui/components/Text';
import { Icon } from '../ui/components/Icon';
import { IconButton } from '../ui/components/IconButton';
import { Button } from '../ui/components/Button';
import { SettingsModal } from '../ui/components/SettingsModal';
import { openSupportEmail } from '../shared/supportEmail';
import { useTranslation } from '../i18n';
import { useTheme } from '../ui/theme';

interface HomeScreenProps {
    onNavigate: (screen: 'local' | 'online') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
    const { spacing, colors } = useTheme();
    const { t } = useTranslation();
    const { bp } = useBreakpoint();
    const isWide = bp !== 'xs'; // Simple logic for now, or match width > 600
    const [settingsVisible, setSettingsVisible] = React.useState(false);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim1 = useRef(new Animated.Value(0.8)).current;
    const scaleAnim2 = useRef(new Animated.Value(0.8)).current;

    const [username, setUsername] = React.useState('');

    useEffect(() => {
        // Load username
        AsyncStorage.getItem('chess_username').then(val => {
            if (val) setUsername(val);
        });

        Animated.stagger(150, [
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]),
            Animated.spring(scaleAnim1, {
                toValue: 1,
                friction: 7,
                tension: 40,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim2, {
                toValue: 1,
                friction: 7,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);



    const renderGameCard = (
        title: string,
        subtitle: string,
        icon: string,
        color: string,
        onPress: () => void,
        scaleAnim: Animated.Value
    ) => {
        const pressScale = useRef(new Animated.Value(1)).current;

        const handlePressIn = () => {
            Animated.spring(pressScale, {
                toValue: 0.95,
                useNativeDriver: true,
            }).start();
        };

        const handlePressOut = () => {
            Animated.spring(pressScale, {
                toValue: 1,
                friction: 3,
                useNativeDriver: true,
            }).start();
        };

        return (
            <Animated.View style={{ transform: [{ scale: Animated.multiply(scaleAnim, pressScale) }] }}>
                <Pressable
                    onPress={onPress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    style={[
                        styles.gameCard,
                        {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                            width: isWide ? 280 : '100%',
                        }
                    ]}
                >
                    {/* Icon Circle */}
                    <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}>
                        <Icon name={icon as any} size={40} color={color} />
                    </View>

                    {/* Title & Subtitle */}
                    <Text variant="title" bold style={{ marginTop: spacing[3], marginBottom: spacing[1] }}>
                        {title}
                    </Text>
                    <Text variant="caption" color="secondary" style={{ textAlign: 'center' }}>
                        {subtitle}
                    </Text>

                    {/* Arrow Icon */}
                    <View style={styles.arrowIcon}>
                        <Icon name="arrow-right" size={20} color={colors.textSecondary} />
                    </View>
                </Pressable>
            </Animated.View>
        );
    };

    return (
        <Screen>
            <Container>
                <ScrollView>
                    <View style={styles.container}>
                        {/* Settings Button */}
                        <View style={styles.soundToggle}>
                            <IconButton
                                icon="cog"
                                onPress={() => setSettingsVisible(true)}
                                variant="secondary"
                            />
                        </View>

                        {/* Decorative Chess Pieces (Background) */}
                        <View style={styles.decorativeLeft}>
                            <Icon name="chess-queen" size={120} color={colors.textMuted} style={{ opacity: 0.06 }} />
                        </View>
                        <View style={styles.decorativeRight}>
                            <Icon name="chess-king" size={100} color={colors.textMuted} style={{ opacity: 0.06 }} />
                        </View>

                        {/* Hero Section */}
                        <Animated.View
                            style={[
                                styles.heroSection,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideAnim }],
                                }
                            ]}
                        >
                            {/* App Icon/Logo */}
                            <View style={[styles.logoContainer, { backgroundColor: colors.primaryMuted }]}>
                                <Icon name="chess-knight" size={48} color={colors.primary} />
                            </View>

                            {/* Title */}
                            <Text
                                variant="title"
                                bold
                                style={{
                                    fontSize: 42,
                                    marginTop: spacing[4],
                                    marginBottom: spacing[2],
                                    textAlign: 'center',
                                    letterSpacing: -1,
                                }}
                            >
                                {t('common.appName')}
                            </Text>

                            {/* Subtitle */}
                            <Text
                                variant="body"
                                color="secondary"
                                style={{
                                    textAlign: 'center',
                                    marginBottom: spacing[6],
                                    opacity: 0.8,
                                }}
                            >
                                {t('home.subtitle')}
                            </Text>
                            {/* Username Input */}
                            <Animated.View style={{
                                opacity: fadeAnim,
                                width: '100%',
                                maxWidth: 300,
                                marginBottom: spacing[6],
                                transform: [{ translateY: slideAnim }]
                            }}>
                                <Text variant="caption" color="secondary" style={{ marginBottom: spacing[1], marginLeft: spacing[1] }}>
                                    {t('home.displayName')}
                                </Text>
                                <TextInput
                                    style={[styles.usernameInput, {
                                        color: colors.text,
                                        backgroundColor: colors.surface,
                                        borderColor: colors.border
                                    }]}
                                    placeholder={t('home.enterUsername')}
                                    placeholderTextColor={colors.textMuted}
                                    value={username}
                                    onChangeText={(text) => {
                                        setUsername(text);
                                        AsyncStorage.setItem('chess_username', text);
                                    }}
                                    maxLength={15}
                                />
                            </Animated.View>
                        </Animated.View>

                        {/* Game Mode Cards */}
                        <View style={[styles.cardsContainer, isWide && { flexDirection: 'row', gap: spacing[4] }]}>
                            {renderGameCard(
                                t('home.localGame'),
                                t('home.localGameDesc'),
                                'chess-pawn',
                                colors.primary,
                                () => onNavigate('local'),
                                scaleAnim1
                            )}
                            {renderGameCard(
                                t('home.onlineMatch'),
                                t('home.onlineMatchDesc'),
                                'earth',
                                colors.secondary,
                                () => onNavigate('online'),
                                scaleAnim2
                            )}
                        </View>

                        {/* Feedback Section */}
                        <View style={[styles.feedbackContainer, { width: '100%', maxWidth: 600 }]}>
                            <Text variant="caption" color="secondary" style={styles.feedbackTitle}>
                                {t('support.feedback').toUpperCase()}
                            </Text>
                            <View style={[
                                styles.feedbackButtons,
                                isWide ? { flexDirection: 'row', justifyContent: "center" } : { flexDirection: 'column' }
                            ]}>
                                <Button
                                    label={t('support.reportBug')}
                                    icon="bug"
                                    variant="secondary"
                                    onPress={() => openSupportEmail({ kind: 'bug' })}
                                    style={{ flex: 1 }}
                                />
                                <Button
                                    label={t('support.proposePact')}
                                    icon="lightbulb-outline"
                                    variant="secondary"
                                    onPress={() => openSupportEmail({ kind: 'pact_idea' })}
                                    style={{ flex: 1 }}
                                />
                            </View>
                        </View>

                        {/* Footer tagline */}
                        <Animated.View style={{ opacity: fadeAnim, marginTop: spacing[6] }}>
                            <Text variant="caption" color="secondary" style={{ textAlign: 'center', opacity: 0.5 }}>
                                {t('home.poweredBy')}
                            </Text>
                        </Animated.View>

                        <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />

                    </View>
                </ScrollView>
            </Container>
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        position: 'relative',
    },
    soundToggle: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
    },
    decorativeLeft: {
        position: 'absolute',
        left: -40,
        top: '20%',
        zIndex: 0,
    },
    decorativeRight: {
        position: 'absolute',
        right: -30,
        bottom: '15%',
        zIndex: 0,
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: 40,
        zIndex: 1,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardsContainer: {
        width: '100%',
        maxWidth: 600,
        gap: 16,
        zIndex: 1,
    },
    feedbackContainer: {
        marginTop: 32,
        zIndex: 1,
    },
    feedbackTitle: {
        textAlign: 'center',
        marginBottom: 12,
        opacity: 0.6,
        letterSpacing: 1,
        fontSize: 11,
    },
    feedbackButtons: {
        gap: 12,
    },
    gameCard: {
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        position: 'relative',
        minHeight: 180,
        justifyContent: 'center',
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    arrowIcon: {
        position: 'absolute',
        bottom: 16,
        right: 16,
    },
    usernameInput: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        textAlign: 'center',
    },
});
