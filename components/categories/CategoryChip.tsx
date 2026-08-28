import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

type CategoryChipProps = {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
};

export function CategoryChip({ icon, label, color, onPress }: CategoryChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{ width: "31%", minHeight: 86 }}
      className="items-center justify-start gap-1.5 rounded-2xl bg-white/5 px-1.5 py-3"
    >
      <View
        className="h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}22` }}
      >
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text
        numberOfLines={2}
        className="text-center text-xs font-semibold leading-4"
        style={{ color }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
