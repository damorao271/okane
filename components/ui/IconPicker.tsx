import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, Text, View } from "react-native";
import { ICON_GROUPS } from "@/lib/iconCatalog";

type IconPickerProps = {
  value: string;
  onChange: (icon: string) => void;
  color: string;
  groups?: { title: string; icons: string[] }[];
};

export function IconPicker({ value, onChange, color, groups = ICON_GROUPS }: IconPickerProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-5">
      {groups.map((group) => (
        <View key={group.title} className="w-44 gap-2">
          <Text className="text-sm font-semibold text-white/60">{group.title}</Text>
          <View className="flex-row flex-wrap gap-2">
            {group.icons.map((icon) => {
              const selected = icon === value;
              return (
                <Pressable
                  key={icon}
                  onPress={() => onChange(icon)}
                  className={`h-9 w-9 items-center justify-center rounded-xl ${
                    selected ? "border-2 border-white" : "border border-white/10"
                  }`}
                  style={{ backgroundColor: selected ? `${color}33` : "rgba(255,255,255,0.05)" }}
                >
                  <Ionicons name={icon as any} size={17} color={selected ? color : "#fff"} />
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
