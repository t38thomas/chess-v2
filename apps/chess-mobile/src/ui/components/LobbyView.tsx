import React from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { Text } from './Text';
import { Button } from './Button';
import { Card } from './Card';
import { Icon } from './Icon';
import { useTheme } from '../theme';
import { useTranslation } from '../../i18n';
import { Container } from '../responsive/Container';
import { GameSessionLayout } from './GameSessionLayout';

interface LobbyViewProps {
    isConnected: boolean;
    joinCodeInput: string;
    onJoinCodeChange: (code: string) => void;
    onCreateMatch: () => void;
    onJoinMatch: () => void;
    onBack?: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
    isConnected,
    joinCodeInput,
    onJoinCodeChange,
    onCreateMatch,
    onJoinMatch,
    onBack
}) => {
    const { spacing, colors } = useTheme();
    const { t } = useTranslation();

    return (
        <GameSessionLayout
            title={t('game.onlineChess')}
            onBack={onBack}
            board={
                <Container maxWidth={600}>
                    <View style={styles.lobbyContent}>
                        <View style={styles.lobbyHero}>
                            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                                <Icon name="earth" size={48} color={colors.primary} />
                            </View>
                            <Text variant="title" bold style={{ fontSize: 28, marginTop: spacing[4], marginBottom: spacing[2] }}>
                                {t('game.onlineMatch')}
                            </Text>
                            <Text variant="body" color="secondary" style={{ textAlign: 'center', marginBottom: spacing[4] }}>
                                {t('game.playOnlineDescription')}
                            </Text>

                            {/* Connection Status */}
                            <View style={styles.connectionStatus}>
                                <View style={[styles.statusDot, {
                                    backgroundColor: isConnected ? '#4ade80' : '#f87171'
                                }]} />
                                <Text variant="caption" color={isConnected ? 'primary' : 'secondary'} bold>
                                    {isConnected ? t('game.serverConnected') : t('game.connecting')}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.lobbyActions}>
                            <Button
                                label={t('createMatch.startGame')}
                                icon="plus-circle-outline"
                                onPress={onCreateMatch}
                                disabled={!isConnected}
                                variant="primary"
                                fullWidth
                                size="lg"
                            />

                            <View style={styles.divider}>
                                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                                <Text variant="caption" color="secondary" bold style={{ paddingHorizontal: 12 }}>
                                    {t('common.or')}
                                </Text>
                                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                            </View>

                            <Card variant="flat" padding="md" style={{ backgroundColor: colors.surfaceHighlight }}>
                                <Text variant="body" bold style={{ marginBottom: spacing[2] }}>
                                    {t('joinMatch.title')}
                                </Text>
                                <Text variant="caption" color="secondary" style={{ marginBottom: spacing[3] }}>
                                    {t('joinMatch.enterCode')}
                                </Text>
                                <View style={styles.joinInputContainer}>
                                    <TextInput
                                        style={[styles.codeInput, {
                                            backgroundColor: colors.surface,
                                            borderColor: colors.border,
                                            color: colors.text,
                                        }]}
                                        placeholder={t('joinMatch.inputPlaceholder')}
                                        placeholderTextColor={colors.textSecondary}
                                        value={joinCodeInput}
                                        onChangeText={onJoinCodeChange}
                                        maxLength={6}
                                        editable={isConnected}
                                        autoCapitalize="characters"
                                    />
                                </View>
                                <Button
                                    label={t('game.join')}
                                    icon="login-variant"
                                    onPress={onJoinMatch}
                                    disabled={!isConnected || !joinCodeInput.trim()}
                                    variant="secondary"
                                    style={{ marginTop: spacing[3] }}
                                    fullWidth
                                    size="lg"
                                />
                            </Card>
                        </View>
                    </View>
                </Container>
            }
            panel={undefined}
        />
    );
};

const styles = StyleSheet.create({
    lobbyContent: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    lobbyHero: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    connectionStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    lobbyActions: {
        gap: 20,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    joinInputContainer: {
        marginBottom: 4,
    },
    codeInput: {
        height: 48,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: 4,
    },
});
