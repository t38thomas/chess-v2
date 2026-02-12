
import React from 'react';
import { View, StyleSheet, StatusBar, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';

interface ScreenProps {
    children: React.ReactNode;
    style?: ViewStyle;
    safeArea?: boolean;
}

export const Screen: React.FC<ScreenProps> = ({ children, style, safeArea = true }) => {
    const { colors, isDark } = useTheme();

    const containerStyle = {
        flex: 1,
        backgroundColor: colors.background,
    };

    if (safeArea) {
        return (
            <SafeAreaView style={[containerStyle, style]} edges={['top', 'left', 'right']}>
                <StatusBar
                    barStyle={isDark ? 'light-content' : 'dark-content'}
                    backgroundColor={colors.background}
                />
                <View style={{ flex: 1 }}>{children}</View>
            </SafeAreaView>
        );
    }

    return (
        <View style={[containerStyle, style]}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={colors.background}
            />
            {children}
        </View>
    );
};
