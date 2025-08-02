"use client";

import type { APIUser } from "discord-api-types/v10";

/**
 * Get Discord avatar URL (client-side version)
 */
export function getAvatarUrl(
  userId: string,
  avatar: string | null,
  size = 128,
): string {
  if (!avatar) {
    // Default Discord avatar based on user ID
    const defaultAvatar = parseInt(userId) % 5;
    return `https://cdn.discordapp.com/embed/avatars/${defaultAvatar}.png`;
  }

  return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.${avatar.startsWith("a_") ? "gif" : "png"}?size=${size}`;
}

/**
 * Get user display name (client-side version)
 */
export function getDisplayName(user: APIUser): string {
  return user.global_name || user.username;
}
