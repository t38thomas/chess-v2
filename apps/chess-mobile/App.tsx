import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from './src/ui/theme';
import { I18nProvider } from './src/i18n';
import { SoundProvider } from './src/ui/context/SoundContext';
import { GameScreen } from './src/screens/GameScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { OnlineGameScreen } from './src/screens/OnlineGameScreen';
import { SafeAreaView } from 'react-native-safe-area-context';

type Screen = 'home' | 'local' | 'online';

export default function App() {
    const [currentScreen, setCurrentScreen] = useState<Screen>('home');

    const handleNavigateToLocal = () => setCurrentScreen('local');
    const handleNavigateToOnline = () => setCurrentScreen('online');
    const handleNavigateToHome = () => setCurrentScreen('home');

    const renderScreen = () => {
        switch (currentScreen) {
            case 'home':
                return (
                    <HomeScreen
                        onNavigate={(screen) => setCurrentScreen(screen)}
                    />
                );
            case 'local':
                return (
                    <GameScreen
                        onNavigateBack={handleNavigateToHome}
                    />
                );
            case 'online':
                return (
                    <OnlineGameScreen
                        onNavigateBack={handleNavigateToHome}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <ThemeProvider>
            <I18nProvider>
                <SoundProvider>
                    <SafeAreaView style={styles.container}>
                        <StatusBar style="auto" />
                        {renderScreen()}
                    </SafeAreaView>
                </SoundProvider>
            </I18nProvider>
        </ThemeProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
