// Real "street" VES/USD rate, derived from Binance P2P USDT sell ads.
//
// Sampling: average of the 5 highest sell prices. This endpoint's response
// was checked against 20 live ads and never carried a "promoted" marker
// (advSystemLabelRet/privilegeType were null throughout) — the "Promoted Ad"
// pins shown on Binance's own P2P web page appear to come from a separate ad
// placement mechanism, not this search endpoint, so no extra filtering was
// needed for the ads actually returned here. Still checking those two fields
// defensively in case Binance starts populating them.
//
// The endpoint already returns ads best-price-first for a SELL query (highest
// buy offers first), so the top 5 are simply the first 5 non-excluded items.

const BINANCE_P2P_URL = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search";
const SAMPLE_SIZE = 5;

type BinanceAd = {
  adv: {
    price: string;
    advSystemLabelRet: unknown;
    privilegeType: unknown;
  };
};

function isPromoted(ad: BinanceAd): boolean {
  return Boolean(ad.adv.advSystemLabelRet) || Boolean(ad.adv.privilegeType);
}

export async function fetchBinanceUsdtVesRate(): Promise<number> {
  const response = await fetch(BINANCE_P2P_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      asset: "USDT",
      fiat: "VES",
      tradeType: "SELL",
      page: 1,
      rows: 20,
      payTypes: [],
      publisherType: null,
    }),
  });
  if (!response.ok) throw new Error(`Binance P2P fetch failed: HTTP ${response.status}`);

  const json: { data: BinanceAd[] } = await response.json();
  const prices = json.data
    .filter((ad) => !isPromoted(ad))
    .map((ad) => Number(ad.adv.price))
    .filter((price) => Number.isFinite(price))
    .sort((a, b) => b - a)
    .slice(0, SAMPLE_SIZE);

  if (prices.length === 0) throw new Error("Binance P2P returned no usable ads");

  const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  return Math.round(average * 100) / 100;
}
