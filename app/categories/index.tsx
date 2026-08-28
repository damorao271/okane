import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { deleteCategory, useCategoriesByType } from "@/db/queries/categories";
import type { CategoryType } from "@/db/schema";
import { CategoryGroupCard } from "@/components/categories/CategoryGroupCard";
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

const TYPE_OPTIONS = [
  { label: "Gastos", value: "expense", icon: "arrow-down-circle-outline" },
  { label: "Ingresos", value: "income", icon: "arrow-up-circle-outline" },
];

export default function CategoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<CategoryType>("expense");
  const { data: categories } = useCategoriesByType(type);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; childCount: number } | null>(
    null
  );

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    deleteCategory(deleteTarget.id);
    setDeleteTarget(null);
  }

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-4 py-2">
        <Pressable
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full bg-white/10"
        >
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </Pressable>
        <Text className="text-lg font-bold text-white">Categorías</Text>
        <View className="h-9 w-9 items-center justify-center rounded-full bg-white/10">
          <Ionicons name="help-outline" size={18} color="#fff" />
        </View>
      </View>

      <View className="items-center px-4 py-3">
        <SegmentedControl
          value={type}
          onChange={(v) => setType(v as CategoryType)}
          options={TYPE_OPTIONS}
        />
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        renderItem={({ item }) => (
          <CategoryGroupCard
            category={item}
            children={item.children}
            onEdit={() => router.push(`/categories/${item.id}/edit`)}
            onAddSubcategory={() => router.push(`/categories/${item.id}/subcategories/new`)}
            onEditSubcategory={(childId) => router.push(`/categories/subcategories/${childId}/edit`)}
            onDelete={() =>
              setDeleteTarget({ id: item.id, name: item.name, childCount: item.children.length })
            }
          />
        )}
        ListEmptyComponent={
          <Text className="mt-10 text-center text-white/40">Todavía no tienes categorías.</Text>
        }
      />

      <Pressable
        onPress={() => router.push("/categories/new")}
        className="absolute bottom-8 left-4 right-4 flex-row items-center justify-center gap-2 rounded-full bg-lime-400 py-4"
      >
        <Ionicons name="add" size={20} color="#000" />
        <Text className="font-bold text-black">Nueva categoría</Text>
      </Pressable>

      <ConfirmSheet
        visible={!!deleteTarget}
        title="¿Eliminar categoría?"
        description={
          deleteTarget && deleteTarget.childCount > 0
            ? `"${deleteTarget.name}" y sus ${deleteTarget.childCount} subcategorías dejarán de aparecer en tu lista. Su historial de transacciones se conserva.`
            : `"${deleteTarget?.name ?? ""}" dejará de aparecer en tu lista de categorías. Su historial de transacciones se conserva.`
        }
        confirmLabel="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
}
