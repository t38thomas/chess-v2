import React from 'react';
import { View, Modal, StyleSheet, Pressable } from 'react-native';
import { PieceType } from 'chess-core';
import { useTheme } from '../theme';
import { Text } from './Text';
import { Card } from './Card';
import { Piece } from './Piece';
import { useTranslation } from '../../i18n';

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

    const promotionOptions: PieceType[] = ['queen', 'rook', 'bishop', 'knight'];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <Pressable
                style={styles.overlay}
                onPress={onCancel}
            >
                <Pressable onPress={(e) => e.stopPropagation()}>
                    <Card padding="lg" style={{ backgroundColor: colors.surface }}>
                        <Text variant="title" bold style={{ marginBottom: spacing[4], textAlign: 'center' }}>
                            {t('game.selectPromotion')}
                        </Text>

                        <View style={styles.optionsContainer}>
                            {promotionOptions.map((pieceType) => (
                                <Pressable
                                    key={pieceType}
                                    style={[
                                        styles.option,
                                        { backgroundColor: colors.surfaceHighlight }
                                    ]}
                                    onPress={() => onSelect(pieceType)}
                                >
                                    <Piece
                                        type={pieceType}
                                        color={color}
                                        size={60}
                                    />
                                    <Text
                                        variant="caption"
                                        style={{ marginTop: spacing[2], textTransform: 'capitalize' }}
                                    >
                                        {pieceType}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </Card>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    optionsContainer: {
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'center',
    },
    option: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        minWidth: 90,
    },
});
