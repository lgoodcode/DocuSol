export declare global {
  declare namespace NodeJS {
    export interface ProcessEnv {
      SENTRY_PROJECT: string;
      SENTRY_ORG: string;
      SENTRY_AUTH_TOKEN: string;
    }
  }
}
