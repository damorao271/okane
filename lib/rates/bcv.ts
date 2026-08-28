// Scrapes the official USD/EUR rates published on bcv.org.ve.
//
// The page has a fixed, simple structure — a div per currency with the rate
// inside a <strong class="strong-tb"> tag, comma-decimal, with extra noise
// decimals we don't need (e.g. "772,54410000"). A full HTML parser is
// unnecessary for something this stable; a scoped regex per div id is enough.
//
// Android needs a bundled cert fix (see plugins/withBcvCertFix.js) for this
// fetch to succeed at all — bcv.org.ve's server sends the wrong intermediate
// certificate, which OkHttp (Android) rejects but NSURLSession (iOS) tolerates.

const BCV_URL = "https://www.bcv.org.ve/";

function extractRate(html: string, divId: string): number | null {
  const divRegex = new RegExp(`id="${divId}"[\\s\\S]*?<strong class="strong-tb">([^<]+)</strong>`);
  const match = html.match(divRegex);
  if (!match) return null;
  const raw = match[1].trim().replace(/\./g, "").replace(",", ".");
  const value = Number(raw);
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
}

export type BcvRates = {
  usdVesRate: number;
  eurVesRate: number;
};

export async function fetchBcvRates(): Promise<BcvRates> {
  const response = await fetch(BCV_URL);
  if (!response.ok) throw new Error(`BCV fetch failed: HTTP ${response.status}`);
  const html = await response.text();

  const usdVesRate = extractRate(html, "dolar");
  const eurVesRate = extractRate(html, "euro");
  if (usdVesRate === null || eurVesRate === null) {
    throw new Error("BCV rate extraction failed — page structure may have changed");
  }

  return { usdVesRate, eurVesRate };
}
