import { forwardRef, useImperativeHandle, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { IconBadge } from "@/components/ui/IconBadge";
import { IconPicker } from "@/components/ui/IconPicker";

export type SubcategoryFormValues = {
  name: string;
  icon: string;
};

export type SubcategoryFormHandle = {
  submit: () => void;
};

type SubcategoryFormProps = {
  mode: "create" | "edit";
  parent: { name: string; icon: string; color: string };
  initialValues?: Partial<SubcategoryFormValues>;
  onSubmit: (values: SubcategoryFormValues) => void;
};

const DEFAULT_ICON = "pricetag-outline";

export const SubcategoryForm = forwardRef<SubcategoryFormHandle, SubcategoryFormProps>(
  function SubcategoryForm({ mode, parent, initialValues, onSubmit }, ref) {
    const [name, setName] = useState(initialValues?.name ?? "");
    const [icon, setIcon] = useState(initialValues?.icon ?? DEFAULT_ICON);

    useImperativeHandle(ref, () => ({
      submit: () => {
        if (!name.trim()) return;
        onSubmit({ name: name.trim(), icon });
      },
    }));

    return (
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-5 pb-16">
        <View className="flex-row items-center gap-2 self-start rounded-full bg-white/5 px-3 py-1.5">
          <IconBadge icon={parent.icon} color={parent.color} size={24} />
          <Text className="text-white/70">{parent.name}</Text>
        </View>

        <View className="flex-row items-center gap-3 rounded-2xl bg-white/5 px-3 py-2.5">
          <IconBadge icon={icon} color={parent.color} size={40} />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Nombre de la subcategoría"
            placeholderTextColor="#ffffff66"
            className="flex-1 text-white"
            autoFocus={mode === "create"}
          />
        </View>

        <IconPicker value={icon} onChange={setIcon} color={parent.color} />
      </ScrollView>
    );
  }
);
