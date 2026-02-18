import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    TextInput,
    useWindowDimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pact, PACT_CARDS, PieceColor, PactDraftService } from 'chess-core';
import Animated, {
    useAnimatedStyle,
    withSpring,
    useSharedValue,
    withDelay,
} from 'react-native-reanimated';
import { Text } from './Text';
import { useTheme } from '../theme';
import { useTranslation } from '../../i18n';
import { usePactTranslation } from '../hooks/usePactTranslation';

interface PactSelectionModalProps {
    visible: boolean;
    color: PieceColor;
    onSelect: (pact: Pact) => void;
    choicesCount?: number;
    seed?: string;
    excludeIds?: string[];
    roundIndex?: number;
}

export const PactSelectionModal: React.FC<PactSelectionModalProps> = ({
    visible,
    color,
    onSelect,
    choicesCount = 3,
    seed,
    excludeIds = [],
    roundIndex = 0
}) => {
    const [options, setOptions] = useState<Pact[]>([]);
    const [searchText, setSearchText] = useState('');
    const { colors, isDark } = useTheme(); // Added isDark for tint
    const { width } = useWindowDimensions();
    const isLargeScreen = width > 768;
    const { t } = useTranslation();
    const { translatePact } = usePactTranslation();
    const colorName = color === 'white' ? t('common.white') : t('common.black');

    const styles = useMemo(() => createStyles(isLargeScreen, colors), [isLargeScreen, colors]);

    useEffect(() => {
        if (visible) {
            if (searchText) {
                if (__DEV__) {
                    const filtered = PACT_CARDS.filter(pact => {
                        const translated = translatePact(pact);
                        if (!translated) return false;
                        const search = searchText.toLowerCase();
                        return (
                            translated.title.toLowerCase().includes(search) ||
                            translated.description.toLowerCase().includes(search) ||
                            pact.id.toLowerCase().includes(search)
                        );
                    });
                    setOptions(filtered);
                }
            } else {
                // Use the configured number of choices
                const choices = PactDraftService.generateChoices(
                    choicesCount,
                    seed ? `${seed}-${color}-${roundIndex}` : undefined,
                    excludeIds
                );
                setOptions(choices);
            }
        }
    }, [visible, color, searchText, translatePact, choicesCount, seed, roundIndex, excludeIds]);

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.container}>
                <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />

                <SafeAreaWrapper style={styles.safeArea}>
                    <View style={styles.content}>
                        <View>
                            <Text variant="title" bold style={styles.header}>{t('pact.title')}</Text>
                            <Text style={styles.subHeader}>
                                {t('pact.subtitle', { color: colorName })}
                            </Text>
                        </View>

                        {__DEV__ && (
                            <View style={styles.searchContainer}>
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder={t('pact.searchPlaceholder')}
                                    placeholderTextColor={colors.textSecondary}
                                    value={searchText}
                                    onChangeText={setSearchText}
                                    autoCorrect={false}
                                    clearButtonMode="while-editing"
                                />
                            </View>
                        )}

                        <ScrollView
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.cardsContainer}>
                                {options.length === 0 && (
                                    <Text style={{ color: colors.text, textAlign: 'center' }}>Loading Pacts...</Text>
                                )}
                                {options.map((pact, index) => (
                                    <PactCard
                                        key={pact.id}
                                        pact={translatePact(pact)}
                                        index={index}
                                        onSelect={() => onSelect(pact)}
                                        isLargeScreen={isLargeScreen}
                                        styles={styles}
                                    />
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                </SafeAreaWrapper>
            </View>
        </Modal>
    );
};

const SafeAreaWrapper: React.FC<{ children: React.ReactNode, style?: any }> = ({ children, style }) => (
    <View style={style}>
        {children}
    </View>
);

interface PactCardProps {
    pact: {
        id: string;
        title: string;
        description: string;
        bonus: { id: string; name: string; description: string; icon: string; };
        malus: { id: string; name: string; description: string; icon: string; };
    } | null;
    onSelect: () => void;
    index: number;
    isLargeScreen: boolean;
    styles: any;
}

const PactCard: React.FC<PactCardProps> = ({ pact, onSelect, index, isLargeScreen, styles }) => {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0);

    if (!pact) return null;

    useEffect(() => {
        opacity.value = withDelay(300 + index * 100, withSpring(1));
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: withSpring(scale.value) }],
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[styles.cardWrapper, animatedStyle]}
        >
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={onSelect}
                onPressIn={() => (scale.value = 0.98)}
                onPressOut={() => (scale.value = 1)}
                style={styles.card}
            >
                <View style={styles.cardHeader}>
                    <Text variant="body" bold style={styles.cardTitle}>
                        {pact.title.toUpperCase()}
                    </Text>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.perkSection}>
                        <View style={styles.perkLabel}>
                            <MaterialCommunityIcons name="lightning-bolt" size={14} color={colors.success} />
                            <Text variant="caption" bold style={{ color: colors.success, marginLeft: 4 }}>{t('pact.ascension')}</Text>
                        </View>
                        <View style={styles.perkInfo}>
                            <View style={styles.iconBox}>
                                <MaterialCommunityIcons name={pact.bonus.icon as any} size={20} color={colors.primary} />
                            </View>
                            <View style={styles.perkText}>
                                <Text variant="body" bold style={styles.perkName}>{pact.bonus.name}</Text>
                                <Text variant="caption" color="secondary" style={styles.perkDesc}>{pact.bonus.description}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.perkSection}>
                        <View style={styles.perkLabel}>
                            <MaterialCommunityIcons name="skull" size={12} color={colors.danger} />
                            <Text variant="caption" bold style={{ color: colors.danger, marginLeft: 4 }}>{t('pact.sacrifice')}</Text>
                        </View>
                        <View style={styles.perkInfo}>
                            <View style={styles.iconBox}>
                                <MaterialCommunityIcons name={pact.malus.icon as any} size={20} color={colors.danger} />
                            </View>
                            <View style={styles.perkText}>
                                <Text variant="body" bold style={styles.perkName}>{pact.malus.name}</Text>
                                <Text variant="caption" color="secondary" style={styles.perkDesc}>{pact.malus.description}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.cardFooter}>
                        <Text variant="caption" style={styles.flavorText}>"{pact.description}"</Text>
                        <View style={styles.selectBtn}>
                            <Text variant="body" bold style={{ color: colors.primaryForeground || '#fff' }}>{t('pact.embrace')}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const createStyles = (isLargeScreen: boolean, colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    safeArea: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    content: {
        backgroundColor: colors.surface,
        borderRadius: isLargeScreen ? 0 : 32,
        flex: 1,
        maxHeight: isLargeScreen ? '100%' : '85%',
        width: isLargeScreen ? '100%' : '90%',
        alignSelf: 'center',
        borderWidth: isLargeScreen ? 0 : 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    header: {
        fontSize: isLargeScreen ? 48 : 28,
        textAlign: 'center',
        marginTop: isLargeScreen ? 60 : 30,
        color: colors.text,
    },
    subHeader: {
        fontSize: isLargeScreen ? 20 : 14,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 12,
        paddingHorizontal: 40,
        marginBottom: 20,
    },
    searchContainer: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    searchInput: {
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 16,
        fontSize: 16,
        color: colors.text,
        borderColor: colors.border,
        backgroundColor: colors.background,
    },
    scrollContent: {
        paddingBottom: 30,
    },
    cardsContainer: {
        paddingHorizontal: 16,
    },
    cardWrapper: {
        marginBottom: 20,
    },
    card: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 4,
        maxWidth: isLargeScreen ? 600 : '100%',
        alignSelf: 'center',
        width: '100%',
        backgroundColor: colors.surface,
        borderColor: colors.border,
    },
    cardHeader: {
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.surfaceHighlight || colors.background,
    },
    cardTitle: {
        fontSize: isLargeScreen ? 20 : 14,
        letterSpacing: 2,
        color: colors.primary,
    },
    cardBody: {
        padding: isLargeScreen ? 24 : 16,
    },
    perkSection: {
        marginBottom: isLargeScreen ? 20 : 12,
    },
    perkLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        opacity: 0.8,
    },
    perkInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: isLargeScreen ? 56 : 40,
        height: isLargeScreen ? 56 : 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.background,
    },
    perkText: {
        flex: 1,
        marginLeft: 16,
    },
    perkName: {
        fontSize: isLargeScreen ? 22 : 16,
        color: colors.text,
    },
    perkDesc: {
        fontSize: isLargeScreen ? 16 : 12,
        marginTop: 4,
        lineHeight: isLargeScreen ? 24 : 16,
        color: colors.textSecondary,
    },
    divider: {
        height: 1,
        marginVertical: 12,
        opacity: 0.3,
        backgroundColor: colors.border,
    },
    cardFooter: {
        marginTop: 15,
    },
    flavorText: {
        fontSize: isLargeScreen ? 14 : 11,
        fontStyle: 'italic',
        textAlign: 'center',
        opacity: 0.6,
        marginBottom: 20,
        color: colors.textSecondary,
    },
    selectBtn: {
        paddingVertical: isLargeScreen ? 16 : 12,
        borderRadius: 14,
        alignItems: 'center',
        backgroundColor: colors.primary,
    }
});
