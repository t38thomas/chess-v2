import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from './Text';
import { Button } from './Button';
import { Card } from './Card';
import { Icon } from './Icon';
import { useTheme } from '../theme';
import { useTranslation } from '../../i18n';
import { Container } from '../responsive/Container';
import { GameSessionLayout } from './GameSessionLayout';

interface PlayerInfo {
    username: string;
    connected: boolean;
}

interface WaitingViewProps {
    joinCode: string | null;
    players: {
        white?: PlayerInfo | null;
        black?: PlayerInfo | null;
    };
    onCopyCode: () => void;
    onLeaveMatch: () => void;
}

export const WaitingView: React.FC<WaitingViewProps> = ({
    joinCode,
    players,
    onCopyCode,
    onLeaveMatch
}) => {
    const { spacing, colors } = useTheme();
    const { t } = useTranslation();

    return (
        <GameSessionLayout
            title={t('game.onlineChess')}
            onBack={onLeaveMatch}
            board={
                <Container maxWidth={600}>
                    <View style={styles.waitingContent}>
                        <View style={styles.waitingHero}>
                            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                                <Icon name="account-clock" size={48} color={colors.primary} />
                            </View>
                            <Text variant="title" bold style={{ fontSize: 24, marginTop: spacing[4], marginBottom: spacing[2] }}>
                                {t('game.waitingForOpponent')}
                            </Text>
                            <Text variant="body" color="secondary" style={{ textAlign: 'center', marginBottom: spacing[5] }}>
                                {t('game.perkSelectionDelay')}
                            </Text>

                            {/* Match Code Card */}
                            <Card variant="outlined" padding="lg" style={[styles.codeCard, { borderColor: colors.primary + '40' }]}>
                                <Text variant="caption" color="secondary" style={{ marginBottom: spacing[2], textAlign: 'center' }}>
                                    {t('createMatch.shareCode')}
                                </Text>
                                <TouchableOpacity onPress={onCopyCode} style={styles.codeDisplay}>
                                    <Text style={[styles.codeText, { color: colors.primary }]}>
                                        {joinCode || '------'}
                                    </Text>
                                </TouchableOpacity>
                                <Button
                                    label={t('common.copy')}
                                    icon="content-copy"
                                    onPress={onCopyCode}
                                    variant="primary"
                                    fullWidth
                                    style={{ marginTop: spacing[4] }}
                                />
                            </Card>

                            {/* Connected Players */}
                            <View style={styles.waitingPlayers}>
                                <Card variant="flat" padding="sm" style={{ backgroundColor: colors.surfaceHighlight }}>
                                    <View style={styles.playerWaitingRow}>
                                        <Icon
                                            name={players.white?.connected ? 'check-circle' : 'clock-outline'}
                                            size={20}
                                            color={players.white?.connected ? '#4ade80' : colors.textSecondary}
                                        />
                                        <Text variant="body" style={{ marginLeft: spacing[2] }}>
                                            {players.white?.connected ? players.white.username : t('game.waitingForWhite')}
                                        </Text>
                                    </View>
                                </Card>
                                <Card variant="flat" padding="sm" style={{ backgroundColor: colors.surfaceHighlight }}>
                                    <View style={styles.playerWaitingRow}>
                                        <Icon
                                            name={players.black?.connected ? 'check-circle' : 'clock-outline'}
                                            size={20}
                                            color={players.black?.connected ? '#4ade80' : colors.textSecondary}
                                        />
                                        <Text variant="body" style={{ marginLeft: spacing[2] }}>
                                            {players.black?.connected ? players.black.username : t('game.waitingForBlack')}
                                        </Text>
                                    </View>
                                </Card>
                            </View>
                        </View>
                    </View>
                </Container>
            }
            panel={undefined}
        />
    );
};

const styles = StyleSheet.create({
    waitingContent: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    waitingHero: {
        alignItems: 'center',
        gap: 16,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    codeCard: {
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    codeDisplay: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginVertical: 8,
    },
    codeText: {
        fontSize: 32,
        fontWeight: '700',
        letterSpacing: 8,
        textAlign: 'center',
    },
    waitingPlayers: {
        width: '100%',
        gap: 12,
        marginTop: 24,
    },
    playerWaitingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
