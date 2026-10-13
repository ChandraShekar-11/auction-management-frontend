import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import { db } from "@/db/connection.server";

const requiredEnv = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required. Configure it in your server environment.`);
  }
  return value;
};

const baseURL = requiredEnv("BETTER_AUTH_URL");
const googleClientId = process.env["GOOGLE_CLIENT_ID"];
const googleClientSecret = process.env["GOOGLE_CLIENT_SECRET"];
const googleEnabled = Boolean(googleClientId && googleClientSecret);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "mysql",
    usePlural: true,
  }),
  baseURL,
  secret: requiredEnv("BETTER_AUTH_SECRET"),
  trustedOrigins: [baseURL],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  socialProviders: googleEnabled
    ? {
        google: {
          clientId: googleClientId!,
          clientSecret: googleClientSecret!,
        },
      }
    : undefined,
  plugins: [tanstackStartCookies()],
});

export const googleSignInEnabled = googleEnabled;
