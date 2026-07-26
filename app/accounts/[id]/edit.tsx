import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { archiveAccount, updateAccount, useAccount } from "@/db/queries/accounts";
import { AccountForm, type AccountFormValues } from "@/components/accounts/AccountForm";
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";

export default function EditAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: account } = useAccount(id);
  const [submitting, setSubmitting] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  function handleSubmit(values: AccountFormValues) {
    if (!account) return;
    setSubmitting(true);
    try {
      updateAccount(account.id, {
        name: values.name,
        label: values.label,
        type: values.type,
        icon: values.icon,
        color: values.color,
      });
      router.back();
    } finally {
      setSubmitting(false);
    }
  }

  function handleConfirmDelete() {
    if (!account) return;
    archiveAccount(account.id);
    setConfirmVisible(false);
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
        <Text className="text-lg font-bold text-white">Editar cuenta</Text>
        <Pressable
          onPress={() => setConfirmVisible(true)}
          className="h-9 w-9 items-center justify-center rounded-full bg-white/10"
        >
          <Ionicons name="trash-outline" size={16} color="#fff" />
        </Pressable>
      </View>

      {!account ? (
        <ActivityIndicator color="#fff" className="mt-10" />
      ) : (
        <AccountForm
          mode="edit"
          initialValues={{
            name: account.name,
            label: account.label ?? undefined,
            type: account.type,
            currencyId: account.currencyId,
            icon: account.icon ?? undefined,
            color: account.color ?? undefined,
          }}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}

      <ConfirmSheet
        visible={confirmVisible}
        title="¿Eliminar cuenta?"
        description={`"${account?.name ?? ""}" dejará de aparecer en tu lista de cuentas. Su historial de transacciones se conserva.`}
        confirmLabel="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmVisible(false)}
      />
    </View>
  );
}
