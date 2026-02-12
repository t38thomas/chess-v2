import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from './Text';
import { Icon } from './Icon';
import { useTheme } from '../theme';
import Animated, {
    useAnimatedStyle,
    withSpring,
    withRepeat,
    withSequence,
    FadeInRight,
    FadeOutRight
} from 'react-native-reanimated';
import { PERK_LIBRARY } from 'chess-core';

interface AbilityButtonProps {
    abilities: string[];
    onPress: (abilityId: string) => void;
}

export const AbilityButton: React.FC<AbilityButtonProps> = ({ abilities, onPress }) => {
    const { colors } = useTheme();

    if (abilities.length === 0) return null;

    return (
        <View style={styles.container}>
            {abilities.map((id, index) => {
                const perk = (PERK_LIBRARY as any)[id];
                if (!perk) return null;

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
                                <Text bold style={styles.title}>{perk.name}</Text>
                                <Text variant="caption" style={styles.desc}>{perk.description}</Text>
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
