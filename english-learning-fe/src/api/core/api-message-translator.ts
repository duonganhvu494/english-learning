import type { Dictionary } from "@/i18n/types";

const AUTH_ERROR_MESSAGE_MAP = {
  "username is not registered": "usernameNotRegistered",
  "password is incorrect": "passwordIncorrect",
  "username is not valid": "usernameInvalid",
  "password is not valid": "passwordInvalid",
  "account is disabled": "accountDisabled",
  "email or username already exists": "credentialsAlreadyExist",
  "fullName can not be empty": "fullNameRequired",
  "username can not be empty": "userNameRequired",
  "password can not be empty": "passwordRequired",
  "password must be at least 6 characters": "passwordTooShort",
  "email is invalid": "emailInvalid",
} as const;

const AUTH_ERROR_CODE_MAP = {
  AUTH_USERNAME_NOT_REGISTERED: "usernameNotRegistered",
  AUTH_PASSWORD_INCORRECT: "passwordIncorrect",
  AUTH_USERNAME_INVALID: "usernameInvalid",
  AUTH_PASSWORD_INVALID: "passwordInvalid",
  AUTH_ACCOUNT_DISABLED: "accountDisabled",
  USER_CREDENTIALS_ALREADY_EXIST: "credentialsAlreadyExist",
  USER_NOT_FOUND: "usernameNotRegistered",
  USERNAME_OR_PASSWORD_INVALID: "usernameInvalid",
  FULLNAME_REQUIRED: "fullNameRequired",
  USERNAME_REQUIRED: "userNameRequired",
  PASSWORD_REQUIRED: "passwordRequired",
  PASSWORD_TOO_SHORT: "passwordTooShort",
  EMAIL_INVALID: "emailInvalid",
} as const;

function normalizeMessage(message: string) {
  return message.trim().toLowerCase();
}

function getErrorTextFromKey(key: string, dictionary: Dictionary) {
  if (key in dictionary.login.errors) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (dictionary.login.errors as any)[key];
  }

  if (key in dictionary.signUp.errors) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (dictionary.signUp.errors as any)[key];
  }

  return undefined;
}

function translateSingleMessage(message: string, dictionary: Dictionary) {
  const key =
    AUTH_ERROR_MESSAGE_MAP[
      normalizeMessage(message) as keyof typeof AUTH_ERROR_MESSAGE_MAP
    ];

  if (!key) {
    return message;
  }

  const translated = getErrorTextFromKey(key, dictionary);
  return translated ?? message;
}

function translateErrorCode(code: string, dictionary: Dictionary) {
  const key = AUTH_ERROR_CODE_MAP[code as keyof typeof AUTH_ERROR_CODE_MAP];
  if (!key) {
    return undefined;
  }

  return getErrorTextFromKey(key, dictionary);
}

export function translateApiMessage(
  message: string | string[] | undefined,
  code: string | undefined,
  dictionary: Dictionary,
  fallback: string,
) {
  if (code) {
    const codeTranslation = translateErrorCode(code, dictionary);
    if (codeTranslation) {
      return codeTranslation;
    }
  }

  if (!message) {
    return fallback;
  }

  if (Array.isArray(message)) {
    const translatedList = message.map((item) =>
      translateSingleMessage(item, dictionary),
    );
    return translatedList.join(", ");
  }

  return translateSingleMessage(message, dictionary);
}
