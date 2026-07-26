import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAccounts } from "@/db/queries/accounts";
import { pickLatestUsdRate, useCurrencies, useExchangeRates } from "@/db/queries/currencies";
import { convertMinorToUsdCents, formatMinor } from "@/lib/money";
import { AccountListItem } from "@/components/accounts/AccountListItem";
import { Card } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { DropdownMenu, useDropdownAnchor } from "@/components/ui/DropdownMenu";

const SORT_OPTIONS = [
  { label: "A-Z", value: "name" },
  { label: "Mayor saldo", value: "amount" },
];

export default function AccountsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: accounts } = useAccounts();
  const { data: currencies } = useCurrencies();
  const { data: rates } = useExchangeRates();

  const [filterCurrencyId, setFilterCurrencyId] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "amount">("name");
  const [hidden, setHidden] = useState(false);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const sortAnchor = useDropdownAnchor();

  function usdValue(account: { currencyId: string; balanceMinor: number }) {
    const currency = currencies.find((c) => c.id === account.currencyId);
    const rate = pickLatestUsdRate(rates, account.currencyId);
    if (!currency || !rate) return 0;
    return convertMinorToUsdCents(account.balanceMinor, currency.decimals, rate);
  }

  const usedCurrencyIds = Array.from(new Set(accounts.map((a) => a.currencyId)));
  const filterOptions = [
    { label: "Todas", value: "all", icon: "grid-outline" },
    ...usedCurrencyIds.map((id) => {
      const currency = currencies.find((c) => c.id === id);
      return { label: currency ? `${currency.symbol} ${currency.name}` : id, value: id };
    }),
  ];

  const filtered = useMemo(() => {
    const list =
      filterCurrencyId === "all"
        ? accounts
        : accounts.filter((a) => a.currencyId === filterCurrencyId);
    return [...list].sort((a, b) =>
      sortBy === "name" ? a.name.localeCompare(b.name) : usdValue(b) - usdValue(a)
    );
  }, [accounts, filterCurrencyId, sortBy, currencies, rates]);

  const totalUsdCents = accounts.reduce((sum, account) => {
    const currency = currencies.find((c) => c.id === account.currencyId);
    const rate = pickLatestUsdRate(rates, account.currencyId);
    if (!currency || !rate) return sum;
    return sum + convertMinorToUsdCents(account.balanceMinor, currency.decimals, rate);
  }, 0);

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-4 py-2">
        <Pressable
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full bg-white/10"
        >
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </Pressable>
        <Text className="text-lg font-bold text-white">Cuentas</Text>
        <View className="h-9 w-9 items-center justify-center rounded-full bg-white/10">
          <Text className="font-bold text-white">$</Text>
        </View>
      </View>

      <View className="px-4">
        <Card className="mb-3 flex-row items-center justify-between p-4">
          <View>
            <Text className="text-white/60">Balance total</Text>
            <Text className="text-2xl font-bold text-white">
              {hidden ? "••••••" : formatMinor(totalUsdCents, { symbol: "$", decimals: 2 })}
            </Text>
          </View>
          <Pressable onPress={() => setHidden((h) => !h)}>
            <Ionicons name={hidden ? "eye-off-outline" : "eye-outline"} size={20} color="#fff" />
          </Pressable>
        </Card>

        <SegmentedControl
          variant="chips"
          value={filterCurrencyId}
          onChange={setFilterCurrencyId}
          options={filterOptions}
        />

        <View className="my-2 flex-row items-center justify-between">
          <Text className="text-sm text-white/50">{filtered.length} cuentas</Text>
          <Pressable
            ref={sortAnchor.ref}
            onPress={() => sortAnchor.measure(() => setSortMenuVisible(true))}
            className="flex-row items-center gap-1 rounded-full bg-white/10 px-2.5 py-1"
          >
            <Ionicons name="swap-vertical-outline" size={13} color="#fff" />
            <Text className="text-xs text-white">
              {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
            </Text>
          </Pressable>
        </View>
      </View>

      <DropdownMenu
        visible={sortMenuVisible}
        position={sortAnchor.position}
        options={SORT_OPTIONS}
        value={sortBy}
        onSelect={(v) => setSortBy(v as "name" | "amount")}
        onClose={() => setSortMenuVisible(false)}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        renderItem={({ item }) => (
          <AccountListItem
            account={item}
            hidden={hidden}
            onPress={() => router.push(`/accounts/${item.id}/edit`)}
          />
        )}
        ListEmptyComponent={
          <Text className="mt-10 text-center text-white/40">Todavía no tienes cuentas.</Text>
        }
      />

      <Pressable
        onPress={() => router.push("/accounts/new")}
        className="absolute bottom-8 left-4 right-4 flex-row items-center justify-center gap-2 rounded-full bg-lime-400 py-4"
      >
        <Ionicons name="add" size={20} color="#000" />
        <Text className="font-bold text-black">Nueva cuenta</Text>
      </Pressable>
    </View>
  );
}
