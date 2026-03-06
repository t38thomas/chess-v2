import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from './Text';
import { Icon } from './Icon';
import { Button } from './Button';
import { Card } from './Card';
import { useTheme } from '../theme';
import { useTranslation } from '../../i18n';
import { usePactTranslation } from '../hooks/usePactTranslation';
import { Pact } from 'chess-core';

interface PactDetailsModalProps {
    visible: boolean;
    pact: Pact | null;
    onClose: () => void;
}

export const PactDetailsModal: React.FC<PactDetailsModalProps> = ({ visible, pact, onClose }) => {
    const { colors, spacing } = useTheme();
    const { t } = useTranslation();
    const { translatePact } = usePactTranslation();

    const displayedPact = pact ? translatePact(pact) : null;

    if (!displayedPact) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.header}>
                        <View style={[styles.headerIcon, { backgroundColor: colors.primaryMuted }]}>
                            <Icon name={displayedPact.bonus.icon} size={28} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1, marginLeft: spacing[4] }}>
                            <Text variant="title" bold>{displayedPact.title}</Text>
                            <Text variant="caption" color="secondary">{t('pact.activePact')}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Icon name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <Text variant="body" style={{ marginBottom: spacing[6], lineHeight: 22 }}>
                            {displayedPact.description}
                        </Text>

                        {/* Bonus Section */}
                        <Card variant="flat" padding="md" style={[styles.perkCard, { backgroundColor: 'rgba(108,92,231,0.06)', borderColor: 'rgba(108,92,231,0.2)' }]}>
                            <View style={styles.perkHeader}>
                                <Icon name={pact?.bonus.icon ?? "plus-circle"} size={20} color={colors.primary} />
                                <Text variant="body" bold style={{ marginLeft: spacing[2], color: colors.primary }}>
                                    {t('pact.bonusPrefix', { name: displayedPact.bonus.name })}
                                </Text>
                            </View>
                            <Text variant="caption" style={{ marginTop: spacing[2], lineHeight: 18 }}>
                                {displayedPact.bonus.description}
                            </Text>
                        </Card>

                        <View style={{ height: spacing[4] }} />

                        {/* Malus Section */}
                        <Card variant="flat" padding="md" style={[styles.perkCard, { backgroundColor: 'rgba(214,48,49,0.06)', borderColor: 'rgba(214,48,49,0.2)' }]}>
                            <View style={styles.perkHeader}>
                                <Icon name={pact?.malus.icon ?? "minus-circle"} size={20} color={colors.danger} />
                                <Text variant="body" bold style={{ marginLeft: spacing[2], color: colors.danger }}>
                                    {t('pact.malusPrefix', { name: displayedPact.malus.name })}
                                </Text>
                            </View>
                            <Text variant="caption" style={{ marginTop: spacing[2], lineHeight: 18 }}>
                                {displayedPact.malus.description}
                            </Text>
                        </Card>
                    </ScrollView>

                    <Button
                        label={t('pact.gotIt')}
                        onPress={onClose}
                        variant="primary"
                        fullWidth
                        style={{ marginTop: spacing[4] }}
                    />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        width: '100%',
        maxWidth: 400,
        maxHeight: '80%',
        borderRadius: 24,
        borderWidth: 1,
        padding: 24,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButton: {
        padding: 4,
    },
    scrollContent: {
        maxHeight: 400,
    },
    perkCard: {
        borderWidth: 1,
        borderRadius: 16,
    },
    perkHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
