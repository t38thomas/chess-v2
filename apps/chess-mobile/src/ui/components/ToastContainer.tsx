import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useToast } from '../../context/ToastContext';
import { Toast } from './Toast';
import { SafeAreaView } from 'react-native-safe-area-context';

export const ToastContainer: React.FC = () => {
    const { toasts } = useToast();

    if (toasts.length === 0) return null;

    return (
        <View style={styles.container} pointerEvents="box-none">
            <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
                {toasts.map((toast, index) => (
                    <Toast key={toast.id} data={toast} index={index} />
                ))}
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'flex-start',
        zIndex: 9999, // Ensure it's on top of everything
    },
    safeArea: {
        flex: 1,
        justifyContent: 'flex-start',
        paddingTop: 16, // Add some top padding,
    }
});
