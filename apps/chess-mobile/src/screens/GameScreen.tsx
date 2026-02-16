import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, useWindowDimensions, Animated, ScrollView, TouchableOpacity, } from 'react-native';
import { useGame } from '../ui/hooks/useGame';
import { BoardView } from '../ui/components/BoardView';
import { Text } from '../ui/components/Text';
import { Button } from '../ui/components/Button';
import { Card } from '../ui/components/Card';
import { Icon } from '../ui/components/Icon';
import { PromotionModal } from '../ui/components/PromotionModal';
import { PactSelectionModal } from '../ui/components/PactSelectionModal';
import { PactDetailsModal } from '../ui/components/PactDetailsModal';
import { GameEndModal } from '../ui/components/GameEndModal';
import { GameSessionLayout } from '../ui/components/GameSessionLayout';
import { useTheme } from '../ui/theme';
import { useTranslation } from '../i18n';
import { Pact, PERK_LIBRARY } from 'chess-core';
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

export const GameScreen: React.FC<GameScreenProps & { matchConfig: MatchConfig }> = ({ onNavigateBack, matchConfig }) => {
    const {
        viewModel,
        turn,
        history,
        handleSquarePress,
        resetGame,
        undo,
        jumpToMove,
        toggleOrientation,
        reversed,
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
        subscribeToGameEvents
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
    }, [subscribeToGameEvents, showToast]);


    const gameInfoContent = (
        <View style={styles.gameInfoContainer}>
            {/* Status Section */}
            <Card variant="flat" padding="md" style={styles.statusCard}>
                <View style={styles.statusRow}>
                    <View style={[
                        styles.turnIndicator,
                        { backgroundColor: turn === 'white' ? colors.primary + '20' : colors.textSecondary + '20' }
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
                    <Text variant="caption" color="secondary" style={{ marginBottom: 4 }}>{t('game.activePacts')}</Text>
                    <View style={styles.pactsList}>
                        {[...pacts.white, ...pacts.black].map((pact, idx) => {
                            const translated = translatePact(pact);
                            return (
                                <TouchableOpacity
                                    key={idx}
                                    style={styles.pactBadge}
                                    onPress={() => setSelectedPact(pact)}
                                >
                                    <Icon name={pact.bonus.icon as any} size={14} color={colors.primary} />
                                    <Text variant="caption" bold style={{ marginLeft: 4, fontSize: 10 }}>{translated?.title ?? ''}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
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
                                const perk = PERK_LIBRARY[abilityId];
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

            {/* Pact Turn Counters */}
            {viewModel.turnCounters && (
                <PactTurnCounter
                    turnCounters={viewModel.turnCounters}
                    bottomColor={reversed ? 'black' : 'white'}
                />
            )}

            {/* Controls */}
            <View style={styles.controlsContainer}>
                <View style={styles.buttonRow}>
                    <Button
                        label={t('game.undo')}
                        variant="ghost"
                        icon="undo"
                        disabled={history.length === 0}
                        onPress={undo}
                        style={{ flex: 1 }}
                    />
                    <Button
                        label={t('game.rotate')}
                        variant="secondary"
                        icon="rotate-3d-variant"
                        onPress={toggleOrientation}
                        style={{ flex: 1 }}
                    />
                </View>
                <Button
                    label={t('game.newGame')}
                    variant="destructive"
                    icon="restart"
                    onPress={resetGame}
                    fullWidth
                />
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
                        <CapturedPiecesRow
                            pieces={capturedPieces.topRow.pieces}
                            advantage={capturedPieces.topRow.advantageBadge}
                            label={t(capturedPieces.topRow.labelKey as any)}
                            pieceColor="white"
                            style={{ marginBottom: spacing[2] }}
                        />
                        <BoardView
                            viewModel={viewModel}
                            onSquarePress={handleSquarePress}
                            reversed={reversed}
                            invertPieces={invertPieces}
                            size={boardSize}
                        />
                        <CapturedPiecesRow
                            pieces={capturedPieces.bottomRow.pieces}
                            advantage={capturedPieces.bottomRow.advantageBadge}
                            label={t(capturedPieces.bottomRow.labelKey as any)}
                            pieceColor="black"
                            style={{ marginTop: spacing[2] }}
                        />
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
                onSelect={(pact) => assignPact(turn, pact)}
                choicesCount={matchConfig.pactChoicesAtStart}
                seed={matchConfig.seed}
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
                onRestart={resetGame}
                onHome={onNavigateBack || (() => { })}
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
        backgroundColor: '#FF525215',
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
        borderBottomColor: '#eee', // Simplified, should use theme
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
        backgroundColor: 'rgba(255,255,255,0.05)',
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
