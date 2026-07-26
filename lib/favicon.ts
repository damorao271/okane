/** Very loose domain check — "facebank.com", "www.facebank.com", "https://facebank.com/x". */
const DOMAIN_PATTERN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i;

export function extractDomain(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withoutProtocol = trimmed.replace(/^https?:\/\//i, "");
  const host = withoutProtocol.split(/[/?#]/)[0].replace(/^www\./i, "");
  return DOMAIN_PATTERN.test(host) ? host.toLowerCase() : null;
}

export function faviconUrlForDomain(domain: string, size = 128): string {
  return `https://www.google.com/s2/favicons?sz=${size}&domain=${encodeURIComponent(domain)}`;
}
