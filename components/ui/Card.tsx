import { View, type ViewProps } from "react-native";

type CardProps = ViewProps & { className?: string };

export function Card({ className = "", style, children, ...rest }: CardProps) {
  return (
    <View className={`rounded-3xl bg-neutral-900 ${className}`} style={style} {...rest}>
      {children}
    </View>
  );
}
