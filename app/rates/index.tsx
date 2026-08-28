import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRateHistory, useRateVariation, type RateVariation } from "@/db/queries/currencies";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

const FEED_COLORS: Record<RateVariation["code"], string> = {
  USD: "#dc2626",
  EUR: "#2563eb",
  USDT: "#26a17b",
};

const FEED_ICONS: Record<RateVariation["code"], string> = {
  USD: "$",
  EUR: "€",
  USDT: "₮",
};

function formatBs(value: number | null): string {
  if (value === null) return "—";
  return value.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function FeedIcon({ code }: { code: RateVariation["code"] }) {
  return (
    <View
      className="h-11 w-11 items-center justify-center rounded-full"
      style={{ backgroundColor: `${FEED_COLORS[code]}33` }}
    >
      <Text className="text-lg font-bold" style={{ color: FEED_COLORS[code] }}>
        {FEED_ICONS[code]}
      </Text>
    </View>
  );
}

function PercentChange({ value }: { value: number | null }) {
  if (value === null) {
    return <Text className="text-white/40">—</Text>;
  }
  const isUp = value >= 0;
  const color = isUp ? "#a3e635" : "#f87171";
  return (
    <View className="flex-row items-center gap-1">
      <Ionicons name={isUp ? "trending-up" : "trending-down"} size={14} color={color} />
      <Text className="font-bold" style={{ color }}>
        {isUp ? "+" : ""}
        {value.toFixed(2)}%
      </Text>
    </View>
  );
}

function variationSubtitle(variation: RateVariation): string {
  if (variation.today === null) return "Sin datos";
  if (variation.yesterday === null) return `Hoy ${formatBs(variation.today)}`;
  return `Ayer ${formatBs(variation.yesterday)}  →  Hoy ${formatBs(variation.today)}`;
}

type ComparisonRow = { code: RateVariation["code"]; label: string; value: number | null };

function ComparisonSection({
  title,
  left,
  right,
}: {
  title: string;
  left: ComparisonRow;
  right: ComparisonRow;
}) {
  const diffPercent =
    left.value && right.value ? ((right.value - left.value) / left.value) * 100 : null;

  return (
    <>
      <Text className="mb-2 mt-5 text-xs font-semibold uppercase text-white/40">{title}</Text>
      <View className="gap-3 rounded-2xl bg-white/5 px-4 py-3">
        {[left, right].map((row) => (
          <View key={row.code} className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <FeedIcon code={row.code} />
              <Text className="text-white">{row.label}</Text>
            </View>
            <Text className="text-lg font-bold text-white">{formatBs(row.value)}</Text>
          </View>
        ))}
        <View className="h-px bg-white/10" />
        <View className="flex-row items-center justify-between">
          <Text className="font-bold text-white">Diferencia</Text>
          <PercentChange value={diffPercent} />
        </View>
      </View>
    </>
  );
}

function TodayTab() {
  const variations = useRateVariation();
  const usd = variations.find((v) => v.code === "USD");
  const eur = variations.find((v) => v.code === "EUR");
  const usdt = variations.find((v) => v.code === "USDT");

  return (
    <>
      <Text className="mb-2 mt-4 text-xs font-semibold uppercase text-white/40">
        Variación del día
      </Text>
      <View className="gap-3">
        {variations.map((variation) => (
          <View
            key={variation.code}
            className="flex-row items-center gap-3 rounded-2xl bg-white/5 px-3 py-3"
          >
            <FeedIcon code={variation.code} />
            <View className="flex-1">
              <Text className="text-base font-bold text-white">{variation.label}</Text>
              <Text className="text-sm text-white/50">{variationSubtitle(variation)}</Text>
            </View>
            <PercentChange value={variation.percentChange} />
          </View>
        ))}
      </View>

      <View className="my-2 h-px bg-white/10" />

      <ComparisonSection
        title="BCV vs USDT"
        left={{ code: "USD", label: "BCV (USD)", value: usd?.today ?? null }}
        right={{ code: "USDT", label: "USDT", value: usdt?.today ?? null }}
      />

      <ComparisonSection
        title="BCV vs EUR"
        left={{ code: "USD", label: "BCV (USD)", value: usd?.today ?? null }}
        right={{ code: "EUR", label: "BCV (EUR)", value: eur?.today ?? null }}
      />
    </>
  );
}

function HistoryTab() {
  const history = useRateHistory();

  return (
    <View className="mt-4 gap-2">
      {history.length === 0 && (
        <Text className="mt-10 text-center text-white/40">Todavía no hay historial de tasas.</Text>
      )}
      {history.map((day) => (
        <View key={day.dayStart} className="rounded-2xl bg-white/5 px-4 py-3">
          <Text className="mb-2 text-sm font-semibold text-white/50">
            {new Date(day.dayStart).toLocaleDateString("es-VE", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </Text>
          <View className="flex-row justify-between">
            {(["USD", "EUR", "USDT"] as const).map((code) => (
              <View key={code} className="items-center">
                <Text className="text-xs text-white/40">{code}</Text>
                <Text className="font-bold text-white">{formatBs(day.values[code] ?? null)}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

export default function RatesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"today" | "history">("today");

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-4 py-2">
        <Pressable
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full bg-white/10"
        >
          <Ionicons name="close" size={20} color="#fff" />
        </Pressable>
        <Text className="text-lg font-bold text-white">Tasas de cambio</Text>
        <View className="h-9 w-9" />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        <View className="items-center">
          <SegmentedControl
            value={tab}
            onChange={(v) => setTab(v as "today" | "history")}
            options={[
              { label: "Hoy", value: "today" },
              { label: "Histórico", value: "history" },
            ]}
          />
        </View>

        {tab === "today" ? <TodayTab /> : <HistoryTab />}
      </ScrollView>
    </View>
  );
}
