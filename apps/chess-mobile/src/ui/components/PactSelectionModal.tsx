
import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pact, PACT_CARDS } from 'chess-core';
import { PieceColor } from 'chess-core';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeOut,
    useAnimatedStyle,
    withSpring,
    useSharedValue,
    withDelay,
} from 'react-native-reanimated';
import { Text } from './Text';
import { useTheme } from '../theme';
import { useTranslation } from '../../i18n';
import { usePactTranslation } from '../hooks/usePactTranslation';

const { width, height } = Dimensions.get('window');
const isLargeScreen = width > 768;

interface PactSelectionModalProps {
    visible: boolean;
    color: PieceColor;
    onSelect: (pact: Pact) => void;
}

export const PactSelectionModal: React.FC<PactSelectionModalProps> = ({
    visible,
    color,
    onSelect
}) => {
    const [options, setOptions] = useState<Pact[]>([]);
    const { colors, spacing } = useTheme();
    const { t } = useTranslation();
    const { translatePact } = usePactTranslation();
    const colorName = color === 'white' ? t('common.white') : t('common.black');

    useEffect(() => {
        if (visible) {
            // Pick 3 random pacts for the current player
            const shuffled = [...PACT_CARDS].sort(() => 0.5 - Math.random());
            setOptions(shuffled.slice(0, 3));
        }
    }, [visible, color]);

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.container}>
                <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />

                <SafeAreaWrapper>
                    <View style={styles.content}>
                        <View>
                            <Text variant="title" bold style={styles.header}>{t('pact.title')}</Text>
                            <Text style={styles.subHeader}>
                                {t('pact.subtitle', { color: colorName })}
                            </Text>
                        </View>

                        <ScrollView
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.cardsContainer}>
                                {options.length === 0 && (
                                    <Text style={{ color: 'white', textAlign: 'center' }}>Loading Pacts...</Text>
                                )}
                                {options.map((pact, index) => (
                                    <PactCard
                                        key={pact.id}
                                        pact={translatePact(pact)}
                                        index={index}
                                        onSelect={() => onSelect(pact)}
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

const SafeAreaWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <View style={styles.safeArea}>
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
}

const PactCard: React.FC<PactCardProps> = ({ pact, onSelect, index }) => {
    const { colors, spacing } = useTheme();
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
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
                <View style={[styles.cardHeader, { backgroundColor: colors.primary + '10' }]}>
                    <Text variant="body" bold style={[styles.cardTitle, { color: colors.primary }]}>
                        {pact.title.toUpperCase()}
                    </Text>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.perkSection}>
                        <View style={styles.perkLabel}>
                            <MaterialCommunityIcons name="lightning-bolt" size={14} color="#4ade80" />
                            <Text variant="caption" bold style={{ color: '#4ade80', marginLeft: 4 }}>{t('pact.ascension')}</Text>
                        </View>
                        <View style={styles.perkInfo}>
                            <View style={[styles.iconBox, { backgroundColor: colors.background }]}>
                                <MaterialCommunityIcons name={pact.bonus.icon as any} size={20} color={colors.primary} />
                            </View>
                            <View style={styles.perkText}>
                                <Text variant="body" bold style={styles.perkName}>{pact.bonus.name}</Text>
                                <Text variant="caption" color="secondary" style={styles.perkDesc}>{pact.bonus.description}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <View style={styles.perkSection}>
                        <View style={styles.perkLabel}>
                            <MaterialCommunityIcons name="skull" size={12} color="#f87171" />
                            <Text variant="caption" bold style={{ color: '#f87171', marginLeft: 4 }}>{t('pact.sacrifice')}</Text>
                        </View>
                        <View style={styles.perkInfo}>
                            <View style={[styles.iconBox, { backgroundColor: colors.background }]}>
                                <MaterialCommunityIcons name={pact.malus.icon as any} size={20} color="#f87171" />
                            </View>
                            <View style={styles.perkText}>
                                <Text variant="body" bold style={styles.perkName}>{pact.malus.name}</Text>
                                <Text variant="caption" color="secondary" style={styles.perkDesc}>{pact.malus.description}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.cardFooter}>
                        <Text variant="caption" style={styles.flavorText}>"{pact.description}"</Text>
                        <View style={[styles.selectBtn, { backgroundColor: colors.primary }]}>
                            <Text variant="body" bold style={{ color: '#fff' }}>{t('pact.embrace')}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
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
        backgroundColor: '#0a0a0a',
        borderRadius: isLargeScreen ? 0 : 32,
        flex: isLargeScreen ? 1 : 0,
        maxHeight: isLargeScreen ? '100%' : '85%',
        width: isLargeScreen ? '100%' : '90%',
        alignSelf: 'center',
        borderWidth: isLargeScreen ? 0 : 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    header: {
        fontSize: isLargeScreen ? 48 : 28,
        textAlign: 'center',
        marginTop: isLargeScreen ? 60 : 30,
        color: '#fff',
    },
    subHeader: {
        fontSize: isLargeScreen ? 20 : 14,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        marginTop: 12,
        paddingHorizontal: 40,
        marginBottom: 30,
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
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
        maxWidth: isLargeScreen ? 600 : '100%',
        alignSelf: 'center',
        width: '100%',
    },
    cardHeader: {
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    cardTitle: {
        fontSize: isLargeScreen ? 20 : 14,
        letterSpacing: 2,
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
        borderColor: 'rgba(255,255,255,0.05)',
    },
    perkText: {
        flex: 1,
        marginLeft: 16,
    },
    perkName: {
        fontSize: isLargeScreen ? 22 : 16,
    },
    perkDesc: {
        fontSize: isLargeScreen ? 16 : 12,
        marginTop: 4,
        lineHeight: isLargeScreen ? 24 : 16,
    },
    divider: {
        height: 1,
        marginVertical: 12,
        opacity: 0.3,
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
    },
    selectBtn: {
        paddingVertical: isLargeScreen ? 16 : 12,
        borderRadius: 14,
        alignItems: 'center',
    }
});
