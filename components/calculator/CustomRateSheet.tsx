import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function formatMajor(major: number): string {
  return major.toFixed(2).replace(".", ",");
}

/** POS-style entry: digits accumulate as minor units (cents), shifting the decimal point
 * as you type — matches how the reference app's rate keypad behaves (no comma key). */
function minorDigitsToDisplay(minorDigits: string): string {
  return formatMajor(Number.parseInt(minorDigits, 10) / 100);
}

function Key({
  onPress,
  children,
  className = "",
}: {
  onPress: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`h-16 flex-1 items-center justify-center rounded-2xl bg-neutral-800 ${className}`}
    >
      {children}
    </Pressable>
  );
}

type CustomRateSheetProps = {
  visible: boolean;
  initialValue: number | null;
  onConfirm: (value: number) => void;
  onClose: () => void;
};

export function CustomRateSheet({ visible, initialValue, onConfirm, onClose }: CustomRateSheetProps) {
  const insets = useSafeAreaInsets();
  const [minorDigits, setMinorDigits] = useState(() =>
    Math.round((initialValue ?? 0) * 100).toString()
  );

  // Reset the entry to the latest rate exactly when the sheet transitions closed -> open
  // (React Native's Modal keeps this component mounted even while hidden, so a plain
  // useEffect keyed on `visible` would apply the reset a frame late).
  const wasVisibleRef = useRef(visible);
  if (visible && !wasVisibleRef.current) {
    const fresh = Math.round((initialValue ?? 0) * 100).toString();
    if (minorDigits !== fresh) setMinorDigits(fresh);
  }
  wasVisibleRef.current = visible;

  const MAX_DIGITS = 9;

  function appendDigit(digit: string) {
    setMinorDigits((prev) => {
      if (prev.length >= MAX_DIGITS) return prev;
      return prev === "0" ? digit : prev + digit;
    });
  }

  function appendDoubleZero() {
    setMinorDigits((prev) => {
      if (prev === "0" || prev.length >= MAX_DIGITS - 1) return prev;
      return prev + "00";
    });
  }

  function backspace() {
    setMinorDigits((prev) => (prev.length <= 1 ? "0" : prev.slice(0, -1)));
  }

  function clear() {
    setMinorDigits("0");
  }

  function handleConfirm() {
    onConfirm(Number.parseInt(minorDigits, 10) / 100);
  }

  const text = minorDigitsToDisplay(minorDigits);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/60" onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="rounded-t-3xl bg-neutral-900 px-5 pt-3"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <View className="mb-2 h-1 w-10 self-center rounded-full bg-white/20" />
          <Text className="text-center text-sm text-white/50">Tasa personalizada</Text>
          <Text className="mb-4 text-center text-4xl font-bold text-white">Bs {text}</Text>

          <View className="flex-row gap-2">
            <View className="flex-1 gap-2">
              <View className="flex-row gap-2">
                <Key onPress={() => appendDigit("1")}>
                  <Text className="text-2xl font-semibold text-white">1</Text>
                </Key>
                <Key onPress={() => appendDigit("2")}>
                  <Text className="text-2xl font-semibold text-white">2</Text>
                </Key>
                <Key onPress={() => appendDigit("3")}>
                  <Text className="text-2xl font-semibold text-white">3</Text>
                </Key>
              </View>
              <View className="flex-row gap-2">
                <Key onPress={() => appendDigit("4")}>
                  <Text className="text-2xl font-semibold text-white">4</Text>
                </Key>
                <Key onPress={() => appendDigit("5")}>
                  <Text className="text-2xl font-semibold text-white">5</Text>
                </Key>
                <Key onPress={() => appendDigit("6")}>
                  <Text className="text-2xl font-semibold text-white">6</Text>
                </Key>
              </View>
              <View className="flex-row gap-2">
                <Key onPress={() => appendDigit("7")}>
                  <Text className="text-2xl font-semibold text-white">7</Text>
                </Key>
                <Key onPress={() => appendDigit("8")}>
                  <Text className="text-2xl font-semibold text-white">8</Text>
                </Key>
                <Key onPress={() => appendDigit("9")}>
                  <Text className="text-2xl font-semibold text-white">9</Text>
                </Key>
              </View>
              <View className="flex-row gap-2">
                <Key onPress={appendDoubleZero}>
                  <Text className="text-2xl font-semibold text-white">00</Text>
                </Key>
                <Key onPress={() => appendDigit("0")}>
                  <Text className="text-2xl font-semibold text-white">0</Text>
                </Key>
                <Key onPress={backspace}>
                  <Ionicons name="backspace-outline" size={22} color="#fff" />
                </Key>
              </View>
            </View>

            <View className="w-20 gap-2">
              <Key onPress={clear}>
                <Text className="text-2xl font-semibold text-amber-500">C</Text>
              </Key>
              <Key onPress={handleConfirm} className="flex-1 bg-lime-400">
                <Ionicons name="checkmark" size={28} color="#000" />
              </Key>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
