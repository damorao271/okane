import { forwardRef, useImperativeHandle, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import type { CategoryType } from "@/db/schema";
import { ColorSwatchPicker } from "@/components/ui/ColorSwatchPicker";
import { IconBadge } from "@/components/ui/IconBadge";
import { IconPicker } from "@/components/ui/IconPicker";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

export type CategoryFormValues = {
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
};

export type CategoryFormHandle = {
  submit: () => void;
};

type CategoryFormProps = {
  mode: "create" | "edit";
  initialValues?: Partial<CategoryFormValues>;
  onSubmit: (values: CategoryFormValues) => void;
};

const DEFAULT_ICON = "pricetag-outline";
const DEFAULT_COLOR = "#22c55e";

const TYPE_OPTIONS = [
  { label: "Gasto", value: "expense" },
  { label: "Ingreso", value: "income" },
];

export const CategoryForm = forwardRef<CategoryFormHandle, CategoryFormProps>(
  function CategoryForm({ mode, initialValues, onSubmit }, ref) {
    const [name, setName] = useState(initialValues?.name ?? "");
    const [type, setType] = useState<CategoryType>(initialValues?.type ?? "expense");
    const [color, setColor] = useState(initialValues?.color ?? DEFAULT_COLOR);
    const [icon, setIcon] = useState(initialValues?.icon ?? DEFAULT_ICON);

    useImperativeHandle(ref, () => ({
      submit: () => {
        if (!name.trim()) return;
        onSubmit({ name: name.trim(), type, icon, color });
      },
    }));

    return (
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-5 pb-16">
        <View className="flex-row items-center gap-3 rounded-2xl bg-white/5 px-3 py-2.5">
          <IconBadge icon={icon} color={color} size={40} />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Escribe el nombre de la categoría"
            placeholderTextColor="#ffffff66"
            className="flex-1 text-white"
            autoFocus={mode === "create"}
          />
        </View>

        {mode === "create" ? (
          <View className="items-center">
            <SegmentedControl value={type} onChange={(v) => setType(v as CategoryType)} options={TYPE_OPTIONS} />
          </View>
        ) : (
          <Text className="text-white/50">
            Tipo: {type === "expense" ? "Gasto" : "Ingreso"} (no editable)
          </Text>
        )}

        <ColorSwatchPicker value={color} onChange={setColor} />
        <IconPicker value={icon} onChange={setIcon} color={color} />
      </ScrollView>
    );
  }
);
