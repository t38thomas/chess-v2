import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from './src/ui/theme';
import { I18nProvider, initI18n } from './src/i18n';
import { SoundProvider } from './src/ui/context/SoundContext';
import { GameScreen } from './src/screens/GameScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { OnlineGameScreen } from './src/screens/OnlineGameScreen';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ToastProvider } from './src/context/ToastContext';
import { ToastContainer } from './src/ui/components/ToastContainer';

type Screen = 'home' | 'local' | 'online';

export default function App() {
    const [currentScreen, setCurrentScreen] = useState<Screen>('home');
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const initialize = async () => {
            try {
                await initI18n();
            } finally {
                setIsReady(true);
            }
        };
        initialize();
    }, []);

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
        <SafeAreaProvider>
            <ThemeProvider>
                <I18nProvider>
                    <ToastProvider>
                        <SoundProvider>
                            <SafeAreaView style={styles.container}>
                                <StatusBar style="auto" />
                                {isReady ? renderScreen() : null}
                                <ToastContainer />
                            </SafeAreaView>
                        </SoundProvider>
                    </ToastProvider>
                </I18nProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
