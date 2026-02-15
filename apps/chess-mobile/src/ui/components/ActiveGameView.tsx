import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { BoardView } from './BoardView';
import { Text } from './Text';
import { Button } from './Button';
import { Card } from './Card';
import { Icon } from './Icon';
import { PromotionModal } from './PromotionModal';
import { PactSelectionModal } from './PactSelectionModal';
import { PactDetailsModal } from './PactDetailsModal';
import { GameSessionLayout } from './GameSessionLayout';
import { useTheme } from '../theme';
import { useTranslation } from '../../i18n';
import { Pact, PERK_LIBRARY } from 'chess-core';
import { usePactTranslation } from '../hooks/usePactTranslation';
import { useGameSettings } from '../../context/GameSettingsContext';

interface ActiveGameViewProps {
    viewModel: any; // Type should be imported from chess-core if available or defined
    onSquarePress: (x: number, y: number) => void;
    reversed: boolean;
    boardSize: number;
    turn: 'white' | 'black';
    isCheck: boolean;
    players: {
        white?: { username: string; connected: boolean } | null;
        black?: { username: string; connected: boolean } | null;
    };
    pacts: { white: Pact[]; black: Pact[] };
    playerColor: 'white' | 'black';
    phase: string;
    pendingPromotion: any;
    availableAbilities: string[];
    onRotate: () => void;
    onLeaveMatch: () => void;
    onUseAbility: (abilityId: string) => void;
    onCompletePromotion: (piece: string) => void;
    onAssignPact: (pact: Pact) => void;
}

export const ActiveGameView: React.FC<ActiveGameViewProps> = ({
    viewModel,
    onSquarePress,
    reversed,
    boardSize,
    turn,
    isCheck,
    players,
    pacts,
    playerColor,
    phase,
    pendingPromotion,
    availableAbilities,
    onRotate,
    onLeaveMatch,
    onUseAbility,
    onCompletePromotion,
    onAssignPact,
}) => {
    const { spacing, colors } = useTheme();
    const { t } = useTranslation();
    const { translatePact } = usePactTranslation();
    const { rotatePieces } = useGameSettings();
    const [selectedPact, setSelectedPact] = useState<Pact | null>(null);

    const invertPieces = rotatePieces && turn === 'black';

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

            {/* Players Info */}
            <View style={styles.playersContainer}>
                <Card variant="outlined" padding="sm" style={{ flex: 1 }}>
                    <View style={styles.playerInfo}>
                        <Icon name="chess-king" size={20} color={colors.primary} />
                        <View style={{ flex: 1, marginLeft: spacing[2] }}>
                            <Text variant="caption" color="secondary">{t('common.white')}</Text>
                            <Text variant="body" bold style={{ fontSize: 14 }}>{players.white?.username || 'White'}</Text>
                        </View>
                        <View style={[styles.playerDot, {
                            backgroundColor: players.white?.connected ? '#4ade80' : '#f87171'
                        }]} />
                    </View>
                </Card>
                <Card variant="outlined" padding="sm" style={{ flex: 1 }}>
                    <View style={styles.playerInfo}>
                        <Icon name="chess-queen" size={20} color={colors.textSecondary} />
                        <View style={{ flex: 1, marginLeft: spacing[2] }}>
                            <Text variant="caption" color="secondary">{t('common.black')}</Text>
                            <Text variant="body" bold style={{ fontSize: 14 }}>{players.black?.username || 'Black'}</Text>
                        </View>
                        <View style={[styles.playerDot, {
                            backgroundColor: players.black?.connected ? '#4ade80' : '#f87171'
                        }]} />
                    </View>
                </Card>
            </View>

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

            {/* Spectral Actions */}
            {turn === playerColor && availableAbilities.length > 0 && (
                <View style={styles.spectralActionsContainer}>
                    <Text variant="caption" color="secondary" bold style={{ marginBottom: 8 }}>
                        {t('pact.spectralActions')}
                    </Text>
                    <View style={styles.spectralActionsList}>
                        {availableAbilities.map(abilityId => {
                            const perk = PERK_LIBRARY[abilityId];
                            if (!perk) return null;
                            return (
                                <Button
                                    key={abilityId}
                                    label={perk.name}
                                    icon={perk.icon as any}
                                    variant="primary"
                                    onPress={() => onUseAbility(abilityId)}
                                    style={{ flex: 1 }}
                                />
                            );
                        })}
                    </View>
                </View>
            )}

            {/* Match Info */}
            <Card variant="outlined" padding="sm">
                <View style={styles.matchInfo}>
                    <Icon name="shield-account" size={16} color={colors.textSecondary} />
                    <Text variant="caption" color="secondary" style={{ marginLeft: spacing[2] }}>
                        {t('game.yourColor')}: <Text bold>
                            {playerColor === 'white' ? t('common.white') : t('common.black')}
                        </Text>
                    </Text>
                </View>
            </Card>

            {/* Controls */}
            <View style={styles.controlsContainer}>
                <Button
                    label={t('game.rotate')}
                    variant="secondary"
                    icon="rotate-3d-variant"
                    onPress={onRotate}
                    fullWidth
                />
                <Button
                    label={t('game.leaveMatch')}
                    variant="destructive"
                    icon="exit-to-app"
                    onPress={onLeaveMatch}
                    fullWidth
                />
            </View>
        </View>
    );

    return (
        <React.Fragment>
            <GameSessionLayout
                title={t('game.onlineChess')}
                onBack={onLeaveMatch}
                board={
                    <BoardView
                        viewModel={viewModel}
                        onSquarePress={onSquarePress}
                        reversed={reversed}
                        invertPieces={invertPieces}
                        size={boardSize}
                    />
                }
                panel={gameInfoContent}
            />

            <PromotionModal
                visible={!!pendingPromotion}
                color={turn}
                onSelect={onCompletePromotion}
                onCancel={() => { }}
            />

            <PactSelectionModal
                visible={phase === 'setup' && turn === playerColor && !!players.white?.connected && !!players.black?.connected}
                color={playerColor || 'white'}
                onSelect={onAssignPact}
            />

            <PactDetailsModal
                visible={!!selectedPact}
                pact={selectedPact}
                onClose={() => setSelectedPact(null)}
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
    playersContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    playerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    playerDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
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
    matchInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    controlsContainer: {
        gap: 12,
    },
    spectralActionsContainer: {
        paddingHorizontal: 4,
    },
    spectralActionsList: {
        flexDirection: 'row',
        gap: 8,
    },
});
