import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, useWindowDimensions, ScrollView, TouchableOpacity, } from 'react-native';
import { useGame } from '../ui/hooks/useGame';
import { BoardView } from '../ui/components/BoardView';
import { Text } from '../ui/components/Text';
import { Button } from '../ui/components/Button';
import { Card } from '../ui/components/Card';
import { Icon } from '../ui/components/Icon';
import { IconButton } from '../ui/components/IconButton';
import { PromotionModal } from '../ui/components/PromotionModal';
import { PactSelectionModal } from '../ui/components/PactSelectionModal';
import { PactDetailsModal } from '../ui/components/PactDetailsModal';
import { GameEndModal } from '../ui/components/GameEndModal';
import { GameSessionLayout } from '../ui/components/GameSessionLayout';
import { useTheme } from '../ui/theme';
import { useTranslation } from '../i18n';
import { Pact, PERK_LIBRARY, PACT_CARDS, PactRegistry } from 'chess-core';
import { useBoardSize } from '../ui/responsive/useBoardSize';
import { usePactTranslation } from '../ui/hooks/usePactTranslation';
import { PactTurnCounter } from '../ui/components/PactTurnCounter';
import { useToast } from '../context/ToastContext';
import { useGameSettings } from '../context/GameSettingsContext';
import { useCapturedPieces } from '../ui/hooks/useCapturedPieces';
import { CapturedPiecesRow } from '../ui/components/CapturedPiecesRow';

interface GameScreenProps {
    onNavigateBack?: () => void;
}

import { MatchConfig } from 'chess-core';
import Animated, { useAnimatedStyle, useSharedValue, useDerivedValue, withSequence, withTiming, interpolate } from 'react-native-reanimated';

export const GameScreen: React.FC<GameScreenProps & { matchConfig: MatchConfig }> = ({ onNavigateBack, matchConfig }) => {
    const {
        viewModel,
        turn,
        history,
        handleSquarePress,
        resetGame,
        jumpToMove,
        isCheck,
        pendingPromotion,
        completePromotion,
        phase,
        pacts,
        assignPact,
        useAbility,
        availableAbilities,
        activeAbilityId,
        cancelAbility,
        status,
        winner,
        subscribeToGameEvents,
        orientation,
        rotateBoard,
        resign
    } = useGame(matchConfig);


    const [selectedPact, setSelectedPact] = useState<Pact | null>(null);
    const { spacing, colors } = useTheme();
    const { t } = useTranslation();
    const { translatePact } = usePactTranslation();
    const boardSize = useBoardSize();
    const { showToast } = useToast();
    const { rotatePieces } = useGameSettings();
    const capturedPieces = useCapturedPieces(viewModel);

    const invertPieces = rotatePieces && turn === 'black';

    // Animation Shared Values
    const rotationProgress = useSharedValue(0);
    const rotationRandomAngle = useSharedValue(0);

    useEffect(() => {
        // Generate a random angle between -15 and 15 degrees
        rotationRandomAngle.value = (Math.random() * 30) - 15;

        // Sequence: 0 -> 1 -> 0
        // Duration matched to simulate board rotation duration
        rotationProgress.value = withSequence(
            withTiming(1, { duration: 300 }),
            withTiming(0, { duration: 300 })
        );
    }, [orientation]);

    // Derived Values as requested
    const scale = useDerivedValue(() => {
        return interpolate(rotationProgress.value, [0, 1], [1, 0.6]);
    });

    const topTranslateY = useDerivedValue(() => {
        return interpolate(rotationProgress.value, [0, 1], [0, -30]);
    });

    const bottomTranslateY = useDerivedValue(() => {
        return interpolate(rotationProgress.value, [0, 1], [0, 30]);
    });

    const rotate = useDerivedValue(() => {
        return interpolate(rotationProgress.value, [0, 1], [0, rotationRandomAngle.value]);
    });

    const topBarStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: topTranslateY.value },
                { scale: scale.value },
                // { rotate: `${rotate.value}deg` }
            ],
            zIndex: 1, // Ensure it floats above/below if needed
        };
    });

    const bottomBarStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: bottomTranslateY.value },
                { scale: scale.value },
                // { rotate: `${rotate.value}deg` }
            ],
            zIndex: 1,
        };
    });


    // Subscribe to game events (e.g. malus effects)
    useEffect(() => {
        const unsubscribe = subscribeToGameEvents((event, payload) => {
            console.log('[GameScreen] Received event:', event, payload);
            if (event === 'pact_effect' && payload) {
                showToast({
                    title: t(payload.title as any),
                    description: payload.description ? t(payload.description as any) : undefined,
                    icon: payload.icon,
                    type: payload.type || 'info',
                    duration: 4000
                });
            }
        });
        return unsubscribe;
    }, [subscribeToGameEvents, showToast, t]);

    const handleRotateBoardAction = () => {
        if (viewModel.totalTurns < 2) {
            showToast({
                title: t('errors.rotationTooEarly' as any),
                type: 'warning',
                icon: 'alert-circle-outline'
            });
            return;
        }
        rotateBoard();
    };


    const gameInfoContent = (
        <View style={styles.gameInfoContainer}>
            {/* Status Section */}
            <Card variant="flat" padding="md" style={styles.statusCard}>
                <View style={styles.statusRow}>
                    <View style={[
                        styles.turnIndicator,
                        { backgroundColor: turn === 'white' ? colors.primaryMuted : colors.surfaceActive }
                    ]}>
                        <Icon
                            name="chess-king"
                            size={24}
                            color={turn === 'white' ? colors.primary : colors.textSecondary}
                        />
                    </View>
                    <View style={{ flex: 1, marginLeft: spacing[3] }}>
                        <Text variant="caption" color="secondary">{t('game.turnLabel')}</Text>
                        <Text variant="title" bold>
                            {turn === 'white' ? t('common.white') : t('common.black')}
                        </Text>
                    </View>
                    {isCheck && (
                        <View style={styles.checkBadge}>
                            <Icon name="alert" size={16} color={colors.danger} />
                            <Text color="danger" bold variant="caption" style={{ marginLeft: 4 }}>{t('game.check')}</Text>
                        </View>
                    )}
                </View>
            </Card>

            {/* Active Pacts */}
            {(pacts.white.length > 0 || pacts.black.length > 0) && (
                <Card variant="flat" padding="sm" style={{ backgroundColor: colors.surfaceHighlight }}>
                    <Text variant="caption" color="secondary" style={{ marginBottom: 8 }}>{t('game.activePacts')}</Text>

                    {[
                        { color: turn, label: t('game.yourPacts'), pactItems: pacts[turn] },
                        { color: turn === 'white' ? 'black' : 'white', label: t('game.opponentPacts'), pactItems: pacts[turn === 'white' ? 'black' : 'white'] }
                    ].map((section, sIdx) => {
                        if (section.pactItems.length === 0) return null;
                        return (
                            <View key={sIdx} style={{ marginBottom: sIdx === 0 ? 8 : 0 }}>
                                <Text variant="caption" bold color={section.color === turn ? "primary" : "secondary"} style={{ fontSize: 9, marginBottom: 4 }}>
                                    {section.label}
                                </Text>
                                <View style={styles.pactsList}>
                                    {section.pactItems.map((pactDef, idx) => {
                                        const pactMeta = PACT_CARDS.find(p => p.id === pactDef.id) || null;
                                        const translated = translatePact(pactMeta);
                                        return (
                                            <TouchableOpacity
                                                key={idx}
                                                style={styles.pactBadge}
                                                onPress={() => setSelectedPact(pactMeta)}
                                            >
                                                <Icon name={(pactMeta?.bonus.icon || 'help-circle') as any} size={14} color={section.color === 'white' ? colors.primary : colors.textSecondary} />
                                                <Text variant="caption" bold style={{ marginLeft: 4, fontSize: 10 }}>{translated?.title ?? ''}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        );
                    })}
                </Card>
            )}

            {/* History Section Removed */}

            {/* Spectral Actions */}
            {(availableAbilities.length > 0 || activeAbilityId) && (
                <View style={styles.spectralActionsContainer}>
                    <Text variant="caption" color="secondary" bold style={{ marginBottom: 8 }}>
                        {activeAbilityId ? t('pact.selectTargets') : t('pact.spectralActions')}
                    </Text>
                    <View style={styles.spectralActionsList}>
                        {activeAbilityId ? (
                            <Button
                                label={t('common.cancel')}
                                variant="destructive"
                                icon="close"
                                onPress={cancelAbility}
                                style={{ flex: 1 }}
                            />
                        ) : (
                            availableAbilities.map(abilityId => {
                                const perk = PERK_LIBRARY[abilityId as keyof typeof PERK_LIBRARY];
                                if (!perk) return null;
                                return (
                                    <Button
                                        key={abilityId}
                                        label={perk.name}
                                        icon={perk.icon as any}
                                        variant="primary"
                                        onPress={() => useAbility(abilityId)}
                                        style={{ flex: 1 }}
                                    />
                                );
                            })
                        )}
                    </View>
                </View>
            )}

            {viewModel.turnCounters && (
                <PactTurnCounter
                    turnCounters={viewModel.turnCounters}
                    bottomColor="white"
                />
            )}

            {/* Controls */}
            <View style={styles.controlsContainer}>
                {matchConfig.enableTurnRotate90 && (
                    <Button
                        label={t('game.rotateBoard' as any)}
                        onPress={handleRotateBoardAction}
                        variant="secondary"
                        icon="rotate-right"
                        disabled={phase !== 'playing'}
                        fullWidth
                    />
                )}
                {resign && (
                    <Button
                        label={t('game.resign')}
                        variant="destructive"
                        icon="flag"
                        onPress={resign}
                        fullWidth
                    />
                )}
            </View>
        </View>
    );

    return (
        <React.Fragment>
            <GameSessionLayout
                title={t('game.localGame')}
                onBack={onNavigateBack}
                board={
                    <View style={{ width: boardSize }}>
                        <Animated.View style={[topBarStyle, { marginBottom: spacing[2] }]}>
                            <CapturedPiecesRow
                                pieces={capturedPieces.topRow.pieces}
                                advantage={capturedPieces.topRow.advantageBadge}
                                // label={t(capturedPieces.topRow.labelKey as any)}
                                pieceColor="white"
                            />
                        </Animated.View>
                        <BoardView
                            viewModel={viewModel}
                            onSquarePress={handleSquarePress}
                            reversed={false}
                            invertPieces={invertPieces}
                            size={boardSize}
                            orientation={orientation}
                        />
                        <Animated.View style={[bottomBarStyle, { marginTop: spacing[2] }]}>
                            <CapturedPiecesRow
                                pieces={capturedPieces.bottomRow.pieces}
                                advantage={capturedPieces.bottomRow.advantageBadge}
                                // label={t(capturedPieces.bottomRow.labelKey as any)}
                                pieceColor="black"
                            />
                        </Animated.View>
                    </View>
                }
                panel={gameInfoContent}
            />

            <PromotionModal
                visible={!!pendingPromotion}
                color={turn}
                onSelect={completePromotion}
                onCancel={() => { }}
            />

            <PactSelectionModal
                visible={phase === 'setup'}
                color={turn}
                onSelect={(pact) => {
                    const pactDef = PactRegistry.getInstance().getDefinition(pact.id);
                    if (pactDef) assignPact(turn, pactDef);
                }}
                choicesCount={matchConfig.pactChoicesAtStart}
                seed={matchConfig.seed}
                roundIndex={matchConfig.activePactsMax > 1 ? pacts[turn].length : 0}
                excludeIds={pacts[turn].map(p => p.id)}
            />

            <PactDetailsModal
                visible={!!selectedPact}
                pact={selectedPact}
                onClose={() => setSelectedPact(null)}
            />

            <GameEndModal
                visible={status !== 'active' && phase !== 'setup'}
                status={status}
                winner={winner}
                onClose={onNavigateBack || (() => { })}
                onPlayAgain={resetGame}
                onGoHome={onNavigateBack || (() => { })}
            />
        </React.Fragment>
    );
};

const styles = StyleSheet.create({
    gameInfoContainer: {
        flex: 1,
        gap: 16,
    },
    statusCard: {
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    turnIndicator: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(214,48,49,0.08)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    historyCard: {
        flex: 1,
        minHeight: 120,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    historyScroll: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        paddingBottom: 16,
    },
    moveItem: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 6,
        minWidth: 50,
        alignItems: 'center',
    },
    moveText: {
        fontSize: 13,
        fontWeight: '600',
    },
    emptyHistory: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    controlsContainer: {
        gap: 12,
        paddingBottom: 8,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    pactsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    pactBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    spectralActionsContainer: {
        paddingHorizontal: 4,
    },
    spectralActionsList: {
        flexDirection: 'row',
        gap: 8,
    },
});
