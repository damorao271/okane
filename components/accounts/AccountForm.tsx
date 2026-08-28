import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useCurrencies } from "@/db/queries/currencies";
import { DEFAULT_CURRENCY_IDS } from "@/db/seed";
import { extractDomain, faviconUrlForDomain } from "@/lib/favicon";
import {
  INTERNATIONAL_INSTITUTIONS,
  NATIONAL_INSTITUTIONS,
  type Institution,
} from "@/lib/institutionCatalog";
import { toMinorUnits } from "@/lib/money";
import { AddCustomInstitutionSheet } from "@/components/accounts/AddCustomInstitutionSheet";
import { InstitutionPickerSheet } from "@/components/accounts/InstitutionPickerSheet";
import { ColorSwatchPicker } from "@/components/ui/ColorSwatchPicker";
import { IconBadge } from "@/components/ui/IconBadge";
import { IconPicker } from "@/components/ui/IconPicker";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import type { AccountType } from "@/db/schema";

export type AccountFormValues = {
  name: string;
  label: string;
  type: AccountType;
  currencyId: string;
  icon: string;
  color: string;
  openingBalance: string;
};

type AccountFormProps = {
  mode: "create" | "edit";
  initialValues?: Partial<AccountFormValues>;
  onSubmit: (values: AccountFormValues) => void;
  submitting?: boolean;
};

const DEFAULT_ICON = "wallet-outline";
const DEFAULT_COLOR = "#22c55e";
const NEUTRAL_COLOR = "#6b7280";

export function AccountForm({ mode, initialValues, onSubmit, submitting }: AccountFormProps) {
  const { data: currencies } = useCurrencies();
  // EUR is informational-only (BCV rate display) — no accounts can be created in it.
  const foreignCurrencies = currencies.filter(
    (c) => c.id !== DEFAULT_CURRENCY_IDS.VES && c.id !== DEFAULT_CURRENCY_IDS.EUR
  );

  const [currencyMode, setCurrencyMode] = useState<"nacional" | "internacional">(
    initialValues?.currencyId && initialValues.currencyId !== DEFAULT_CURRENCY_IDS.VES
      ? "internacional"
      : "nacional"
  );
  const [currencyId, setCurrencyId] = useState(
    initialValues?.currencyId ?? DEFAULT_CURRENCY_IDS.VES
  );
  const [type, setType] = useState<AccountType>(initialValues?.type ?? "cash");
  const [name, setName] = useState(initialValues?.name ?? "");
  const [label, setLabel] = useState(initialValues?.label ?? "");
  const [color, setColor] = useState(initialValues?.color ?? DEFAULT_COLOR);
  const [icon, setIcon] = useState(initialValues?.icon ?? DEFAULT_ICON);
  const [openingBalance, setOpeningBalance] = useState(initialValues?.openingBalance ?? "");
  const [pickerVisible, setPickerVisible] = useState(false);
  const [customSheetVisible, setCustomSheetVisible] = useState(false);

  const selectedCurrency = currencies.find((c) => c.id === currencyId);
  const canSubmit = name.trim().length > 0 && !!currencyId;
  const institutions = currencyMode === "nacional" ? NATIONAL_INSTITUTIONS : INTERNATIONAL_INSTITUTIONS;

  function handleSelectInstitution(institution: Institution) {
    setType(institution.type);
    setColor(institution.color);
    setIcon(institution.domain ? faviconUrlForDomain(institution.domain) : institution.icon!);
    setName(institution.name);
    setPickerVisible(false);
  }

  function handleApplyCustomInstitution({ name: customName, logoUrl }: { name: string; logoUrl: string }) {
    const domain = extractDomain(logoUrl);
    setType("other");
    setColor(NEUTRAL_COLOR);
    if (domain) setIcon(faviconUrlForDomain(domain));
    setName(customName);
    setCustomSheetVisible(false);
  }

  function handleCurrencyModeChange(next: string) {
    const nextMode = next as "nacional" | "internacional";
    setCurrencyMode(nextMode);
    if (nextMode === "nacional") {
      setCurrencyId(DEFAULT_CURRENCY_IDS.VES);
    } else {
      setCurrencyId(foreignCurrencies[0]?.id ?? DEFAULT_CURRENCY_IDS.USD);
    }
  }

  return (
    <ScrollView className="flex-1 px-5" contentContainerClassName="gap-5 pb-16">
      {mode === "create" && (
        <SegmentedControl
          value={currencyMode}
          onChange={handleCurrencyModeChange}
          options={[
            { label: "Nacional", value: "nacional" },
            { label: "Internacional", value: "internacional" },
          ]}
        />
      )}

      {mode === "create" && currencyMode === "internacional" && (
        <SegmentedControl
          variant="chips"
          value={currencyId}
          onChange={setCurrencyId}
          options={foreignCurrencies.map((c) => ({ label: `${c.symbol} ${c.name}`, value: c.id }))}
        />
      )}

      {mode === "edit" && selectedCurrency && (
        <Text className="text-white/50">
          Moneda: {selectedCurrency.symbol} {selectedCurrency.name} (no editable)
        </Text>
      )}

      <Pressable
        onPress={() => setPickerVisible(true)}
        className="flex-row items-center gap-3 rounded-2xl bg-white/5 px-3 py-2.5"
      >
        <IconBadge icon={icon} color={color} size={36} />
        <Text className={`flex-1 ${name ? "text-white" : "text-white/40"}`}>
          {name || "Selecciona una cuenta"}
        </Text>
        <Ionicons name="chevron-down" size={18} color="rgba(255,255,255,0.6)" />
      </Pressable>

      <InstitutionPickerSheet
        visible={pickerVisible}
        institutions={institutions}
        otroSubtitle={`Agregar cuenta ${currencyMode === "nacional" ? "nacional" : "internacional"} con logo`}
        onSelect={handleSelectInstitution}
        onSelectOtro={() => {
          setPickerVisible(false);
          setCustomSheetVisible(true);
        }}
        onClose={() => setPickerVisible(false)}
      />

      <AddCustomInstitutionSheet
        visible={customSheetVisible}
        title={`Otra cuenta ${currencyMode === "nacional" ? "nacional" : "internacional"}`}
        onApply={handleApplyCustomInstitution}
        onCancel={() => setCustomSheetVisible(false)}
      />

      <View className="flex-row items-center gap-3 rounded-2xl bg-white/5 px-3 py-2.5">
        <View className="h-9 w-9 items-center justify-center">
          <Ionicons name="pricetag-outline" size={18} color="rgba(255,255,255,0.5)" />
        </View>
        <TextInput
          value={label}
          onChangeText={setLabel}
          placeholder="Etiqueta (opcional, ej: familiar)"
          placeholderTextColor="#ffffff66"
          className="flex-1 text-white"
        />
      </View>

      {mode === "create" && selectedCurrency && (
        <View className="flex-row items-center gap-3 rounded-2xl bg-white/5 px-3 py-2.5">
          <View className="h-9 w-9 items-center justify-center">
            <Text className="text-base font-semibold text-white/50">{selectedCurrency.symbol}</Text>
          </View>
          <TextInput
            value={openingBalance}
            onChangeText={setOpeningBalance}
            placeholder={`Saldo inicial en ${selectedCurrency.name.toLowerCase()} (opcional)`}
            placeholderTextColor="#ffffff66"
            keyboardType="decimal-pad"
            className="flex-1 text-white"
          />
        </View>
      )}

      <ColorSwatchPicker value={color} onChange={setColor} />
      <IconPicker value={icon} onChange={setIcon} color={color} />

      <Pressable
        disabled={!canSubmit || submitting}
        onPress={() =>
          onSubmit({
            name: name.trim(),
            label: label.trim(),
            type,
            currencyId,
            icon,
            color,
            openingBalance,
          })
        }
        className={`items-center rounded-full py-4 ${
          canSubmit ? "bg-lime-400" : "bg-white/10"
        }`}
      >
        <Text className={`font-bold ${canSubmit ? "text-black" : "text-white/40"}`}>Guardar</Text>
      </Pressable>
    </ScrollView>
  );
}

export function openingBalanceToMinor(rawValue: string, decimals: number): number {
  if (!rawValue.trim()) return 0;
  return toMinorUnits(rawValue, decimals);
}
