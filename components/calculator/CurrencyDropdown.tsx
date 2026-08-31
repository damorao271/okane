import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { Modal, Pressable, Text, View, type View as RNView } from "react-native";

export type PickableCurrency = {
  id: string;
  code: string;
  name: string;
  symbol: string;
};

const CURRENCY_FLAGS: Record<string, string> = {
  VES: "🇻🇪",
  USD: "🇺🇸",
  EUR: "🇪🇺",
};

function CurrencyBadge({ code }: { code: string }) {
  if (code === "USDT") {
    return (
      <View className="h-8 w-8 items-center justify-center rounded-full bg-[#26a17b]/20">
        <Text className="text-sm font-bold text-[#26a17b]">₮</Text>
      </View>
    );
  }
  return (
    <View className="h-8 w-8 items-center justify-center rounded-full bg-white/10">
      <Text className="text-base">{CURRENCY_FLAGS[code] ?? "★"}</Text>
    </View>
  );
}

type AnchorPosition = { top: number; left: number };

/** Measures a trigger element's on-screen position so the dropdown can anchor just below it. */
export function useCurrencyAnchor() {
  const ref = useRef<RNView>(null);
  const [position, setPosition] = useState<AnchorPosition | null>(null);

  function measure(onDone: () => void) {
    ref.current?.measureInWindow((x, y, _width, height) => {
      setPosition({ top: y + height + 6, left: x });
      onDone();
    });
  }

  return { ref, position, measure };
}

type CurrencyDropdownProps = {
  visible: boolean;
  position: AnchorPosition | null;
  currencies: PickableCurrency[];
  selectedId: string | null;
  onSelect: (currency: PickableCurrency) => void;
  onClose: () => void;
  /** When provided, renders an extra "Personalizada" row (a manually-entered rate) below the real currencies. */
  onSelectCustom?: () => void;
};

export function CurrencyDropdown({
  visible,
  position,
  currencies,
  selectedId,
  onSelect,
  onClose,
  onSelectCustom,
}: CurrencyDropdownProps) {
  if (!position) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1" onPress={onClose}>
        <View
          className="absolute min-w-[190px] overflow-hidden rounded-2xl bg-neutral-800"
          style={{ top: position.top, left: position.left }}
        >
          {currencies.map((currency) => {
            const selected = currency.id === selectedId;
            return (
              <Pressable
                key={currency.id}
                onPress={() => {
                  onSelect(currency);
                  onClose();
                }}
                className="flex-row items-center gap-3 px-4 py-3"
              >
                <CurrencyBadge code={currency.code} />
                <Text className="flex-1 text-base font-semibold text-white">
                  {currency.symbol} {currency.code}
                </Text>
                {selected && <Ionicons name="checkmark-circle" size={18} color="#a3e635" />}
              </Pressable>
            );
          })}
          {onSelectCustom && (
            <Pressable
              onPress={() => {
                onSelectCustom();
                onClose();
              }}
              className="flex-row items-center gap-3 px-4 py-3"
            >
              <View className="h-8 w-8 items-center justify-center rounded-full bg-white/10">
                <Ionicons name="star" size={15} color="#eab308" />
              </View>
              <Text className="flex-1 text-base font-semibold text-white">Personalizada</Text>
              {selectedId === "custom" && (
                <Ionicons name="checkmark-circle" size={18} color="#a3e635" />
              )}
            </Pressable>
          )}
        </View>
      </Pressable>
    </Modal>
  );
}
