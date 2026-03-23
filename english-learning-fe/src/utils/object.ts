export const getNestedValue = <T = unknown>(
  obj: Record<string, unknown>,
  path: string,
): T | undefined => {
  return path.split(".").reduce((current: unknown, key: string) => {
    return current && typeof current === "object" && key in current
      ? (current as Record<string, unknown>)[key]
      : undefined;
  }, obj) as T | undefined;
};
