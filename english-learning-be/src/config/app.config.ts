const parseOrigins = (value?: string): string[] =>
  (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

const defaultDevOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];

export default () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const configuredOrigins = parseOrigins(process.env.CORS_ALLOWED_ORIGINS);

  return {
    app: {
      nodeEnv,
      port: parseInt(process.env.PORT ?? '3000', 10),
      cors: {
        allowedOrigins:
          configuredOrigins.length > 0
            ? configuredOrigins
            : nodeEnv === 'development'
              ? defaultDevOrigins
              : [],
      },
      swagger: {
        enabled:
          process.env.SWAGGER_ENABLED !== undefined
            ? process.env.SWAGGER_ENABLED === 'true'
            : nodeEnv !== 'production',
        path: process.env.SWAGGER_PATH || 'api-docs',
      },
    },
    security: {
      csrfCookieName: process.env.CSRF_COOKIE_NAME || 'csrfToken',
      csrfHeaderName: process.env.CSRF_HEADER_NAME || 'x-csrf-token',
    },
  };
};
