import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useRateHistory,
  useRateVariation,
  type RateHistoryDay,
  type RateVariation,
} from "@/db/queries/currencies";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { RateLineChart, type ChartSeries } from "@/components/rates/RateLineChart";

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

const RATE_CODES = ["USD", "EUR", "USDT"] as const;

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function dailyChangeFor(
  history: RateHistoryDay[],
  index: number,
  code: RateVariation["code"]
): number | null {
  const today = history[index].values[code];
  const prevDay = history.slice(index + 1).find((d) => d.values[code] !== undefined);
  const yesterday = prevDay?.values[code];
  if (today === undefined || yesterday === undefined) return null;
  return ((today - yesterday) / yesterday) * 100;
}

function CurrencyToggleChip({
  code,
  active,
  pinned,
  onPress,
}: {
  code: RateVariation["code"];
  active: boolean;
  pinned: boolean;
  onPress: () => void;
}) {
  const style = pinned
    ? { borderWidth: 1.5, borderColor: FEED_COLORS[code], backgroundColor: FEED_COLORS[code] }
    : active
      ? { borderWidth: 1.5, borderColor: FEED_COLORS[code] }
      : undefined;

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-2 rounded-full bg-white/5 px-4 py-2"
      style={style}
    >
      <Text className="text-base" style={{ color: pinned ? "#fff" : FEED_COLORS[code] }}>
        {FEED_ICONS[code]}
      </Text>
      <Text className="font-semibold text-white">{code}</Text>
    </Pressable>
  );
}

function HistoryTab() {
  const history = useRateHistory();
  // Newest-first from the hook; flip to chronological for month math + chart x-axis.
  const chronological = useMemo(() => [...history].reverse(), [history]);

  // Chips are single-select by default (`freeCode`); double-tapping a chip
  // "pins" it (`pinned`) so it stays selected while other chips are tapped —
  // that's how a second/third series gets added alongside it.
  const [pinned, setPinned] = useState<Set<RateVariation["code"]>>(() => new Set());
  const [freeCode, setFreeCode] = useState<RateVariation["code"] | null>("USDT");
  const lastChipTapRef = useRef<Partial<Record<RateVariation["code"], number>>>({});
  const [monthCursor, setMonthCursor] = useState<{ year: number; month: number } | null>(null);
  const [activeX, setActiveX] = useState<number | null>(null);

  const selected = useMemo(() => {
    const set = new Set(pinned);
    if (freeCode) set.add(freeCode);
    return set;
  }, [pinned, freeCode]);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    for (const day of chronological) {
      const d = new Date(day.dayStart);
      set.add(`${d.getFullYear()}-${d.getMonth()}`);
    }
    return Array.from(set)
      .map((key) => {
        const [year, month] = key.split("-").map(Number);
        return { year, month };
      })
      .sort((a, b) => a.year - b.year || a.month - b.month);
  }, [chronological]);

  const activeMonth = monthCursor ?? availableMonths[availableMonths.length - 1] ?? null;
  const activeMonthIndex = activeMonth
    ? availableMonths.findIndex((m) => m.year === activeMonth.year && m.month === activeMonth.month)
    : -1;

  const daysInMonth = useMemo(() => {
    if (!activeMonth) return [];
    return chronological.filter((day) => {
      const d = new Date(day.dayStart);
      return d.getFullYear() === activeMonth.year && d.getMonth() === activeMonth.month;
    });
  }, [chronological, activeMonth]);

  function handleChipSingleTap(code: RateVariation["code"]) {
    setActiveX(null);
    if (pinned.has(code)) return;
    setFreeCode(code);
  }

  function handleChipDoubleTap(code: RateVariation["code"]) {
    setActiveX(null);
    if (pinned.has(code)) {
      const nextPinned = new Set(pinned);
      nextPinned.delete(code);
      setPinned(nextPinned);
      if (nextPinned.size === 0 && freeCode === null) setFreeCode(code);
    } else {
      setPinned(new Set(pinned).add(code));
      if (freeCode === code) setFreeCode(null);
    }
  }

  function handleChipPress(code: RateVariation["code"]) {
    const now = Date.now();
    const last = lastChipTapRef.current[code] ?? 0;
    if (now - last < 300) {
      lastChipTapRef.current[code] = 0;
      handleChipDoubleTap(code);
    } else {
      lastChipTapRef.current[code] = now;
      handleChipSingleTap(code);
    }
  }

  function goToMonth(delta: number) {
    if (activeMonthIndex < 0) return;
    const nextIndex = activeMonthIndex + delta;
    if (nextIndex < 0 || nextIndex >= availableMonths.length) return;
    setActiveX(null);
    setMonthCursor(availableMonths[nextIndex]);
  }

  const chartSeries: ChartSeries[] = RATE_CODES.filter((code) => selected.has(code))
    .map((code) => ({
      code,
      color: FEED_COLORS[code],
      points: daysInMonth
        .filter((day) => day.values[code] !== undefined)
        .map((day) => ({ x: day.dayStart, y: day.values[code] as number })),
    }))
    .filter((s) => s.points.length > 0);

  const monthLabel = activeMonth
    ? capitalize(new Date(activeMonth.year, activeMonth.month, 1).toLocaleDateString("es-VE", { month: "long" }))
    : "—";

  return (
    <View className="mt-4 gap-2">
      <View className="flex-row justify-center gap-2">
        {RATE_CODES.map((code) => (
          <CurrencyToggleChip
            key={code}
            code={code}
            active={selected.has(code)}
            pinned={pinned.has(code)}
            onPress={() => handleChipPress(code)}
          />
        ))}
      </View>

      <View className="mt-4 flex-row items-center justify-between">
        <Pressable
          onPress={() => goToMonth(-1)}
          disabled={activeMonthIndex <= 0}
          className="h-8 w-8 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={20} color={activeMonthIndex <= 0 ? "#444" : "#fff"} />
        </Pressable>
        <Text className="text-base font-bold text-white">{monthLabel}</Text>
        <Pressable
          onPress={() => goToMonth(1)}
          disabled={activeMonthIndex < 0 || activeMonthIndex >= availableMonths.length - 1}
          className="h-8 w-8 items-center justify-center"
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={activeMonthIndex < 0 || activeMonthIndex >= availableMonths.length - 1 ? "#444" : "#fff"}
          />
        </Pressable>
      </View>

      {daysInMonth.length === 0 ? (
        <Text className="mt-10 text-center text-white/40">Todavía no hay historial de tasas.</Text>
      ) : (
        <>
          <View className="mt-2 gap-1">
            {chartSeries.map((s) => {
              const first = s.points[0].y;
              const last = s.points[s.points.length - 1].y;
              const change = ((last - first) / first) * 100;
              const isUp = change >= 0;
              return (
                <View key={s.code} className="flex-row items-baseline gap-2">
                  <Text className="text-2xl font-bold text-white">Bs {formatBs(last)}</Text>
                  {chartSeries.length > 1 && (
                    <View className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                  )}
                  <Text style={{ color: isUp ? "#a3e635" : "#f87171" }} className="font-semibold">
                    {isUp ? "+" : ""}
                    {change.toFixed(2)}% en {monthLabel.toLowerCase()}
                  </Text>
                </View>
              );
            })}
          </View>

          <View className="mt-3">
            <RateLineChart series={chartSeries} activeX={activeX} onScrub={setActiveX} />
          </View>

          <View className="mb-2 mt-1 flex-row justify-between">
            <Text className="text-xs text-white/40">
              {new Date(daysInMonth[0].dayStart).toLocaleDateString("es-VE", {
                day: "numeric",
                month: "short",
              })}
            </Text>
            <Text className="text-xs text-white/40">
              {new Date(daysInMonth[daysInMonth.length - 1].dayStart).toLocaleDateString("es-VE", {
                day: "numeric",
                month: "short",
              })}
            </Text>
          </View>

          <View className="mt-3">
            {[...daysInMonth].reverse().map((day) => {
              const dayIndexDesc = history.findIndex((d) => d.dayStart === day.dayStart);
              const isActive = day.dayStart === activeX;
              const singleCode = selected.size === 1 ? RATE_CODES.find((c) => selected.has(c)) : null;

              return (
                <Pressable
                  key={day.dayStart}
                  onPress={() => setActiveX(isActive ? null : day.dayStart)}
                  className="flex-row items-center justify-between border-b border-white/5 px-2 py-2.5"
                  style={isActive ? { backgroundColor: "rgba(255,255,255,0.06)" } : undefined}
                >
                  <Text className="text-sm text-white/70">
                    {capitalize(
                      new Date(day.dayStart).toLocaleDateString("es-VE", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })
                    )}
                  </Text>

                  {singleCode ? (
                    (() => {
                      const change = dailyChangeFor(history, dayIndexDesc, singleCode);
                      const isUp = change !== null && change >= 0;
                      const color = isUp ? "#a3e635" : "#f87171";
                      return (
                        <View className="flex-row items-center gap-2">
                          <Text className="font-bold text-white">
                            {formatBs(day.values[singleCode] ?? null)}
                          </Text>
                          {change !== null && (
                            <View className="flex-row items-center gap-0.5">
                              <Ionicons name={isUp ? "trending-up" : "trending-down"} size={12} color={color} />
                              <Text className="text-xs font-semibold" style={{ color }}>
                                {isUp ? "+" : ""}
                                {change.toFixed(2)}%
                              </Text>
                            </View>
                          )}
                        </View>
                      );
                    })()
                  ) : (
                    <View className="flex-row gap-4">
                      {RATE_CODES.filter((code) => selected.has(code)).map((code) => {
                        const change = dailyChangeFor(history, dayIndexDesc, code);
                        return (
                          <View key={code} className="items-end">
                            <Text className="font-bold text-white">
                              {formatBs(day.values[code] ?? null)}
                            </Text>
                            {change !== null && (
                              <Text
                                className="text-xs"
                                style={{ color: change >= 0 ? "#a3e635" : "#f87171" }}
                              >
                                {change >= 0 ? "+" : ""}
                                {change.toFixed(2)}%
                              </Text>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </>
      )}
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
