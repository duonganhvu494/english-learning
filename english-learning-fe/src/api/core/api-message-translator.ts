import type { Dictionary } from "@/i18n/types";

const AUTH_ERROR_MAP = {
  "username is not registered": "usernameNotRegistered",
  "password is incorrect": "passwordIncorrect",
  "username is not valid": "usernameInvalid",
  "password is not valid": "passwordInvalid",
} as const;

function normalizeMessage(message: string) {
  return message.trim().toLowerCase();
}

function translateSingleMessage(message: string, dictionary: Dictionary) {
  const key =
    AUTH_ERROR_MAP[normalizeMessage(message) as keyof typeof AUTH_ERROR_MAP];

  if (!key) {
    return message;
  }

  return dictionary.login.errors[key];
}

export function translateApiMessage(
  message: string | string[] | undefined,
  dictionary: Dictionary,
  fallback: string,
) {
  if (!message) {
    return fallback;
  }

  if (Array.isArray(message)) {
    return message
      .map((item) => translateSingleMessage(item, dictionary))
      .join(", ");
  }

  return translateSingleMessage(message, dictionary);
}
