/* eslint-disable no-restricted-syntax */
export default () => ({
  env: process.env.NODE_ENV,
  port: parseInt(process.env.PORT, 10) || 3008,

  app: {
    name: process.env.APP_NAME || 'Open School Portal',
    slug: process.env.APP_SLUG,
  },

  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    user: process.env.DB_USER,
    pass: process.env.DB_PASS,
    name: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true',
  },

  mail: {
    mailer: process.env.MAIL_MAILER,
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT, 10),
    username: process.env.MAIL_USERNAME,
    password: process.env.MAIL_PASSWORD,
    encryption: process.env.MAIL_ENCRYPTION,
    from: {
      address: process.env.MAIL_FROM_ADDRESS,
      name: process.env.MAIL_FROM_NAME,
    },
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
  },

  logger: {
    legLevel: process.env.LOG_LEVEL || 'info',
  },

  paystack: {
    url: process.env.PAYSTACK_URL,
    key: process.env.PAYSTACK_KEY,
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  frontend: {
    url: process.env.FRONTEND_URL,
  },

  isTest(): boolean {
    return process.env.NODE_ENV === 'test';
  },

  isDev(): boolean {
    const env = process.env.NODE_ENV;
    const envs = ['development', 'localhost', 'local', 'dev'];
    return !env || envs.includes(env);
  },
  isStaging(): boolean {
    return process.env.NODE_ENV === 'staging';
  },
  isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  },
});
