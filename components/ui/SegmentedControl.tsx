import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, Text, View } from "react-native";

export type SegmentedOption = {
  label: string;
  value: string;
  icon?: string;
};

type SegmentedControlProps = {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  /** "toggle": segments share the row width evenly. "chips": one continuous bar, auto-width segments. */
  variant?: "toggle" | "chips";
};

export function SegmentedControl({
  options,
  value,
  onChange,
  variant = "toggle",
}: SegmentedControlProps) {
  const content = options.map((option) => {
    const selected = option.value === value;
    return (
      <Pressable
        key={option.value}
        onPress={() => onChange(option.value)}
        className={`flex-row items-center justify-center gap-1.5 rounded-full px-3.5 py-1.5 ${
          selected ? "bg-white/15" : "bg-transparent"
        } ${variant === "toggle" ? "flex-1" : ""}`}
      >
        {option.icon && (
          <Ionicons
            name={option.icon as any}
            size={14}
            color={selected ? "#fff" : "rgba(255,255,255,0.5)"}
          />
        )}
        <Text className={`font-semibold ${selected ? "text-white" : "text-white/50"}`}>
          {option.label}
        </Text>
      </Pressable>
    );
  });

  if (variant === "chips") {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row rounded-full bg-white/5 p-1">{content}</View>
      </ScrollView>
    );
  }

  return (
    <View className="flex-row rounded-full border border-white/10 bg-black/30 p-1">
      {content}
    </View>
  );
}
