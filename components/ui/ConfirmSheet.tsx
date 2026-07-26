import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ConfirmSheetProps = {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmSheet({
  visible,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  destructive = true,
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable className="flex-1 justify-end bg-black/60" onPress={onCancel}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="rounded-t-3xl bg-neutral-900 px-5 pt-3"
          style={{ paddingBottom: insets.bottom + 20 }}
        >
          <View className="mb-4 h-1 w-10 self-center rounded-full bg-white/20" />
          <Text className="mb-2 text-xl font-bold text-white">{title}</Text>
          <Text className="mb-6 text-white/60">{description}</Text>
          <Pressable
            onPress={onConfirm}
            className={`mb-3 items-center rounded-full py-4 ${
              destructive ? "bg-red-500" : "bg-lime-400"
            }`}
          >
            <Text className={`font-bold ${destructive ? "text-white" : "text-black"}`}>
              {confirmLabel}
            </Text>
          </Pressable>
          <Pressable onPress={onCancel} className="items-center rounded-full bg-white/10 py-4">
            <Text className="font-semibold text-white">{cancelLabel}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
