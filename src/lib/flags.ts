// Cup26 Arena - flag URL helper.
// Uses HatScripts/circle-flags via the jsDelivr CDN. Already circular SVG,
// so it drops straight into our round AvatarFlag without masking.
// Source: https://github.com/HatScripts/circle-flags (MIT licensed).

const CIRCLE_FLAGS_BASE = "https://hatscripts.github.io/circle-flags/flags";

export function circleFlagUrl(iso2Code: string | null | undefined): string | null {
  if (!iso2Code) return null;
  const normalized = iso2Code.trim().toLowerCase();
  if (!/^[a-z]{2}$|^gb-[a-z]{3}$/.test(normalized)) return null;
  return `${CIRCLE_FLAGS_BASE}/${normalized}.svg`;
}
