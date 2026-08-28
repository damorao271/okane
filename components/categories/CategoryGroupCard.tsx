import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { DropdownMenu, useDropdownAnchor } from "@/components/ui/DropdownMenu";
import { IconBadge } from "@/components/ui/IconBadge";
import { CategoryChip } from "@/components/categories/CategoryChip";

type CategoryChild = { id: string; name: string; icon: string | null };

type CategoryGroupCardProps = {
  category: { id: string; name: string; icon: string | null; color: string | null };
  children: CategoryChild[];
  onEdit: () => void;
  onAddSubcategory: () => void;
  onEditSubcategory: (id: string) => void;
  onDelete: () => void;
};

const MENU_OPTIONS = [
  { label: "Editar", value: "edit" },
  { label: "Agregar subcategoría", value: "add" },
  { label: "Eliminar", value: "delete" },
];

export function CategoryGroupCard({
  category,
  children,
  onEdit,
  onAddSubcategory,
  onEditSubcategory,
  onDelete,
}: CategoryGroupCardProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const anchor = useDropdownAnchor();
  const color = category.color ?? "#6b7280";

  function handleSelect(action: string) {
    if (action === "edit") onEdit();
    else if (action === "add") onAddSubcategory();
    else if (action === "delete") onDelete();
  }

  return (
    <Card className="mb-3 p-4">
      <View className="flex-row items-center gap-3">
        <Pressable onPress={onEdit} className="flex-1 flex-row items-center gap-3">
          <IconBadge icon={category.icon ?? "pricetag-outline"} color={color} size={44} />
          <Text className="flex-1 text-lg font-bold text-white">{category.name}</Text>
        </Pressable>
        <Pressable
          ref={anchor.ref}
          onPress={() => anchor.measure(() => setMenuVisible(true))}
          className="h-8 w-8 items-center justify-center rounded-full bg-white/10"
        >
          <Ionicons name="ellipsis-horizontal" size={16} color="#fff" />
        </Pressable>
      </View>

      {children.length > 0 && (
        <View className="mt-3 flex-row flex-wrap gap-2">
          {children.map((child) => (
            <CategoryChip
              key={child.id}
              icon={child.icon ?? "pricetag-outline"}
              label={child.name}
              color={color}
              onPress={() => onEditSubcategory(child.id)}
            />
          ))}
        </View>
      )}

      <DropdownMenu
        visible={menuVisible}
        position={anchor.position}
        options={MENU_OPTIONS}
        value=""
        onSelect={handleSelect}
        onClose={() => setMenuVisible(false)}
      />
    </Card>
  );
}
