type EnvRecord = Record<string, string | undefined>;

const isBlank = (value: string | undefined): boolean =>
  value === undefined || value.trim().length === 0;

const requireEnv = (
  env: EnvRecord,
  key: string,
  errors: string[],
): void => {
  if (isBlank(env[key])) {
    errors.push(`${key} is required`);
  }
};

const requireBooleanEnv = (
  env: EnvRecord,
  key: string,
  errors: string[],
): void => {
  const value = env[key];
  if (value !== 'true' && value !== 'false') {
    errors.push(`${key} must be "true" or "false"`);
  }
};

const requireIntegerEnv = (
  env: EnvRecord,
  key: string,
  errors: string[],
): void => {
  const value = env[key];
  if (isBlank(value)) {
    errors.push(`${key} is required`);
    return;
  }

  if (!Number.isInteger(Number(value))) {
    errors.push(`${key} must be an integer`);
  }
};

export const validateEnvironment = (env: EnvRecord): EnvRecord => {
  const errors: string[] = [];

  [
    'DB_HOST',
    'DB_USERNAME',
    'DB_PASSWORD',
    'DB_NAME',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'COOKIE_SAME_SITE',
    'CSRF_COOKIE_NAME',
    'CSRF_HEADER_NAME',
    'REDIS_HOST',
    'REDIS_PORT',
    'AUTH_LOGIN_RATE_LIMIT_MAX_ATTEMPTS',
    'AUTH_LOGIN_RATE_LIMIT_WINDOW',
    'ATTENDANCE_SELF_CHECKIN_LATE_MINUTES',
  ].forEach((key) => requireEnv(env, key, errors));

  ['DB_PORT', 'REDIS_PORT', 'REDIS_DB'].forEach((key) =>
    requireIntegerEnv(env, key, errors),
  );

  [
    'COOKIE_SECURE',
    'DB_SYNCHRONIZE',
    'S3_FORCE_PATH_STYLE',
    'SWAGGER_ENABLED',
  ].forEach((key) => {
    if (!isBlank(env[key])) {
      requireBooleanEnv(env, key, errors);
    }
  });

  const nodeEnv = env.NODE_ENV?.trim();
  if (
    nodeEnv !== undefined &&
    nodeEnv.length > 0 &&
    !['development', 'test', 'production'].includes(nodeEnv)
  ) {
    errors.push('NODE_ENV must be one of development, test, production');
  }

  const sameSite = env.COOKIE_SAME_SITE?.trim().toLowerCase();
  if (
    sameSite !== undefined &&
    sameSite.length > 0 &&
    !['lax', 'strict', 'none'].includes(sameSite)
  ) {
    errors.push('COOKIE_SAME_SITE must be one of lax, strict, none');
  }

  if (sameSite === 'none' && env.COOKIE_SECURE !== 'true') {
    errors.push('COOKIE_SAME_SITE=none requires COOKIE_SECURE=true');
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed: ${errors.join('; ')}`);
  }

  return env;
};
