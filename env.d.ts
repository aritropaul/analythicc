declare global {
  interface CloudflareEnv {
    DB: D1Database;
    ADMIN_PASSWORD: string;
    SESSION_SECRET: string;
    SALT_SEED: string;
    APP_NAME?: string;
  }
}

export {};
