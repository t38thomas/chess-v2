import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenProps {
    children: React.ReactNode;
    safe?: boolean;
}

/**
 * Base screen wrapper component with safe area and theme
 */
export const Screen: React.FC<ScreenProps> = ({ children, safe = true }) => {
    const { colors } = useTheme();

    const Wrapper = safe ? SafeAreaView : View;

    return (
        <Wrapper style={[styles.screen, { backgroundColor: colors.background }]}>
            {children}
        </Wrapper>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
});
