import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PACT_CARDS, PieceColor, TurnCounter } from 'chess-core';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from '../../i18n';
import { useTheme } from '../theme';
import { Text } from './Text';
import { IconName } from './Icon';

interface PactTurnCounterProps {
    turnCounters: Record<PieceColor | 'both', TurnCounter[]>;
    bottomColor?: PieceColor; // To highlight 'Your' counters if needed
}

export const PactTurnCounter: React.FC<PactTurnCounterProps> = ({ turnCounters, bottomColor }) => {
    const { colors } = useTheme();
    const { t } = useTranslation();

    const renderSection = (color: PieceColor | 'both', counters: TurnCounter[]) => {
        if (!counters || counters.length === 0) return null;

        const colorLabel = color === 'both' ? t('game.sharedCounters') : (color === 'white' ? t('common.white') : t('common.black'));

        return (
            <View style={[styles.section, { borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.03)' }]}>
                <View style={styles.header}>
                    <Text variant="caption" bold color="secondary" style={styles.headerText}>{colorLabel.toUpperCase()}</Text>
                </View>
                <View style={styles.list}>
                    {counters.map((counter) => {
                        // Helper to find icon
                        let iconName: IconName = 'alert-circle-outline';
                        if (counter.pactId === 'compass') {
                            const icons: IconName[] = ['arrow-up', 'arrow-right', 'arrow-down', 'arrow-left'];
                            iconName = icons[counter.value % 4] || 'compass';
                        } else {
                            const parentPact = PACT_CARDS.find(p => p.bonus.id === counter.pactId || p.malus.id === counter.pactId);
                            if (parentPact) {
                                if (parentPact.bonus.id === counter.pactId) iconName = parentPact.bonus.icon;
                                else iconName = parentPact.malus.icon;
                            }
                        }

                        return (
                            <CounterItem key={counter.id} counter={counter} icon={iconName} />
                        );
                    })}
                </View>
            </View>
        );
    };

    const hasWhite = turnCounters.white && turnCounters.white.length > 0;
    const hasBlack = turnCounters.black && turnCounters.black.length > 0;
    const hasBoth = turnCounters.both && turnCounters.both.length > 0;

    if (!hasWhite && !hasBlack && !hasBoth) return null;

    return (
        <View style={styles.container}>
            {renderSection('both', turnCounters.both)}
            {renderSection('white', turnCounters.white)}
            {renderSection('black', turnCounters.black)}
        </View>
    );
};

const CounterItem: React.FC<{ counter: TurnCounter; icon: IconName }> = ({ counter, icon }) => {
    const { t } = useTranslation();
    const { colors } = useTheme();

    return (
        <View style={styles.counterItem}>
            <View style={[styles.iconBox, { backgroundColor: colors.primaryMuted }]}>
                <MaterialCommunityIcons name={icon} size={16} color={colors.primary} />
            </View>
            <View style={styles.textContainer}>
                <Text variant="caption" style={{ color: colors.text, flex: 1 }}>
                    {counter.label.includes('.') ? t(counter.label) : t(`pact.${counter.label}`)}
                </Text>
                <View style={[styles.badge, { backgroundColor: counter.type === 'cooldown' ? 'rgba(214,48,49,0.15)' : colors.primaryMuted }]}>
                    <Text variant="caption" bold style={{ color: counter.type === 'cooldown' ? colors.danger : colors.primary }}>
                        {counter.subLabel ? (
                            (/[0-9\/]/.test(counter.subLabel)) ? counter.subLabel : t(`pact.${counter.subLabel}`)
                        ) : counter.value}
                    </Text>
                    {/* Optional: Add "Turns" label if needed */}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 8,
        marginTop: 8,
    },
    section: {
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
    },
    header: {
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        paddingBottom: 4,
    },
    headerText: {
        opacity: 0.7,
        fontSize: 10,
        letterSpacing: 1,
    },
    list: {
        gap: 6,
    },
    counterItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    textContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginLeft: 8,
    }
});
