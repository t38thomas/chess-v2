import React from 'react';
import { View, Modal, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';
import { Card } from './Card';
import { Button } from './Button';
import { Icon } from './Icon';
import { useTranslation } from '../../i18n';
import { GameStatus, PieceColor } from 'chess-core';

interface GameEndModalProps {
    visible: boolean;
    status: GameStatus;
    winner?: PieceColor;
    onRestart: () => void;
    onHome: () => void;
}

export const GameEndModal: React.FC<GameEndModalProps> = ({
    visible,
    status,
    winner,
    onRestart,
    onHome,
}) => {
    const { colors, spacing, typography } = useTheme();
    const { t } = useTranslation();

    const getTitle = () => {
        if (status === 'checkmate') {
            return t('game.checkmate');
        }
        if (status === 'stalemate') {
            return t('game.stalemate');
        }
        if (status === 'draw') {
            return t('game.draw');
        }
        if (status === 'resignation') {
            // return t('game.resignation'); // Ensure we have this key or use a generic one
            return t('game.gameOver'); // Check translation keys
        }
        return t('game.gameOver');
    };

    const getMessage = () => {
        if ((status === 'checkmate' || status === 'resignation') && winner) {
            const winnerName = winner === 'white' ? t('common.white') : t('common.black');
            if (status === 'resignation') {
                // return t('game.resignationMessage', { winner: winnerName });
                // Fallback if no specific key
                return `${winnerName} ${t('game.wonByResignation')}`;
            }
            return t('game.winnerMessage', { winner: winnerName });
        }
        if (status === 'stalemate') {
            return t('game.stalemateMessage');
        }
        return '';
    };

    const getIcon = () => {
        if (status === 'checkmate') return 'trophy';
        if (status === 'resignation') return 'flag';
        return 'handshake';
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onHome}
        >
            <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
                <Card padding="lg" style={{ width: '85%', maxWidth: 400, alignItems: 'center' }}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                        <Icon name={getIcon()} size={48} color={colors.primary} />
                    </View>

                    <Text variant="title" bold style={{ marginTop: spacing[4], marginBottom: spacing[2], textAlign: 'center' }}>
                        {getTitle()}
                    </Text>

                    <Text variant="body" color="secondary" style={{ marginBottom: spacing[6], textAlign: 'center' }}>
                        {getMessage()}
                    </Text>

                    <View style={styles.buttonContainer}>
                        <Button
                            label={t('game.rematch')}
                            variant="primary"
                            icon="restart"
                            onPress={onRestart}
                            fullWidth
                            size="lg"
                        />
                        <Button
                            label={t('common.home')}
                            variant="secondary"
                            icon="home"
                            onPress={onHome}
                            fullWidth
                            size="lg"
                        />
                    </View>
                </Card>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    buttonContainer: {
        width: '100%',
        gap: 12,
    },
});
