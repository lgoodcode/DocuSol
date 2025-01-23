export declare global {
  declare namespace NodeJS {
    export interface ProcessEnv {
      SENTRY_PROJECT: string;
      SENTRY_ORG: string;
      SENTRY_AUTH_TOKEN: string;
      NEXT_PUBLIC_SENTRY_DSN: string;
      HELIUS_API_URL: string;
      NEXT_PUBLIC_SUPABASE_URL: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
      PRIVATE_KEY: string;
    }
  }
}
