import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { faviconUrlForDomain } from "@/lib/favicon";
import type { Institution } from "@/lib/institutionCatalog";
import { IconBadge } from "@/components/ui/IconBadge";

type InstitutionPickerSheetProps = {
  visible: boolean;
  institutions: Institution[];
  otroSubtitle: string;
  onSelect: (institution: Institution) => void;
  onSelectOtro: () => void;
  onClose: () => void;
};

export function InstitutionPickerSheet({
  visible,
  institutions,
  otroSubtitle,
  onSelect,
  onSelectOtro,
  onClose,
}: InstitutionPickerSheetProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  const filtered = institutions.filter((i) =>
    i.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/60" onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="h-[80%] rounded-t-3xl bg-neutral-900 px-5 pt-3"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <View className="mb-4 h-1 w-10 self-center rounded-full bg-white/20" />
          <Text className="mb-4 text-xl font-bold text-white">Seleccionar cuenta</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar..."
            placeholderTextColor="#ffffff66"
            autoCapitalize="none"
            className="mb-4 rounded-2xl bg-black/40 px-4 py-3 text-white"
          />
          <ScrollView contentContainerClassName="gap-1 pb-4" showsVerticalScrollIndicator={false}>
            {filtered.map((institution) => (
              <Pressable
                key={institution.id}
                onPress={() => onSelect(institution)}
                className="flex-row items-center gap-3 rounded-2xl px-2 py-2.5"
              >
                <IconBadge
                  icon={institution.domain ? faviconUrlForDomain(institution.domain) : institution.icon!}
                  color={institution.color}
                  size={40}
                />
                <Text className="text-base text-white">{institution.name}</Text>
              </Pressable>
            ))}

            <Pressable
              onPress={onSelectOtro}
              className="mt-1 flex-row items-center gap-3 rounded-2xl px-2 py-2.5"
            >
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                <Ionicons name="add" size={20} color="#fff" />
              </View>
              <View className="flex-1">
                <Text className="text-base text-white">Otro</Text>
                <Text className="text-xs text-white/50">{otroSubtitle}</Text>
              </View>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
