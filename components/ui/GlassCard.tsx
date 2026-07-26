import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { StyleSheet, View, type ViewProps } from "react-native";

type GlassCardProps = ViewProps & {
  className?: string;
  /** Classes for the padded content wrapper (default "p-5"). The outer `className` is only
   * for shape/sizing (flex, margins, width) — it must stay unpadded so the glass background
   * (an absolute-fill layer) reaches the card's rounded edges instead of sitting inset. */
  contentClassName?: string;
  tintColor?: string;
};

const hasRealGlass = isLiquidGlassAvailable();

export function GlassCard({
  className = "",
  contentClassName = "p-5",
  tintColor,
  style,
  children,
  ...rest
}: GlassCardProps) {
  return (
    <View className={`overflow-hidden rounded-3xl border border-white/10 ${className}`} {...rest}>
      <GlassView
        glassEffectStyle="regular"
        tintColor={tintColor}
        // Okane is always-dark (not following the system appearance), so the glass
        // must be forced dark too — otherwise it follows the device's light/dark
        // setting and can render as a bright, out-of-place panel.
        colorScheme="dark"
        style={[
          StyleSheet.absoluteFillObject,
          !hasRealGlass && { backgroundColor: "rgba(255,255,255,0.08)" },
        ]}
      />
      <View className={contentClassName} style={style}>
        {children}
      </View>
    </View>
  );
}
