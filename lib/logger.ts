import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  redact: {
    paths: [
      "password",
      "token",
      "secret",
      "authorization",
      "apiKey",
      "google_refresh_token",
      "refreshToken",
      "*.password",
      "*.token",
      "*.secret",
      "*.authorization",
      "*.apiKey",
      "headers['x-telegram-bot-api-secret-token']",
      "headers.authorization",
    ],
    remove: true,
  },
});

