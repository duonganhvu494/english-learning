const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const formatSequentialCode = (
  prefix: string,
  sequence: number,
): string => `${prefix}-${String(sequence).padStart(3, '0')}`;

export const resolveNextSequentialCode = (
  prefix: string,
  existingCodes: Array<string | null | undefined>,
): string => {
  const pattern = new RegExp(`^${escapeRegExp(prefix)}-(\\d+)$`);

  const maxSequence = existingCodes.reduce((currentMax, code) => {
    if (!code) {
      return currentMax;
    }

    const match = pattern.exec(code);
    if (!match) {
      return currentMax;
    }

    const parsedSequence = Number.parseInt(match[1] ?? '0', 10);
    return Number.isNaN(parsedSequence)
      ? currentMax
      : Math.max(currentMax, parsedSequence);
  }, 0);

  return formatSequentialCode(prefix, maxSequence + 1);
};
