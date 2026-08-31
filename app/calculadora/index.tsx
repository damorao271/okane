import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getVesMajorPerUnit,
  getVesRateEffectiveAt,
  useCurrencies,
  useExchangeRates,
} from "@/db/queries/currencies";
import { DEFAULT_CURRENCY_IDS } from "@/db/seed";
import { formatMinor, toMinorUnits } from "@/lib/money";
import {
  CurrencyDropdown,
  useCurrencyAnchor,
  type PickableCurrency,
} from "@/components/calculator/CurrencyDropdown";
import { NumericKeypad } from "@/components/calculator/NumericKeypad";
import { AmountText } from "@/components/calculator/AmountText";
import { CustomRateSheet } from "@/components/calculator/CustomRateSheet";

type Sign = "+" | "-";
type Term = { sign: Sign; text: string };
type CalcCurrency = PickableCurrency & { decimals: number };

const CUSTOM_CURRENCY_ID = "custom";
const CUSTOM_CURRENCY: CalcCurrency = {
  id: CUSTOM_CURRENCY_ID,
  code: "Personalizada",
  name: "Personalizada",
  symbol: "",
  decimals: 2,
};

function minorToEditableString(minor: number, decimals: number): string {
  const major = minor / 10 ** decimals;
  return major.toFixed(decimals).replace(".", ",");
}

function signedMinor(sign: Sign, minor: number): number {
  return sign === "-" ? -minor : minor;
}

export default function CalculadoraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: currencies } = useCurrencies();
  const { data: rates } = useExchangeRates();

  const [fromId, setFromId] = useState<string>(DEFAULT_CURRENCY_IDS.USD);
  const [toId, setToId] = useState<string>(DEFAULT_CURRENCY_IDS.VES);
  const [display, setDisplay] = useState("1");
  const [history, setHistory] = useState<Term[]>([]);
  const [currentSign, setCurrentSign] = useState<Sign>("+");
  const [copied, setCopied] = useState(false);
  // After a swap or a confirmed total, the display shows a "final" value —
  // the next digit typed should start a brand-new amount, not append to it.
  const [freshEntry, setFreshEntry] = useState(false);

  const fromAnchor = useCurrencyAnchor();
  const toAnchor = useCurrencyAnchor();
  const [openPicker, setOpenPicker] = useState<"from" | "to" | null>(null);

  const [customRateBsPerUnit, setCustomRateBsPerUnit] = useState<number | null>(null);
  const [customRateSheetOpen, setCustomRateSheetOpen] = useState(false);

  const fromCurrency: CalcCurrency | undefined =
    fromId === CUSTOM_CURRENCY_ID ? CUSTOM_CURRENCY : currencies.find((c) => c.id === fromId);
  const toCurrency = currencies.find((c) => c.id === toId);
  const decimals = fromCurrency?.decimals ?? 2;

  /** Bs (VES major units) equivalent to 1 major unit of `currencyId` — same pivot the shared
   * currency utils use, except the "Personalizada" pseudo-currency resolves to a manually
   * entered rate instead of a database lookup. */
  function vesPerUnitFor(currencyId: string): number | null {
    if (currencyId === CUSTOM_CURRENCY_ID) return customRateBsPerUnit;
    return getVesMajorPerUnit(rates, currencyId);
  }

  function convertAmount(from: CalcCurrency, to: CalcCurrency, amountMinor: number): number | null {
    if (from.id === to.id) return amountMinor;
    const fromVesPerUnit = vesPerUnitFor(from.id);
    const toVesPerUnit = vesPerUnitFor(to.id);
    if (fromVesPerUnit === null || toVesPerUnit === null) return null;
    const amountMajor = amountMinor / 10 ** from.decimals;
    const vesMajor = amountMajor * fromVesPerUnit;
    const toMajor = vesMajor / toVesPerUnit;
    return Math.round(toMajor * 10 ** to.decimals);
  }

  const currentMinor = toMinorUnits(display, decimals);
  const totalMinor =
    history.reduce((sum, term) => sum + signedMinor(term.sign, toMinorUnits(term.text, decimals)), 0) +
    signedMinor(currentSign, currentMinor);

  const expressionLabel =
    history.length > 0
      ? history
          .map((term, i) => (i === 0 && term.sign === "+" ? term.text : `${term.sign}${term.text}`))
          .join("") + `${currentSign}${display}`
      : null;

  const resultMinor =
    fromCurrency && toCurrency ? convertAmount(fromCurrency, toCurrency, totalMinor) : null;

  const unitResultMinor =
    fromCurrency && toCurrency
      ? convertAmount(fromCurrency, toCurrency, 10 ** fromCurrency.decimals)
      : null;

  const rateEffectiveAt = fromCurrency && toCurrency
    ? Math.max(
        getVesRateEffectiveAt(rates, fromCurrency.id) ?? 0,
        getVesRateEffectiveAt(rates, toCurrency.id) ?? 0
      ) || null
    : null;

  function appendDigit(digit: string) {
    if (freshEntry) {
      setFreshEntry(false);
      setDisplay(digit);
      return;
    }
    setDisplay((prev) => {
      if (prev.includes(",")) {
        const frac = prev.split(",")[1];
        if (frac.length >= decimals) return prev;
      }
      if (prev === "0") return digit;
      return prev + digit;
    });
  }

  function pressComma() {
    if (freshEntry) {
      setFreshEntry(false);
      setDisplay(decimals === 0 ? "0" : "0,");
      return;
    }
    setDisplay((prev) => (decimals === 0 || prev.includes(",") ? prev : `${prev},`));
  }

  function backspace() {
    setFreshEntry(false);
    setDisplay((prev) => (prev.length <= 1 ? "0" : prev.slice(0, -1)));
  }

  function clear() {
    setDisplay("0");
    setHistory([]);
    setCurrentSign("+");
    setFreshEntry(false);
  }

  function applyOperator(op: Sign) {
    setFreshEntry(false);
    setHistory((prev) => [...prev, { sign: currentSign, text: display }]);
    setCurrentSign(op);
    setDisplay("0");
  }

  function confirm() {
    if (history.length === 0) return;
    const finalHistory = [...history, { sign: currentSign, text: display }];
    const total = finalHistory.reduce(
      (sum, term) => sum + signedMinor(term.sign, toMinorUnits(term.text, decimals)),
      0
    );
    setDisplay(minorToEditableString(total, decimals));
    setHistory([]);
    setCurrentSign("+");
    setFreshEntry(true);
  }

  function handleSwap() {
    if (!toCurrency || fromId === CUSTOM_CURRENCY_ID) return;
    const newDisplayMinor = resultMinor ?? 0;
    setFromId(toId);
    setToId(fromId);
    setDisplay(minorToEditableString(newDisplayMinor, toCurrency.decimals));
    setHistory([]);
    setCurrentSign("+");
    setFreshEntry(true);
  }

  function handleSelectCurrency(currency: PickableCurrency) {
    if (openPicker === "from") {
      if (currency.id === toId) setToId(fromId);
      setFromId(currency.id);
    } else if (openPicker === "to") {
      if (currency.id === fromId) setFromId(toId);
      setToId(currency.id);
    }
    setOpenPicker(null);
  }

  function handleSelectCustom() {
    if (fromCurrency && fromCurrency.id !== CUSTOM_CURRENCY_ID) {
      const vesPerUnit = getVesMajorPerUnit(rates, fromCurrency.id);
      if (vesPerUnit !== null) setCustomRateBsPerUnit(vesPerUnit);
    }
    setFromId(CUSTOM_CURRENCY_ID);
  }

  function openFromPicker() {
    fromAnchor.measure(() => setOpenPicker("from"));
  }

  function openToPicker() {
    toAnchor.measure(() => setOpenPicker("to"));
  }

  async function handleCopy() {
    if (resultMinor === null || !toCurrency) return;
    await Clipboard.setStringAsync(formatMinor(resultMinor, toCurrency).trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  const isCustomFrom = fromId === CUSTOM_CURRENCY_ID;
  const fromAmountMajor = totalMinor / 10 ** decimals;
  const fromSymbol = fromCurrency?.symbol ?? "";
  const formatFromAmount = (n: number) => {
    const digits = n.toFixed(decimals).replace(".", ",");
    return fromSymbol ? `${fromSymbol} ${digits}` : digits;
  };

  const toDecimals = toCurrency?.decimals ?? 2;
  const toAmountMajor = resultMinor !== null ? resultMinor / 10 ** toDecimals : 0;
  const formatToAmount = (n: number) =>
    resultMinor !== null && toCurrency
      ? `${toCurrency.symbol} ${n.toFixed(toDecimals).replace(".", ",")}`
      : "Sin tasa";

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-4 py-2">
        <Pressable
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full bg-white/10"
        >
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </Pressable>
        <Text className="text-lg font-bold text-white">Calculadora</Text>
        <Pressable
          onPress={() => router.push("/rates")}
          className="h-9 w-9 items-center justify-center rounded-full bg-white/10"
        >
          <Ionicons name="trending-up" size={18} color="#fff" />
        </Pressable>
      </View>

      <View className="px-4 pt-2">
        <View className="flex-row items-center gap-2">
          <Pressable
            ref={fromAnchor.ref}
            onPress={openFromPicker}
            className="flex-row items-center gap-1.5 self-start rounded-full bg-white/10 px-4 py-2"
          >
            {isCustomFrom && <Ionicons name="star" size={14} color="#eab308" />}
            <Text className="text-base font-bold text-white">
              {isCustomFrom
                ? "Personalizada"
                : fromCurrency
                  ? `${fromCurrency.symbol} ${fromCurrency.code}`
                  : "—"}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#fff" />
          </Pressable>
          {isCustomFrom && (
            <Pressable
              onPress={() => setCustomRateSheetOpen(true)}
              className="h-9 w-9 items-center justify-center rounded-full bg-white/10"
            >
              <Ionicons name="settings-outline" size={16} color="#fff" />
            </Pressable>
          )}
        </View>

        {expressionLabel && (
          <Text className="mt-2 text-sm text-white/40">
            {fromSymbol ? `${fromSymbol} ${expressionLabel}` : expressionLabel}
          </Text>
        )}
        <AmountText
          value={fromAmountMajor}
          formatter={formatFromAmount}
          style={{ marginTop: 8, fontSize: 48, fontWeight: "700", color: "rgba(255,255,255,0.65)" }}
        />

        <View className="my-5 flex-row items-center">
          <View className="h-px flex-1 bg-white/10" />
          <Pressable
            onPress={handleSwap}
            className="mx-4 h-12 w-12 items-center justify-center rounded-full bg-lime-400"
          >
            <Ionicons name="swap-vertical" size={22} color="#000" />
          </Pressable>
          <View className="h-px flex-1 bg-white/10" />
        </View>

        <Pressable
          ref={toAnchor.ref}
          onPress={openToPicker}
          className="flex-row items-center gap-1.5 self-start rounded-full bg-white/10 px-4 py-2"
        >
          <Text className="text-base font-bold text-white">
            {toCurrency ? `${toCurrency.symbol} ${toCurrency.code}` : "—"}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#fff" />
        </Pressable>
        <View className="mt-2 flex-row items-start justify-between">
          <AmountText
            value={toAmountMajor}
            formatter={formatToAmount}
            style={{ flex: 1, fontSize: 48, fontWeight: "700", color: "rgba(255,255,255,0.65)" }}
          />
          <Pressable
            onPress={handleCopy}
            disabled={resultMinor === null}
            className="ml-2 h-9 w-9 items-center justify-center rounded-full bg-white/10"
          >
            <Ionicons name={copied ? "checkmark" : "copy-outline"} size={16} color="#fff" />
          </Pressable>
        </View>

        {resultMinor !== null && unitResultMinor !== null && fromCurrency && toCurrency && (
          <View className="mt-3 items-center">
            <Text className="text-white">
              {isCustomFrom ? "1" : fromCurrency.symbol + "1"} = {formatMinor(unitResultMinor, toCurrency)}
            </Text>
            {isCustomFrom ? (
              <Text className="mt-1 text-xs text-white/40">Tasa definida por ti</Text>
            ) : (
              rateEffectiveAt && (
                <Text className="mt-1 text-xs text-white/40">
                  Actualizado{" "}
                  {new Date(rateEffectiveAt).toLocaleDateString("es-VE", {
                    day: "numeric",
                    month: "short",
                  })}{" "}
                  a las{" "}
                  {new Date(rateEffectiveAt).toLocaleTimeString("es-VE", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </Text>
              )
            )}
          </View>
        )}
      </View>

      <View className="flex-1" />

      <View className="px-4" style={{ paddingBottom: insets.bottom + 12 }}>
        <NumericKeypad
          onDigit={appendDigit}
          onComma={pressComma}
          onBackspace={backspace}
          onClear={clear}
          onOperator={applyOperator}
          onConfirm={confirm}
        />
      </View>

      <CurrencyDropdown
        visible={openPicker === "from"}
        position={fromAnchor.position}
        currencies={currencies.filter((c) => c.id !== toId)}
        selectedId={fromId}
        onSelect={handleSelectCurrency}
        onSelectCustom={handleSelectCustom}
        onClose={() => setOpenPicker(null)}
      />
      <CurrencyDropdown
        visible={openPicker === "to"}
        position={toAnchor.position}
        currencies={currencies.filter((c) => c.id !== fromId)}
        selectedId={toId}
        onSelect={handleSelectCurrency}
        onClose={() => setOpenPicker(null)}
      />

      <CustomRateSheet
        visible={customRateSheetOpen}
        initialValue={customRateBsPerUnit}
        onConfirm={(value) => {
          setCustomRateBsPerUnit(value);
          setCustomRateSheetOpen(false);
        }}
        onClose={() => setCustomRateSheetOpen(false)}
      />
    </View>
  );
}
