import { Card } from '@/components/ui/Card'
import { useAccounts } from '@/db/queries/accounts'
import {
  pickLatestUsdRate,
  refreshExchangeRates,
  useCurrencies,
  useExchangeRates,
} from '@/db/queries/currencies'
import { convertMinorToUsdCents, formatMinor } from '@/lib/money'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const HIDDEN_BALANCE = '••••••'

function getCurrencyLabel(
  currency: { code: string; name: string } | undefined,
  currencyId: string,
) {
  if (!currency) return currencyId
  if (currency.code === 'VES') return 'Bolivares'
  if (currency.code === 'USD') return 'Dolares'
  return currency.name
}

export default function HomeScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [balancesVisible, setBalancesVisible] = useState(true)
  const [refreshingRates, setRefreshingRates] = useState(false)
  const { data: accounts } = useAccounts()
  const { data: currencies } = useCurrencies()
  const { data: rates } = useExchangeRates()

  const totalsByCurrency = new Map<string, number>()
  for (const account of accounts) {
    totalsByCurrency.set(
      account.currencyId,
      (totalsByCurrency.get(account.currencyId) ?? 0) + account.balanceMinor,
    )
  }

  let unifiedUsdCents = 0
  const currencyCards = Array.from(totalsByCurrency.entries())
    .map(([currencyId, amountMinor]) => {
      const currency = currencies.find((c) => c.id === currencyId)
      const rate = pickLatestUsdRate(rates, currencyId)
      const usdEquivalent =
        currency && rate
          ? convertMinorToUsdCents(amountMinor, currency.decimals, rate)
          : null
      if (usdEquivalent !== null) unifiedUsdCents += usdEquivalent
      return { currencyId, amountMinor, currency, usdEquivalent }
    })
    .sort((a, b) => (a.currency?.sortOrder ?? 0) - (b.currency?.sortOrder ?? 0))

  async function handleRefreshRates() {
    setRefreshingRates(true)
    try {
      await refreshExchangeRates()
    } finally {
      setRefreshingRates(false)
    }
  }

  return (
    <View className="flex-1 bg-black">
      <LinearGradient
        colors={['rgba(163,230,53,0.35)', 'rgba(0,0,0,0)']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 420 }}
      />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 16,
          paddingBottom: 40,
        }}
      >
        <Card className="p-4">
          <View className="mb-1 flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-sm text-white/60">Mi Balance</Text>
              <Pressable
                onPress={() => setBalancesVisible((visible) => !visible)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={
                  balancesVisible ? 'Ocultar balances' : 'Mostrar balances'
                }
              >
                <Ionicons
                  name={balancesVisible ? 'eye-outline' : 'eye-off-outline'}
                  size={16}
                  color="rgba(255,255,255,0.6)"
                />
              </Pressable>
            </View>
            <Pressable
              onPress={handleRefreshRates}
              disabled={refreshingRates}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Actualizar tasas"
            >
              {refreshingRates ? (
                <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />
              ) : (
                <Ionicons name="refresh-outline" size={16} color="rgba(255,255,255,0.6)" />
              )}
            </Pressable>
          </View>
          <Text className="text-4xl font-bold text-white">
            {balancesVisible
              ? formatMinor(unifiedUsdCents, { symbol: '$', decimals: 2 })
              : HIDDEN_BALANCE}
          </Text>
        </Card>

        <View className="mt-4 flex-row flex-wrap gap-3">
          {currencyCards.map(
            ({ currencyId, amountMinor, currency, usdEquivalent }) => (
              <Card key={currencyId} className="min-w-[45%] flex-1 p-3">
                <Text className="text-lg font-bold text-lime-400">
                  {getCurrencyLabel(currency, currencyId)}
                </Text>
                <Text className="text-lg font-bold text-white">
                  {balancesVisible
                    ? currency
                      ? formatMinor(amountMinor, currency)
                      : amountMinor
                    : HIDDEN_BALANCE}
                </Text>
                {currency?.code !== 'USD' && (
                  <Text className="text-white/40">
                    {balancesVisible
                      ? usdEquivalent !== null
                        ? `≈ ${formatMinor(usdEquivalent, { symbol: '$', decimals: 2 })}`
                        : 'sin tasa'
                      : HIDDEN_BALANCE}
                  </Text>
                )}
              </Card>
            ),
          )}
          {currencyCards.length === 0 && (
            <Text className="text-white/40">Todavía no tienes cuentas.</Text>
          )}
        </View>

        <View className="mt-6 flex-row gap-3">
          <Pressable
            onPress={() => router.push('/accounts')}
            className="flex-1 items-center rounded-full bg-lime-400 py-4"
          >
            <Text className="font-bold text-black">Ver cuentas</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/categories')}
            className="flex-1 items-center rounded-full bg-white/10 py-4"
          >
            <Text className="font-bold text-white">Categorías</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.push('/rates')}
          className="mt-3 items-center rounded-full bg-white/10 py-4"
        >
          <Text className="font-bold text-white">Tasas de cambio</Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}
