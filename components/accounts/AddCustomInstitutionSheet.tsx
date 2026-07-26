import { useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type CustomInstitutionValues = {
  name: string;
  logoUrl: string;
};

type AddCustomInstitutionSheetProps = {
  visible: boolean;
  title: string;
  onApply: (values: CustomInstitutionValues) => void;
  onCancel: () => void;
};

export function AddCustomInstitutionSheet({
  visible,
  title,
  onApply,
  onCancel,
}: AddCustomInstitutionSheetProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  function handleApply() {
    if (!name.trim()) return;
    onApply({ name: name.trim(), logoUrl: logoUrl.trim() });
    setName("");
    setLogoUrl("");
  }

  function handleCancel() {
    setName("");
    setLogoUrl("");
    onCancel();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleCancel}>
      <Pressable className="flex-1 justify-end bg-black/60" onPress={handleCancel}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="rounded-t-3xl bg-neutral-900 px-5 pt-3"
          style={{ paddingBottom: insets.bottom + 20 }}
        >
          <View className="mb-4 h-1 w-10 self-center rounded-full bg-white/20" />
          <Text className="mb-4 text-xl font-bold text-white">{title}</Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Nombre de la cuenta"
            placeholderTextColor="#ffffff66"
            className="mb-3 rounded-2xl bg-white/5 px-4 py-3 text-white"
          />
          <TextInput
            value={logoUrl}
            onChangeText={setLogoUrl}
            placeholder="URL del logo (ej: chase.com)"
            placeholderTextColor="#ffffff66"
            autoCapitalize="none"
            keyboardType="url"
            className="mb-5 rounded-2xl bg-white/5 px-4 py-3 text-white"
          />

          <Pressable
            onPress={handleApply}
            disabled={!name.trim()}
            className={`mb-3 items-center rounded-full py-4 ${
              name.trim() ? "bg-lime-400" : "bg-white/10"
            }`}
          >
            <Text className={`font-bold ${name.trim() ? "text-black" : "text-white/40"}`}>
              Aplicar
            </Text>
          </Pressable>
          <Pressable onPress={handleCancel} className="items-center rounded-full bg-white/10 py-4">
            <Text className="font-semibold text-white">Cancelar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
