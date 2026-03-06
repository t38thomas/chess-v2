import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { BaseModal } from './BaseModal';
import { Text } from './Text';
import { Button } from './Button';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from '../../i18n';

interface GameEndModalProps {
    visible: boolean;
    onClose: () => void;
    onPlayAgain?: () => void;
    onGoHome?: () => void;
    status?: string;
    winner?: string | null;
    message?: string;
}

export const GameEndModal: React.FC<GameEndModalProps> = ({
    visible,
    onClose,
    onPlayAgain,
    onGoHome,
    status,
    winner,
    message,
}) => {
    const { colors, spacing, radii, glowShadow } = useTheme();
    const { t } = useTranslation();

    const getStatusIcon = () => {
        switch (status) {
            case 'checkmate': return 'trophy';
            case 'stalemate': return 'handshake';
            case 'draw': return 'scale-balance';
            case 'resigned': return 'flag-variant';
            default: return 'chess-king';
        }
    };

    return (
        <BaseModal visible={visible} onClose={onClose} size="md" dismissOnBackdrop={false}>
            <View style={[styles.content, { padding: spacing[6] }]}>
                {/* Icon */}
                <View style={[
                    styles.iconCircle,
                    {
                        backgroundColor: colors.primaryMuted,
                        ...glowShadow(colors.primary),
                    }
                ]}>
                    <MaterialCommunityIcons
                        name={getStatusIcon()}
                        size={36}
                        color={colors.primary}
                    />
                </View>

                {/* Status */}
                <Text variant="title" bold align="center" style={{ marginTop: spacing[4] }}>
                    {status === 'checkmate' ? t('game.checkmate') :
                        status === 'stalemate' ? t('game.stalemate') :
                            status === 'resigned' ? t('game.resigned') :
                                t('game.gameOver')}
                </Text>

                {/* Winner / Message */}
                {winner && (
                    <Text variant="body" color="secondary" align="center" style={{ marginTop: spacing[2] }}>
                        {winner}
                    </Text>
                )}
                {message && (
                    <Text variant="caption" color="secondary" align="center" style={{ marginTop: spacing[2] }}>
                        {message}
                    </Text>
                )}

                {/* Actions */}
                <View style={[styles.actions, { marginTop: spacing[6], gap: spacing[3] }]}>
                    {onPlayAgain && (
                        <Button
                            label={t('game.playAgain')}
                            variant="primary"
                            onPress={onPlayAgain}
                            icon="refresh"
                            fullWidth
                        />
                    )}
                    {onGoHome && (
                        <Button
                            label={t('game.backHome')}
                            variant="secondary"
                            onPress={onGoHome}
                            icon="home"
                            fullWidth
                        />
                    )}
                </View>
            </View>
        </BaseModal>
    );
};

const styles = StyleSheet.create({
    content: {
        alignItems: 'center',
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actions: {
        width: '100%',
    },
});
