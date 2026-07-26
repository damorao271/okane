import { Pressable, Text, View } from "react-native";
import { useLatestRateToUsd } from "@/db/queries/currencies";
import { DEFAULT_CURRENCY_IDS } from "@/db/seed";
import { convertMinorToUsdCents, formatMinor } from "@/lib/money";
import { IconBadge } from "@/components/ui/IconBadge";

type AccountWithCurrency = {
  id: string;
  name: string;
  label: string | null;
  icon: string | null;
  color: string | null;
  balanceMinor: number;
  currencyId: string;
  currency: {
    symbol: string;
    decimals: number;
  };
};

export function AccountListItem({
  account,
  onPress,
  hidden,
}: {
  account: AccountWithCurrency;
  onPress: () => void;
  hidden?: boolean;
}) {
  const isUsd = account.currencyId === DEFAULT_CURRENCY_IDS.USD;
  const { rate } = useLatestRateToUsd(isUsd ? undefined : account.currencyId);

  const nativeAmount = formatMinor(account.balanceMinor, account.currency);
  const usdEquivalent =
    !isUsd && rate
      ? formatMinor(
          convertMinorToUsdCents(account.balanceMinor, account.currency.decimals, rate),
          { symbol: "$", decimals: 2 }
        )
      : null;

  return (
    <Pressable
      onPress={onPress}
      className="mb-1.5 flex-row items-center gap-2.5 rounded-xl bg-white/5 px-3 py-2"
    >
      <IconBadge icon={account.icon ?? "wallet-outline"} color={account.color ?? "#6b7280"} size={32} />
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-base font-semibold text-white">{account.name}</Text>
          {account.label && (
            <View className="rounded-full bg-white/10 px-2 py-0.5">
              <Text className="text-xs text-white/60">{account.label}</Text>
            </View>
          )}
        </View>
        <Text className="text-sm text-white/50">
          {hidden
            ? "••••••"
            : `${nativeAmount}${usdEquivalent ? `  ≈ ${usdEquivalent}` : ""}`}
        </Text>
      </View>
    </Pressable>
  );
}
