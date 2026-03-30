import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
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
  const translateY = useSharedValue(-100);
  const idCounter = useRef(0);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  const dismiss = useCallback(() => {
    translateY.value = withTiming(-100, { duration: 300 }, (finished) => {
      if (finished) {
        runOnJS(clearToast)();
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
      translateY.value = -100;
      translateY.value = withTiming(0, { duration: 300 });

      dismissTimer.current = setTimeout(() => {
        dismiss();
      }, 3000);
    },
    [translateY, dismiss],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: insets.top + 8,
              left: 16,
              right: 16,
              zIndex: 9999,
            },
            animatedStyle,
          ]}
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
