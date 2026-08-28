import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createCategory, useCategory } from "@/db/queries/categories";
import {
  SubcategoryForm,
  type SubcategoryFormHandle,
  type SubcategoryFormValues,
} from "@/components/categories/SubcategoryForm";

export default function NewSubcategoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: parent } = useCategory(id);
  const formRef = useRef<SubcategoryFormHandle>(null);

  function handleSubmit(values: SubcategoryFormValues) {
    if (!parent) return;
    createCategory({
      name: values.name,
      type: parent.type,
      icon: values.icon,
      color: parent.color ?? "#6b7280",
      parentCategoryId: parent.id,
    });
    router.back();
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
        <Text className="text-lg font-bold text-white">Nueva Subcategoría</Text>
        <Pressable
          onPress={() => formRef.current?.submit()}
          className="h-9 w-9 items-center justify-center rounded-full bg-lime-400"
        >
          <Ionicons name="checkmark" size={18} color="#000" />
        </Pressable>
      </View>

      {!parent ? (
        <ActivityIndicator color="#fff" className="mt-10" />
      ) : (
        <SubcategoryForm
          ref={formRef}
          mode="create"
          parent={{ name: parent.name, icon: parent.icon ?? "pricetag-outline", color: parent.color ?? "#6b7280" }}
          onSubmit={handleSubmit}
        />
      )}
    </View>
  );
}
