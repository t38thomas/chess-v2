import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Screen } from '../responsive/Screen';
import { useBreakpoint } from '../responsive/useBreakpoint';
import { useTheme } from '../theme';
import { IconButton } from './IconButton';

interface GameSessionLayoutProps {
    title: string;
    onBack?: () => void;
    board: React.ReactNode;
    panel?: React.ReactNode;
}

/**
 * Responsive layout for game sessions (local and online)
 * Adapts between mobile (vertical) and wide-screen (horizontal) layouts
 */
export const GameSessionLayout: React.FC<GameSessionLayoutProps> = ({
    title,
    onBack,
    board,
    panel,
}) => {
    const { isMobile } = useBreakpoint();
    const { spacing, colors } = useTheme();

    return (
        <Screen>
            {/* Header with back button */}
            {onBack && (
                <View style={[styles.header, { paddingHorizontal: spacing[4] }]}>
                    <IconButton
                        icon="arrow-left"
                        onPress={onBack}
                        variant="ghost"
                    />
                </View>
            )}

            {/* Main content area */}
            <View style={styles.content}>
                {isMobile ? (
                    // Mobile layout: vertical stacking
                    <ScrollView
                        contentContainerStyle={[
                            styles.mobileContainer,
                            { padding: spacing[3] }
                        ]}
                    >
                        <View style={styles.boardContainer}>
                            {board}
                        </View>
                        {panel ? <View style={[styles.panelContainer, { marginTop: spacing[4] }]}>
                            {panel}
                        </View> : null}
                    </ScrollView>
                ) : (
                    // Wide screen layout: horizontal side-by-side
                    <View style={[styles.wideContainer, { padding: spacing[4], gap: spacing[4] }]}>
                        <View style={styles.boardContainer}>
                            {board}
                        </View>
                        {panel ? <View style={styles.panelWide}>
                            {panel}
                        </View> : null}
                    </View>
                )}
            </View>
        </Screen>
    );
};

const styles = StyleSheet.create({
    header: {
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    mobileContainer: {
        alignItems: 'center',
    },
    wideContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    boardContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    panelContainer: {
        width: '100%',
    },
    panelWide: {
        flex: 1,
        maxWidth: 400,
    },
});
