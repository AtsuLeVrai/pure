import { Locale } from "discord.js";
import i18next from "i18next";
import { env } from "@/index.js";
import { Logger } from "./logger.js";

// Initialize i18next
export async function initializeI18n(): Promise<void> {
  try {
    const fallbackLng: Locale = Locale.EnglishUS;
    await i18next.init({
      fallbackLng,
      debug: env.NODE_ENV === "development",
      defaultNS: "common",
      ns: ["common"],
      interpolation: {
        escapeValue: false,
        formatSeparator: ",",
      },
      load: "languageOnly",
      preload: Object.values(Locale),
      cleanCode: true,
    });
  } catch (error) {
    Logger.error("Failed to initialize i18next", { error });
    throw error;
  }
}
