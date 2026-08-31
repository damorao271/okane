import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

type NumericKeypadProps = {
  onDigit: (digit: string) => void;
  onComma: () => void;
  onBackspace: () => void;
  onClear: () => void;
  onOperator: (operator: "+" | "-") => void;
  onConfirm: () => void;
};

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

export function NumericKeypad({
  onDigit,
  onComma,
  onBackspace,
  onClear,
  onOperator,
  onConfirm,
}: NumericKeypadProps) {
  return (
    <View className="gap-2">
      <View className="flex-row gap-2">
        <Key onPress={() => onDigit("1")}>
          <Text className="text-2xl font-semibold text-white">1</Text>
        </Key>
        <Key onPress={() => onDigit("2")}>
          <Text className="text-2xl font-semibold text-white">2</Text>
        </Key>
        <Key onPress={() => onDigit("3")}>
          <Text className="text-2xl font-semibold text-white">3</Text>
        </Key>
        <Key onPress={onClear}>
          <Text className="text-2xl font-semibold text-amber-500">C</Text>
        </Key>
      </View>
      <View className="flex-row gap-2">
        <Key onPress={() => onDigit("4")}>
          <Text className="text-2xl font-semibold text-white">4</Text>
        </Key>
        <Key onPress={() => onDigit("5")}>
          <Text className="text-2xl font-semibold text-white">5</Text>
        </Key>
        <Key onPress={() => onDigit("6")}>
          <Text className="text-2xl font-semibold text-white">6</Text>
        </Key>
        <Key onPress={() => onOperator("+")}>
          <Text className="text-2xl font-semibold text-lime-400">+</Text>
        </Key>
      </View>
      <View className="flex-row gap-2">
        <Key onPress={() => onDigit("7")}>
          <Text className="text-2xl font-semibold text-white">7</Text>
        </Key>
        <Key onPress={() => onDigit("8")}>
          <Text className="text-2xl font-semibold text-white">8</Text>
        </Key>
        <Key onPress={() => onDigit("9")}>
          <Text className="text-2xl font-semibold text-white">9</Text>
        </Key>
        <Key onPress={() => onOperator("-")}>
          <Text className="text-2xl font-semibold text-red-500">−</Text>
        </Key>
      </View>
      <View className="flex-row gap-2">
        <Key onPress={onComma}>
          <Text className="text-2xl font-semibold text-white">,</Text>
        </Key>
        <Key onPress={() => onDigit("0")}>
          <Text className="text-2xl font-semibold text-white">0</Text>
        </Key>
        <Key onPress={onBackspace}>
          <Ionicons name="backspace-outline" size={22} color="#fff" />
        </Key>
        <Key onPress={onConfirm} className="bg-lime-400">
          <Ionicons name="arrow-forward" size={22} color="#000" />
        </Key>
      </View>
    </View>
  );
}
