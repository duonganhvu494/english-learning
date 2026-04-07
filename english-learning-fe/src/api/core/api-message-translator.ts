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
  "you already have a class with this name in this workspace":
    "classNameAlreadyExists",
  "workspace not found": "workspaceNotFound",
  "csrf token is missing or invalid": "csrfInvalid",
  "billing plan not found": "billingPlanNotFound",
  "selected plan is not billable": "billingPlanNotBillable",
  "workspace already has an active billing subscription":
    "billingSubscriptionAlreadyExists",
  "payment transaction not found": "billingTransactionNotFound",
  "only pending transactions can be marked as paid":
    "billingTransactionStatusInvalid",
  "only pending transactions can be marked as failed":
    "billingTransactionStatusInvalid",
  "billing subscription not found": "billingSubscriptionNotFound",
  "only active billing subscriptions can be cancelled at period end":
    "billingSubscriptionStatusInvalid",
  "current password is incorrect": "currentPasswordIncorrect",
  "new password must be different from current password":
    "newPasswordMustDifferent",
  "notification not found": "notificationNotFound",
  "email already exists": "emailAlreadyExists",
  "username already exists": "usernameAlreadyExists",
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
  CLASS_NAME_ALREADY_EXISTS: "classNameAlreadyExists",
  WORKSPACE_NOT_FOUND: "workspaceNotFound",
  AUTH_CSRF_INVALID: "csrfInvalid",
  WORKSPACE_STUDENT_CREDENTIALS_ALREADY_EXIST: "credentialsAlreadyExist",
  WORKSPACE_STUDENT_EMAIL_ALREADY_EXISTS: "credentialsAlreadyExist",
  WORKSPACE_STUDENT_USERNAME_ALREADY_EXISTS: "credentialsAlreadyExist",
  BILLING_PLAN_NOT_FOUND: "billingPlanNotFound",
  BILLING_PLAN_NOT_BILLABLE: "billingPlanNotBillable",
  BILLING_SUBSCRIPTION_ALREADY_EXISTS: "billingSubscriptionAlreadyExists",
  BILLING_TRANSACTION_NOT_FOUND: "billingTransactionNotFound",
  BILLING_TRANSACTION_STATUS_INVALID: "billingTransactionStatusInvalid",
  BILLING_SUBSCRIPTION_NOT_FOUND: "billingSubscriptionNotFound",
  BILLING_SUBSCRIPTION_STATUS_INVALID: "billingSubscriptionStatusInvalid",
  AUTH_CURRENT_PASSWORD_INCORRECT: "currentPasswordIncorrect",
  AUTH_NEW_PASSWORD_MUST_DIFFERENT: "newPasswordMustDifferent",
  NOTIFICATION_NOT_FOUND: "notificationNotFound",
  USER_EMAIL_ALREADY_EXISTS: "emailAlreadyExists",
  USER_USERNAME_ALREADY_EXISTS: "usernameAlreadyExists",
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

  if (key in dictionary.dashboard) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (dictionary.dashboard as any)[key];
  }

  if (key in dictionary.settingsPage) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (dictionary.settingsPage as any)[key];
  }

  if (key in dictionary.notificationsPage) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (dictionary.notificationsPage as any)[key];
  }

  if (key in dictionary.profilePage) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (dictionary.profilePage as any)[key];
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
