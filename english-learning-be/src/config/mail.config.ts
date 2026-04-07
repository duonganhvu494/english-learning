export default () => ({
  mail: {
    host: process.env.MAIL_HOST?.trim() || '',
    port: Number.parseInt(process.env.MAIL_PORT || '0', 10),
    secure: process.env.MAIL_SECURE === 'true',
    user: process.env.MAIL_USER?.trim() || '',
    password: process.env.MAIL_PASSWORD || '',
    from: process.env.MAIL_FROM?.trim() || 'no-reply@example.local',
  },
});
