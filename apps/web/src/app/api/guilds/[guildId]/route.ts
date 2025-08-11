import type { GuildConfig } from "@pure/database";
import type { APIGuild } from "discord-api-types/v10";
import { NextResponse } from "next/server";
import { authenticateUser, getDiscordToken } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { DiscordUtils } from "@/lib/discord-api";

interface RouteParams {
  params: { guildId: string };
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { guildId } = await params;

    if (!guildId) {
      return NextResponse.json(
        { error: "Guild ID is required" },
        { status: 400 },
      );
    }

    // Authenticate user using secure database session
    const authResult = await authenticateUser();

    if (!authResult.user) {
      return NextResponse.json(
        { error: authResult.error || "Not authenticated" },
        { status: 401 },
      );
    }

    // Get Discord token from encrypted database storage
    const accessToken = await getDiscordToken(authResult.user.id);

    if (!accessToken) {
      return NextResponse.json(
        { error: "Discord token not available or expired" },
        { status: 401 },
      );
    }

    // Fetch guild details from Discord
    console.log(
      `Attempting to fetch guild ${guildId} for user ${authResult.user.id}`,
    );

    const discordGuild = await DiscordUtils.getEnhancedGuild(
      guildId,
      authResult.user.id,
      accessToken,
    );

    if (!discordGuild) {
      console.log(
        `Failed to get enhanced guild for ${guildId} - checking permissions manually`,
      );

      // Debug: Check user's guilds directly
      try {
        const userGuilds = await fetch(
          "https://discord.com/api/v10/users/@me/guilds",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        const guilds = await userGuilds.json();

        if (userGuilds.ok && Array.isArray(guilds)) {
          console.log(`User has access to ${guilds.length} guilds`);
          const targetGuild = guilds.find((g: any) => g.id === guildId);
          if (targetGuild) {
            console.log(
              `Found guild ${guildId} with permissions: ${targetGuild.permissions}`,
            );
          } else {
            console.log(`Guild ${guildId} not found in user's guild list`);
          }
        } else {
          console.log(
            `Discord API error: ${userGuilds.status} ${userGuilds.statusText}`,
          );
          console.log("Response body:", guilds);
        }
      } catch (debugError) {
        console.log("Debug check failed:", debugError);
      }

      return NextResponse.json(
        { error: "Guild not found or access denied" },
        { status: 403 },
      );
    }

    // Get or create guild configuration from database
    let guildConfig = await prisma.guildConfig.findUnique({
      where: { guild_id: guildId },
    });

    console.log(`Guild config for ${guildId} found:`, guildConfig);

    // If config doesn't exist, create it with default values
    if (!guildConfig) {
      guildConfig = await prisma.guildConfig.create({
        data: {
          guild_id: guildId,
          moderation_log_channel_id: null,
          auto_role_id: null,
          mute_role_id: null,
          level_system_enabled: false,
          level_up_channel_id: null,
          level_up_message: null,
          xp_rate: 1.0,
          economy_enabled: false,
          daily_reward: BigInt(100),
          work_reward_min: BigInt(50),
          work_reward_max: BigInt(200),
          ticket_category_id: null,
          ticket_support_role_id: null,
          welcome_enabled: false,
          welcome_channel_id: null,
          welcome_message: null,
          leave_enabled: false,
          leave_channel_id: null,
          leave_message: null,
          language: "en",
          timezone: "UTC",
          data_retention_days: 365,
          gdpr_contact_email: null,
          privacy_policy_url: null,
          terms_of_service_url: null,
        },
      });
    }

    // Combine Discord guild info with database config
    const enhancedGuild: APIGuild & { config: GuildConfig } = {
      ...discordGuild,
      config: guildConfig,
    };

    return NextResponse.json(enhancedGuild);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { guildId } = await params;

    if (!guildId) {
      return NextResponse.json(
        { error: "Guild ID is required" },
        { status: 400 },
      );
    }

    // Authenticate user using secure database session
    const authResult = await authenticateUser();

    if (!authResult.user) {
      return NextResponse.json(
        { error: authResult.error || "Not authenticated" },
        { status: 401 },
      );
    }

    // Get Discord token to verify guild access
    const accessToken = await getDiscordToken(authResult.user.id);

    if (!accessToken) {
      return NextResponse.json(
        { error: "Discord token not available or expired" },
        { status: 401 },
      );
    }

    // Verify user has access to this guild
    const guilds = await DiscordUtils.getManageableGuilds(
      accessToken,
      authResult.user.id,
    );
    const hasAccess = guilds.some((g) => g.id === guildId);

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this guild" },
        { status: 403 },
      );
    }

    // Parse the request body for config updates
    const configUpdates = await request.json();

    // Remove any fields that shouldn't be updated directly
    delete configUpdates.id;
    delete configUpdates.guild_id;
    delete configUpdates.created_at;
    delete configUpdates.updated_at;

    // Convert BigInt fields from strings if provided
    if (configUpdates.daily_reward !== undefined) {
      configUpdates.daily_reward = BigInt(configUpdates.daily_reward);
    }
    if (configUpdates.work_reward_min !== undefined) {
      configUpdates.work_reward_min = BigInt(configUpdates.work_reward_min);
    }
    if (configUpdates.work_reward_max !== undefined) {
      configUpdates.work_reward_max = BigInt(configUpdates.work_reward_max);
    }

    // Update or create guild configuration
    const updatedConfig = await prisma.guildConfig.upsert({
      where: { guild_id: guildId },
      create: {
        guild_id: guildId,
        ...configUpdates,
      },
      update: {
        ...configUpdates,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      message: "Guild configuration updated successfully",
      config: updatedConfig,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
