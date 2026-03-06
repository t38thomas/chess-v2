import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { PieceType } from 'chess-core';
import { useTheme } from '../theme';
import { Text } from './Text';
import { Piece } from './Piece';
import { BaseModal } from './BaseModal';
import { useTranslation, TxKeyPath } from '../../i18n';

interface PromotionModalProps {
    visible: boolean;
    color: 'white' | 'black';
    onSelect: (pieceType: PieceType) => void;
    onCancel: () => void;
}

export const PromotionModal: React.FC<PromotionModalProps> = ({
    visible,
    color,
    onSelect,
    onCancel,
}) => {
    const { colors, spacing } = useTheme();
    const { t } = useTranslation();

    const promotionOptions: { type: PieceType; labelKey: string }[] = [
        { type: 'queen', labelKey: 'game.queen' },
        { type: 'rook', labelKey: 'game.rook' },
        { type: 'bishop', labelKey: 'game.bishop' },
        { type: 'knight', labelKey: 'game.knight' },
    ];

    return (
        <BaseModal visible={visible} onClose={onCancel} size="sm">
            <Text variant="title" bold style={{ marginBottom: spacing[4], textAlign: 'center' }}>
                {t('game.selectPromotion')}
            </Text>

            <View style={styles.optionsContainer}>
                {promotionOptions.map(({ type, labelKey }) => (
                    <Pressable
                        key={type}
                        style={({ pressed }) => [
                            styles.option,
                            { backgroundColor: colors.surfaceHighlight },
                            pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }
                        ]}
                        onPress={() => onSelect(type)}
                    >
                        <Piece
                            type={type}
                            color={color}
                            size={60}
                        />
                        <Text
                            variant="caption"
                            style={{ marginTop: spacing[2] }}
                        >
                            {t(labelKey)}
                        </Text>
                    </Pressable>
                ))}
            </View>
        </BaseModal>
    );
};

const styles = StyleSheet.create({
    optionsContainer: {
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'center',
    },
    option: {
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
        minWidth: 90,
    },
});
