import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createCategory } from "@/db/queries/categories";
import { CategoryForm, type CategoryFormHandle, type CategoryFormValues } from "@/components/categories/CategoryForm";

export default function NewCategoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const formRef = useRef<CategoryFormHandle>(null);

  function handleSubmit(values: CategoryFormValues) {
    createCategory(values);
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
        <Text className="text-lg font-bold text-white">Nueva Categoría</Text>
        <Pressable
          onPress={() => formRef.current?.submit()}
          className="h-9 w-9 items-center justify-center rounded-full bg-lime-400"
        >
          <Ionicons name="checkmark" size={18} color="#000" />
        </Pressable>
      </View>

      <CategoryForm ref={formRef} mode="create" onSubmit={handleSubmit} />
    </View>
  );
}
