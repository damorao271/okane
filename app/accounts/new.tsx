import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createAccount } from "@/db/queries/accounts";
import { useCurrencies } from "@/db/queries/currencies";
import { AccountForm, type AccountFormValues } from "@/components/accounts/AccountForm";
import { toMinorUnits } from "@/lib/money";

export default function NewAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: currencies } = useCurrencies();
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(values: AccountFormValues) {
    const currency = currencies.find((c) => c.id === values.currencyId);
    if (!currency) return;
    setSubmitting(true);
    try {
      createAccount({
        name: values.name,
        label: values.label,
        type: values.type,
        currencyId: values.currencyId,
        icon: values.icon,
        color: values.color,
        openingBalanceMinor: toMinorUnits(values.openingBalance, currency.decimals),
      });
      router.back();
    } finally {
      setSubmitting(false);
    }
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
        <Text className="text-lg font-bold text-white">Nueva cuenta</Text>
        <View className="h-9 w-9" />
      </View>

      <AccountForm mode="create" onSubmit={handleSubmit} submitting={submitting} />
    </View>
  );
}
