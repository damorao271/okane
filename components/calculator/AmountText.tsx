import { Text, type StyleProp, type TextStyle } from "react-native";

type AmountTextProps = {
  /** Numeric amount in major units (e.g. dollars, not cents). */
  value: number;
  /** Formats the numeric value for display. */
  formatter: (value: number) => string;
  style?: StyleProp<TextStyle>;
};

/** Amount text that auto-shrinks to fit long numbers on one line. */
export function AmountText({ value, formatter, style }: AmountTextProps) {
  return (
    <Text style={style} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.4}>
      {formatter(value)}
    </Text>
  );
}
