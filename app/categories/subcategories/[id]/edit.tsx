import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { deleteCategory, updateCategory, useCategory } from "@/db/queries/categories";
import {
  SubcategoryForm,
  type SubcategoryFormHandle,
  type SubcategoryFormValues,
} from "@/components/categories/SubcategoryForm";
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";

export default function EditSubcategoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: subcategory } = useCategory(id);
  const formRef = useRef<SubcategoryFormHandle>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  function handleSubmit(values: SubcategoryFormValues) {
    if (!subcategory) return;
    updateCategory(subcategory.id, { name: values.name, icon: values.icon });
    router.back();
  }

  function handleConfirmDelete() {
    if (!subcategory) return;
    deleteCategory(subcategory.id);
    setConfirmVisible(false);
    router.back();
  }

  const parent = subcategory?.parent;

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-4 py-2">
        <Pressable
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full bg-white/10"
        >
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </Pressable>
        <Text className="text-lg font-bold text-white">Editar Subcategoría</Text>
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => setConfirmVisible(true)}
            className="h-9 w-9 items-center justify-center rounded-full bg-white/10"
          >
            <Ionicons name="trash-outline" size={16} color="#fff" />
          </Pressable>
          <Pressable
            onPress={() => formRef.current?.submit()}
            className="h-9 w-9 items-center justify-center rounded-full bg-lime-400"
          >
            <Ionicons name="checkmark" size={18} color="#000" />
          </Pressable>
        </View>
      </View>

      {!subcategory || !parent ? (
        <ActivityIndicator color="#fff" className="mt-10" />
      ) : (
        <SubcategoryForm
          ref={formRef}
          mode="edit"
          parent={{ name: parent.name, icon: parent.icon ?? "pricetag-outline", color: parent.color ?? "#6b7280" }}
          initialValues={{ name: subcategory.name, icon: subcategory.icon ?? undefined }}
          onSubmit={handleSubmit}
        />
      )}

      <ConfirmSheet
        visible={confirmVisible}
        title="¿Eliminar subcategoría?"
        description={`"${subcategory?.name ?? ""}" dejará de aparecer en tu lista. Su historial de transacciones se conserva.`}
        confirmLabel="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmVisible(false)}
      />
    </View>
  );
}
