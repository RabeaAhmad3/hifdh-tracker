import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/lib/colors';

type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  message: string;
  type: ToastType;
  id: number;
}

interface ToastContextValue {
  show: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const typeStyles: Record<ToastType, { bg: string; text: string }> = {
  success: { bg: 'bg-success', text: 'text-white' },
  error: { bg: 'bg-error', text: 'text-white' },
  info: { bg: 'bg-primary', text: 'text-white' },
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const translateY = useRef(new Animated.Value(-100)).current;
  const idCounter = useRef(0);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timer and animations on unmount
  useEffect(() => {
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      translateY.stopAnimation();
    };
  }, []);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  const dismiss = useCallback(() => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        clearToast();
      }
    });
  }, [translateY, clearToast]);

  const show = useCallback(
    (message: string, type: ToastType = 'info') => {
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
      }

      idCounter.current += 1;
      const id = idCounter.current;
      setToast({ message, type, id });

      // Reset position then animate in
      translateY.setValue(-100);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      dismissTimer.current = setTimeout(() => {
        dismiss();
      }, 3000);
    },
    [translateY, dismiss],
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <Animated.View
          style={{
            position: 'absolute',
            top: insets.top + 8,
            left: 16,
            right: 16,
            zIndex: 9999,
            transform: [{ translateY }],
          }}
          pointerEvents="none"
        >
          <View
            className={`rounded-button px-4 py-3 ${typeStyles[toast.type].bg}`}
          >
            <Text
              className={`font-body-medium text-[14px] text-center ${typeStyles[toast.type].text}`}
            >
              {toast.message}
            </Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}
