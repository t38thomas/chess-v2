import React from 'react';
import { View, StyleSheet, Modal, TouchableWithoutFeedback, Switch } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';
import { Card } from './Card';
import { Button } from './Button';
import { IconButton } from './IconButton';
import { useTranslation } from '../../i18n';
import { useSoundContext } from '../context/SoundContext';

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
    const { colors, spacing, radii, typography, mode, setMode } = useTheme();
    const { t, locale, setLocale } = useTranslation();
    const { isEnabled, toggleSound } = useSoundContext();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                        <View style={[styles.container, { backgroundColor: colors.background }]}>
                            <View style={styles.header}>
                                <Text variant="title" bold>{t('settings.title')}</Text>
                                <IconButton icon="close" onPress={onClose} variant="ghost" />
                            </View>

                            {/* Language Section */}
                            <View style={styles.section}>
                                <Text variant="caption" color="secondary" style={{ marginBottom: spacing[2] }}>
                                    {t('settings.language')}
                                </Text>
                                <View style={styles.row}>
                                    <Button
                                        label="English"
                                        variant={locale === 'en' ? 'primary' : 'secondary'}
                                        onPress={() => setLocale('en')}
                                        style={{ flex: 1, marginRight: spacing[2] }}
                                        size="sm"
                                    />
                                    <Button
                                        label="Italiano"
                                        variant={locale === 'it' ? 'primary' : 'secondary'}
                                        onPress={() => setLocale('it')}
                                        style={{ flex: 1 }}
                                        size="sm"
                                    />
                                </View>
                            </View>

                            {/* Theme Section */}
                            <View style={styles.section}>
                                <Text variant="caption" color="secondary" style={{ marginBottom: spacing[2] }}>
                                    {t('settings.theme')}
                                </Text>
                                <View style={styles.row}>
                                    <Button
                                        label={t('settings.themeLight')}
                                        variant={mode === 'light' ? 'primary' : 'secondary'}
                                        onPress={() => setMode('light')}
                                        style={{ flex: 1, marginRight: spacing[2] }}
                                        size="sm"
                                    />
                                    <Button
                                        label={t('settings.themeDark')}
                                        variant={mode === 'dark' ? 'primary' : 'secondary'}
                                        onPress={() => setMode('dark')}
                                        style={{ flex: 1, marginRight: spacing[2] }}
                                        size="sm"
                                    />
                                    <Button
                                        label={t('settings.themeSystem')}
                                        variant={mode === 'system' ? 'primary' : 'secondary'}
                                        onPress={() => setMode('system')}
                                        style={{ flex: 1 }}
                                        size="sm"
                                    />
                                </View>
                            </View>

                            <View style={styles.section}>
                                <Text variant="caption" color="secondary" style={{ marginBottom: spacing[2] }}>
                                    {t('settings.sound')}
                                </Text>
                                <View style={styles.row}>
                                    <View style={{ flex: 1 }}>
                                        <Text>
                                            {isEnabled ? t('settings.soundOn') : t('settings.soundOff')}
                                        </Text>
                                    </View>
                                    <Switch
                                        value={isEnabled}
                                        onValueChange={toggleSound}
                                        trackColor={{ false: colors.border, true: colors.primary }}
                                        thumbColor={colors.text}
                                    />
                                </View>
                            </View>

                            <Button
                                label={t('settings.close')}
                                onPress={onClose}
                                variant="ghost"
                                fullWidth
                                style={{ marginTop: spacing[4] }}
                            />
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 16,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    section: {
        marginBottom: 24,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    }
});
