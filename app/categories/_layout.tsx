import { Stack } from "expo-router";

export default function CategoriesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="new" />
      <Stack.Screen name="[id]/edit" />
      <Stack.Screen name="[id]/subcategories/new" />
      <Stack.Screen name="subcategories/[id]/edit" />
    </Stack>
  );
}
