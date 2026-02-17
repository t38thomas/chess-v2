import { PERK_LIBRARY } from 'chess-core';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
    FadeInRight,
    FadeOutRight
} from 'react-native-reanimated';
import { useTheme } from '../theme';
import { Icon } from './Icon';
import { Text } from './Text';
import { useTranslation } from '../../i18n';

interface AbilityButtonProps {
    abilities: string[];
    onPress: (abilityId: string) => void;
}

export const AbilityButton: React.FC<AbilityButtonProps> = ({ abilities, onPress }) => {
    const { colors } = useTheme();
    const { t } = useTranslation();

    if (abilities.length === 0) return null;

    return (
        <View style={styles.container}>
            {abilities.map((id, index) => {
                const perk = (PERK_LIBRARY as any)[id];
                if (!perk) return null;

                // Translate name and description using the perk ID
                const name = t(`perks.${id}.name` as any);
                const translatedName = name.charAt(0).toUpperCase() + name.slice(1);
                const translatedDesc = t(`perks.${id}.description` as any);

                return (
                    <Animated.View
                        key={id}
                        entering={FadeInRight.delay(index * 100)}
                        exiting={FadeOutRight}
                    >
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: colors.primary }]}
                            onPress={() => onPress(id)}
                            activeOpacity={0.8}
                        >
                            <Icon name={perk.icon || 'star'} size={20} color="#fff" />
                            <View style={styles.textContainer}>
                                <Text bold style={styles.title}>{translatedName}</Text>
                                <Text variant="caption" style={styles.desc}>{translatedDesc}</Text>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 110,
        right: 20,
        gap: 12,
        zIndex: 1000,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        maxWidth: 240,
    },
    textContainer: {
        marginLeft: 12,
        flex: 1,
    },
    title: {
        color: '#fff',
        fontSize: 14,
    },
    desc: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 11,
        marginTop: 2,
    }
});
