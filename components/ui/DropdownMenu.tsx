import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { Dimensions, Modal, Pressable, Text, View, type View as RNView } from "react-native";

export type DropdownOption = {
  label: string;
  value: string;
};

type AnchorPosition = { top: number; right: number };

/** Measures a trigger element's on-screen position so a dropdown can anchor just below it. */
export function useDropdownAnchor() {
  const ref = useRef<RNView>(null);
  const [position, setPosition] = useState<AnchorPosition | null>(null);

  function measure(onDone: () => void) {
    ref.current?.measureInWindow((x, y, width, height) => {
      setPosition({ top: y + height + 6, right: Dimensions.get("window").width - (x + width) });
      onDone();
    });
  }

  return { ref, position, measure };
}

type DropdownMenuProps = {
  visible: boolean;
  position: AnchorPosition | null;
  options: DropdownOption[];
  value: string;
  onSelect: (value: string) => void;
  onClose: () => void;
};

export function DropdownMenu({
  visible,
  position,
  options,
  value,
  onSelect,
  onClose,
}: DropdownMenuProps) {
  if (!position) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1" onPress={onClose}>
        <View
          className="absolute min-w-[180px] overflow-hidden rounded-2xl bg-neutral-800"
          style={{ top: position.top, right: position.right }}
        >
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  onSelect(option.value);
                  onClose();
                }}
                className="flex-row items-center justify-between gap-8 px-4 py-3"
              >
                <Text className="text-base text-white">{option.label}</Text>
                {selected && <Ionicons name="checkmark-circle" size={18} color="#a3e635" />}
              </Pressable>
            );
          })}
        </View>
      </Pressable>
    </Modal>
  );
}
