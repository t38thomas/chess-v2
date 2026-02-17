import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Platform, Switch } from 'react-native';
import { Text } from '../ui/components/Text';
import { Icon } from '../ui/components/Icon';
import { IconButton } from '../ui/components/IconButton';
import { useTranslation } from '../i18n';
import { useTheme } from '../ui/theme';
import { Container } from '../ui/responsive/Container';
import { Screen } from '../ui/responsive/Screen';
import { useBreakpoint } from '../ui/responsive/useBreakpoint';
import { MatchConfig } from 'chess-core';

interface MatchConfigScreenProps {
    mode: 'local' | 'online';
    onBack: () => void;
    onConfirm: (config: MatchConfig) => void;
}

const DEFAULT_MATCH_CONFIG: MatchConfig = {
    activePactsMax: 1,
    pactChoicesAtStart: 3,
};

export const MatchConfigScreen: React.FC<MatchConfigScreenProps> = ({ mode, onBack, onConfirm }) => {
    const { colors, spacing } = useTheme();
    const { t } = useTranslation();
    const { bp } = useBreakpoint();
    const isDesktop = bp === 'lg' || bp === 'xl';

    const [config, setConfig] = useState<MatchConfig>(DEFAULT_MATCH_CONFIG);

    const handleConfirm = () => {
        onConfirm(config);
    };

    const updateMaxPacts = (val: number) => {
        setConfig(prev => ({ ...prev, activePactsMax: Math.max(1, Math.min(3, val)) }));
    };

    const updatePactChoices = (val: number) => {
        setConfig(prev => ({ ...prev, pactChoicesAtStart: Math.max(1, Math.min(5, val)) }));
    };

    const toggleRotation = (val: boolean) => {
        setConfig(prev => ({ ...prev, enableTurnRotate90: val }));
    };

    const Stepper = ({ value, onIncrement, onDecrement, min, max, label }: {
        value: number,
        onIncrement: () => void,
        onDecrement: () => void,
        min: number,
        max: number,
        label: string
    }) => (
        <View style={styles.stepperContainer}>
            <Text variant="body" bold style={{ marginBottom: spacing[2] }}>{label}</Text>
            <View style={[styles.stepperRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Pressable
                    onPress={onDecrement}
                    disabled={value <= min}
                    style={({ pressed }) => [
                        styles.stepperBtn,
                        pressed && { opacity: 0.7 },
                        value <= min && { opacity: 0.3 }
                    ]}
                >
                    <Icon name="minus" size={24} color={colors.text} />
                </Pressable>
                <View style={styles.stepperVal}>
                    <Text variant="title" bold>{value}</Text>
                </View>
                <Pressable
                    onPress={onIncrement}
                    disabled={value >= max}
                    style={({ pressed }) => [
                        styles.stepperBtn,
                        pressed && { opacity: 0.7 },
                        value >= max && { opacity: 0.3 }
                    ]}
                >
                    <Icon name="plus" size={24} color={colors.text} />
                </Pressable>
            </View>
        </View>
    );

    const getSummary = () => {
        if (config.pactChoicesAtStart === 0) {
            return t('matchConfig.summary.auto', { count: config.activePactsMax.toString() });
        }
        return t('matchConfig.summary.choice', {
            choices: config.pactChoicesAtStart.toString(),
            max: config.activePactsMax.toString()
        });
    };

    const renderHelp = () => (
        <View style={[styles.helpPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.iconBox, { backgroundColor: colors.primary + '20' }]}>
                <Icon name="information-variant" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text variant="body" bold style={{ marginBottom: 4 }}>{t('matchConfig.help.title' as any)}</Text>
                <Text variant="caption" color="secondary">{t('matchConfig.help.desc' as any)}</Text>
            </View>
        </View>
    );

    return (
        <Screen>
            <Container>
                <View style={styles.header}>
                    <IconButton icon="arrow-left" onPress={onBack} variant="secondary" />
                    <Text variant="title" bold style={{ marginLeft: spacing[4] }}>{t('matchConfig.title' as any)}</Text>
                </View>

                <ScrollView contentContainerStyle={[styles.scrollContent, isDesktop && styles.desktopContent]}>
                    <View style={[styles.mainCard, isDesktop && { maxWidth: 600, alignSelf: 'center' }]}>

                        <Stepper
                            label={t('matchConfig.activePactsMax.label' as any)}
                            value={config.activePactsMax}
                            min={1}
                            max={3}
                            onIncrement={() => updateMaxPacts(config.activePactsMax + 1)}
                            onDecrement={() => updateMaxPacts(config.activePactsMax - 1)}
                        />

                        <View style={{ height: spacing[8] }} />

                        <Stepper
                            label={t('matchConfig.pactChoicesAtStart.label' as any)}
                            value={config.pactChoicesAtStart}
                            min={0}
                            max={5}
                            onIncrement={() => updatePactChoices(config.pactChoicesAtStart + 1)}
                            onDecrement={() => updatePactChoices(config.pactChoicesAtStart - 1)}
                        />

                        <View style={{ height: spacing[8] }} />

                        <View style={[styles.switchRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                            <View style={{ flex: 1 }}>
                                <Text variant="body" bold>{t('matchConfig.enableTurnRotate90.label' as any)}</Text>
                                <Text variant="caption" color="secondary" style={{ marginTop: 4 }}>
                                    {t('matchConfig.enableTurnRotate90.desc' as any)}
                                </Text>
                            </View>
                            <Switch
                                value={config.enableTurnRotate90 || false}
                                onValueChange={toggleRotation}
                                trackColor={{ false: colors.border, true: colors.primary }}
                                thumbColor={Platform.OS === 'android' ? colors.surface : ''}
                            />
                        </View>

                        <View style={styles.explanationBox}>
                            <Text variant="body" color="secondary" style={{ textAlign: 'center', fontStyle: 'italic' }}>
                                {config.pactChoicesAtStart === 0
                                    ? t('matchConfig.pactChoicesAtStart.auto' as any)
                                    : t('matchConfig.pactChoicesAtStart.manual' as any)}
                            </Text>
                        </View>

                        <View style={[styles.summaryBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
                            <Icon name="flash" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                            <Text variant="body" bold color="primary" style={{ flex: 1 }}>{getSummary()}</Text>
                        </View>

                        <View style={{ flex: 1, minHeight: 40 }} />

                        <Pressable
                            onPress={handleConfirm}
                            style={({ pressed }) => [
                                styles.confirmBtn,
                                { backgroundColor: colors.primary },
                                pressed && { opacity: 0.8 }
                            ]}
                        >
                            <Text style={{ color: colors.background }} bold variant="body">
                                {mode === 'local' ? t('cta.startLocal' as any) : t('cta.createRoom' as any)}
                            </Text>
                        </Pressable>
                    </View>

                    {isDesktop && (
                        <View style={styles.desktopHelp}>
                            {renderHelp()}
                        </View>
                    )}
                </ScrollView>
            </Container>
        </Screen>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    scrollContent: {
        padding: 24,
        flexGrow: 1,
    },
    desktopContent: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 40,
        paddingTop: 40,
    },
    mainCard: {
        flex: 1,
        width: '100%',
    },
    stepperContainer: {
        width: '100%',
    },
    stepperRow: {
        flexDirection: 'row',
        borderWidth: 1,
        borderRadius: 12,
        height: 64,
        overflow: 'hidden',
    },
    stepperBtn: {
        width: 64,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepperVal: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: 'inherit',
    },
    explanationBox: {
        padding: 16,
        marginTop: 8,
    },
    summaryBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 24,
    },
    confirmBtn: {
        height: 56,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 32,
        ...Platform.select({
            web: { cursor: 'pointer' } as any,
            default: {}
        }),
    },
    helpPanel: {
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        flexDirection: 'row',
        gap: 16,
        maxWidth: 300,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    desktopHelp: {
        width: 300,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    }
});
