import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { deleteCategory, updateCategory, useCategory } from "@/db/queries/categories";
import {
  CategoryForm,
  type CategoryFormHandle,
  type CategoryFormValues,
} from "@/components/categories/CategoryForm";
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";

export default function EditCategoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: category } = useCategory(id);
  const formRef = useRef<CategoryFormHandle>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  function handleSubmit(values: CategoryFormValues) {
    if (!category) return;
    updateCategory(category.id, {
      name: values.name,
      icon: values.icon,
      color: values.color,
    });
    router.back();
  }

  function handleConfirmDelete() {
    if (!category) return;
    deleteCategory(category.id);
    setConfirmVisible(false);
    router.back();
  }

  const childCount = category?.children?.length ?? 0;

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-4 py-2">
        <Pressable
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full bg-white/10"
        >
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </Pressable>
        <Text className="text-lg font-bold text-white">Editar Categoría</Text>
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

      {!category ? (
        <ActivityIndicator color="#fff" className="mt-10" />
      ) : (
        <CategoryForm
          ref={formRef}
          mode="edit"
          initialValues={{
            name: category.name,
            type: category.type,
            icon: category.icon ?? undefined,
            color: category.color ?? undefined,
          }}
          onSubmit={handleSubmit}
        />
      )}

      <ConfirmSheet
        visible={confirmVisible}
        title="¿Eliminar categoría?"
        description={
          childCount > 0
            ? `"${category?.name ?? ""}" y sus ${childCount} subcategorías dejarán de aparecer en tu lista. Su historial de transacciones se conserva.`
            : `"${category?.name ?? ""}" dejará de aparecer en tu lista de categorías. Su historial de transacciones se conserva.`
        }
        confirmLabel="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmVisible(false)}
      />
    </View>
  );
}
