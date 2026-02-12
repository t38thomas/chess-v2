import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useBreakpoint } from './useBreakpoint';

interface ContainerProps {
    children: React.ReactNode;
    maxWidth?: number;
    style?: ViewStyle;
}

/**
 * Responsive container component with max-width constraints
 */
export const Container: React.FC<ContainerProps> = ({
    children,
    maxWidth = 1200,
    style
}) => {
    const { width } = useBreakpoint();

    return (
        <View style={[
            styles.container,
            { maxWidth: Math.min(width, maxWidth) },
            style
        ]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        alignSelf: 'center',
    },
});
