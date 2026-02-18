import React from 'react';
import { View, StyleSheet, Switch } from 'react-native';
import { useTheme } from '../theme';
import { BaseModal } from './BaseModal';
import { Text } from './Text';
import { Button } from './Button';
import { IconButton } from './IconButton';
import { Divider } from './Divider';
import { useTranslation } from '../../i18n';
import { useSoundContext } from '../context/SoundContext';
import { useGameSettings } from '../../context/GameSettingsContext';

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
    const { colors, spacing, radii, typography, mode, setMode } = useTheme();
    const { t, locale, setLocale } = useTranslation();
    const { isEnabled, toggleSound } = useSoundContext();
    const { rotatePieces, toggleRotatePieces } = useGameSettings();

    return (
        <BaseModal visible={visible} onClose={onClose} size="md">
            <View style={[styles.content, { padding: spacing[6] }]}>
                {/* Header */}
                <View style={styles.header}>
                    <Text variant="title" bold>{t('settings.title')}</Text>
                    <IconButton icon="close" onPress={onClose} variant="ghost" />
                </View>

                {/* Language */}
                <View style={[styles.section, { marginTop: spacing[4] }]}>
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

                {/* Theme */}
                <View style={[styles.section, { marginTop: spacing[4] }]}>
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

                {/* Sound */}
                <View style={[styles.section, { marginTop: spacing[4] }]}>
                    <Text variant="caption" color="secondary" style={{ marginBottom: spacing[2] }}>
                        {t('settings.sound')}
                    </Text>
                    <View style={styles.switchRow}>
                        <Text style={{ flex: 1 }}>
                            {isEnabled ? t('settings.soundOn') : t('settings.soundOff')}
                        </Text>
                        <Switch
                            value={isEnabled}
                            onValueChange={toggleSound}
                            trackColor={{ false: colors.borderStrong, true: colors.primary }}
                            thumbColor={colors.textPrimary}
                        />
                    </View>
                </View>

                {/* Gameplay */}
                <View style={[styles.section, { marginTop: spacing[4] }]}>
                    <Text variant="caption" color="secondary" style={{ marginBottom: spacing[2] }}>
                        {t('settings.gameplay') || 'Gameplay'}
                    </Text>
                    <View style={styles.switchRow}>
                        <Text style={{ flex: 1 }}>
                            {t('settings.rotatePieces')}
                        </Text>
                        <Switch
                            value={rotatePieces}
                            onValueChange={toggleRotatePieces}
                            trackColor={{ false: colors.borderStrong, true: colors.primary }}
                            thumbColor={colors.textPrimary}
                        />
                    </View>
                </View>

                <Button
                    label={t('settings.close')}
                    onPress={onClose}
                    variant="ghost"
                    fullWidth
                    style={{ marginTop: spacing[6] }}
                />
            </View>
        </BaseModal>
    );
};

const styles = StyleSheet.create({
    content: {},
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    section: {},
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
});
