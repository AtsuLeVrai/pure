import type { Interaction, Locale } from "discord.js";
import { eq } from "drizzle-orm";
import i18next, { type TFunction } from "i18next";
import { db, env } from "@/index.js";
import { guildConfigs } from "@/schemas/guild-config.js";
import { Logger } from "./logger.js";

// Supported languages configuration - Complete Discord.js Locale mapping
export const SUPPORTED_LANGUAGES = {
  id: {
    name: "Bahasa Indonesia",
    flag: "🇮🇩",
    fallback: false,
  },
  "en-US": {
    name: "English (US)",
    flag: "🇺🇸",
    fallback: true,
  },
  "en-GB": {
    name: "English (UK)",
    flag: "🇬🇧",
    fallback: false,
  },
  bg: {
    name: "Български",
    flag: "🇧🇬",
    fallback: false,
  },
  "zh-CN": {
    name: "中文 (简体)",
    flag: "🇨🇳",
    fallback: false,
  },
  "zh-TW": {
    name: "中文 (繁體)",
    flag: "🇹🇼",
    fallback: false,
  },
  hr: {
    name: "Hrvatski",
    flag: "🇭🇷",
    fallback: false,
  },
  cs: {
    name: "Čeština",
    flag: "🇨🇿",
    fallback: false,
  },
  da: {
    name: "Dansk",
    flag: "🇩🇰",
    fallback: false,
  },
  nl: {
    name: "Nederlands",
    flag: "🇳🇱",
    fallback: false,
  },
  fi: {
    name: "Suomi",
    flag: "🇫🇮",
    fallback: false,
  },
  fr: {
    name: "Français",
    flag: "🇫🇷",
    fallback: false,
  },
  de: {
    name: "Deutsch",
    flag: "🇩🇪",
    fallback: false,
  },
  el: {
    name: "Ελληνικά",
    flag: "🇬🇷",
    fallback: false,
  },
  hi: {
    name: "हिन्दी",
    flag: "🇮🇳",
    fallback: false,
  },
  hu: {
    name: "Magyar",
    flag: "🇭🇺",
    fallback: false,
  },
  it: {
    name: "Italiano",
    flag: "🇮🇹",
    fallback: false,
  },
  ja: {
    name: "日本語",
    flag: "🇯🇵",
    fallback: false,
  },
  ko: {
    name: "한국어",
    flag: "🇰🇷",
    fallback: false,
  },
  lt: {
    name: "Lietuvių",
    flag: "🇱🇹",
    fallback: false,
  },
  no: {
    name: "Norsk",
    flag: "🇳🇴",
    fallback: false,
  },
  pl: {
    name: "Polski",
    flag: "🇵🇱",
    fallback: false,
  },
  "pt-BR": {
    name: "Português (Brasil)",
    flag: "🇧🇷",
    fallback: false,
  },
  ro: {
    name: "Română",
    flag: "🇷🇴",
    fallback: false,
  },
  ru: {
    name: "Русский",
    flag: "🇷🇺",
    fallback: false,
  },
  "es-ES": {
    name: "Español (España)",
    flag: "🇪🇸",
    fallback: false,
  },
  "es-419": {
    name: "Español (LATAM)",
    flag: "🌎",
    fallback: false,
  },
  "sv-SE": {
    name: "Svenska",
    flag: "🇸🇪",
    fallback: false,
  },
  th: {
    name: "ไทย",
    flag: "🇹🇭",
    fallback: false,
  },
  tr: {
    name: "Türkçe",
    flag: "🇹🇷",
    fallback: false,
  },
  uk: {
    name: "Українська",
    flag: "🇺🇦",
    fallback: false,
  },
  vi: {
    name: "Tiếng Việt",
    flag: "🇻🇳",
    fallback: false,
  },
} as const satisfies Record<
  Locale,
  {
    name: string;
    flag: string;
    fallback: boolean;
  }
>;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// Language detection cache
const languageCache = new Map<string, string>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const cacheTimestamps = new Map<string, number>();

/**
 * Initialize i18next with enterprise-grade configuration
 */
export async function initializeI18n(): Promise<void> {
  try {
    await i18next.init({
      // Language detection configuration
      fallbackLng: "en-US",
      debug: env.NODE_ENV === "development",

      // Namespace configuration
      defaultNS: "common",
      ns: ["common", "commands", "moderation", "economy", "errors"],

      // Resource configuration - will be loaded dynamically
      resources: {},

      // Interpolation configuration - New i18next formatting approach
      interpolation: {
        escapeValue: false, // Discord handles escaping
        formatSeparator: ",",
      },

      // Performance configuration
      load: "languageOnly",
      preload: Object.keys(SUPPORTED_LANGUAGES),
      cleanCode: true,

      // Error handling
    });
  } catch (error) {
    Logger.error("Failed to initialize i18next", { error });
    throw error;
  }
}

/**
 * Get the language for a guild from cache or database
 */
export async function getGuildLanguage(
  guildId: string,
): Promise<SupportedLanguage> {
  const cacheKey = `guild:${guildId}`;
  const cached = languageCache.get(cacheKey);
  const cacheTime = cacheTimestamps.get(cacheKey);

  // Return cached value if still valid
  if (cached && cacheTime && Date.now() - cacheTime < CACHE_TTL) {
    return cached as SupportedLanguage;
  }

  try {
    const guildConfig = await db
      .select({ language: guildConfigs.language })
      .from(guildConfigs)
      .where(eq(guildConfigs.guildId, guildId))
      .limit(1)
      .then((rows) => rows[0] || null);

    const language = guildConfig?.language ?? "en-US";

    // Cache the result
    languageCache.set(cacheKey, language);
    cacheTimestamps.set(cacheKey, Date.now());

    return language as SupportedLanguage;
  } catch (error) {
    Logger.error("Failed to get guild language", {
      guildId,
      error: error instanceof Error ? error.message : String(error),
    });

    // Return default language on error
    return "en-US";
  }
}

/**
 * Set the language for a guild
 */
export async function setGuildLanguage(
  guildId: string,
  language: SupportedLanguage,
): Promise<void> {
  try {
    await db
      .insert(guildConfigs)
      .values({
        guildId: guildId,
        language,
      })
      .onConflictDoUpdate({
        target: guildConfigs.guildId,
        set: { language },
      });

    // Update cache
    const cacheKey = `guild:${guildId}`;
    languageCache.set(cacheKey, language);
    cacheTimestamps.set(cacheKey, Date.now());
  } catch (error) {
    Logger.error("Failed to set guild language", {
      guildId,
      language,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Get translation function for a specific language
 */
export function getTranslation(language: SupportedLanguage): TFunction {
  return i18next.getFixedT(language);
}

/**
 * Get translation function for a guild
 */
export async function getGuildTranslation(guildId: string): Promise<TFunction> {
  const language = await getGuildLanguage(guildId);
  return getTranslation(language);
}

/**
 * Get translation function from interaction context
 */
export async function getInteractionTranslation(
  interaction: Interaction,
): Promise<TFunction> {
  if (!interaction.guildId) {
    // Use Discord locale for user preference detection
    const userLocale = "locale" in interaction ? interaction.locale : undefined;
    const detectedLanguage = detectLanguageFromLocale(userLocale);
    return getTranslation(detectedLanguage);
  }

  return await getGuildTranslation(interaction.guildId);
}

/**
 * Utility function to validate if a language is supported
 */
export function isSupportedLanguage(
  language: string,
): language is SupportedLanguage {
  return language in SUPPORTED_LANGUAGES;
}

/**
 * Auto-detect language from user's locale (fallback mechanism)
 */
export function detectLanguageFromLocale(locale?: string): SupportedLanguage {
  if (!locale) return "en-US";

  // Direct Discord locale mapping
  if (isSupportedLanguage(locale)) {
    return locale;
  }

  // Fallback mappings for similar locales
  const fallbackMappings: Record<string, SupportedLanguage> = {
    en: "en-US",
    es: "es-ES",
    pt: "pt-BR",
    zh: "zh-CN",
    sv: "sv-SE",
  };

  const languageCode = locale.split("-")[0]?.toLowerCase();
  if (languageCode && fallbackMappings[languageCode]) {
    return fallbackMappings[languageCode];
  }

  return "en-US";
}
