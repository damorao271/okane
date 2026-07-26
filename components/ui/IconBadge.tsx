import { Ionicons } from "@expo/vector-icons";
import { Image, View } from "react-native";

type IconBadgeProps = {
  icon: string;
  color: string;
  size?: number;
};

export function IconBadge({ icon, color, size = 44 }: IconBadgeProps) {
  const isImage = icon.startsWith("http");

  return (
    <View
      className="items-center justify-center overflow-hidden rounded-2xl"
      style={{ width: size, height: size, backgroundColor: isImage ? color : `${color}33` }}
    >
      {isImage ? (
        <Image
          source={{ uri: icon }}
          style={{ width: size * 0.65, height: size * 0.65 }}
          resizeMode="contain"
        />
      ) : (
        <Ionicons name={icon as any} size={size * 0.5} color={color} />
      )}
    </View>
  );
}
