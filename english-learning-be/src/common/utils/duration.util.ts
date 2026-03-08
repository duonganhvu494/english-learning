const DURATION_PATTERN = /^(\d+)(ms|s|m|h|d)?$/i;

const UNIT_TO_MS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

export function parseDurationToMs(
  value: string | number | undefined,
  fallbackMs: number,
): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return fallbackMs;
  }

  const trimmedValue = value.trim();
  const matched = DURATION_PATTERN.exec(trimmedValue);
  if (!matched) {
    return fallbackMs;
  }

  const amount = Number.parseInt(matched[1], 10);
  const unit = (matched[2] || 'ms').toLowerCase();
  const multiplier = UNIT_TO_MS[unit];

  if (!Number.isFinite(amount) || !multiplier) {
    return fallbackMs;
  }

  return amount * multiplier;
}

export function parseDurationToSeconds(
  value: string | number | undefined,
  fallbackSeconds: number,
): number {
  const milliseconds = parseDurationToMs(value, fallbackSeconds * 1000);
  return Math.max(1, Math.floor(milliseconds / 1000));
}
