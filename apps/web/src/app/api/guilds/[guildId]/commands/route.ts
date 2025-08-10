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

    // Authenticate user
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

    // Get custom commands from database
    const commands = await prisma.customCommand.findMany({
      where: {
        guild_id: guildId,
        deleted_at: null,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return NextResponse.json({
      commands,
      total: commands.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { guildId } = await params;

    if (!guildId) {
      return NextResponse.json(
        { error: "Guild ID is required" },
        { status: 400 },
      );
    }

    // Authenticate user
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

    // Parse request body
    const { name, description, response } = await request.json();

    // Validate required fields
    if (!name || !response) {
      return NextResponse.json(
        { error: "Command name and response are required" },
        { status: 400 },
      );
    }

    // Validate command name (alphanumeric + underscores only)
    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
      return NextResponse.json(
        {
          error:
            "Command name can only contain letters, numbers, and underscores",
        },
        { status: 400 },
      );
    }

    // Check if command already exists
    const existingCommand = await prisma.customCommand.findUnique({
      where: {
        guild_id_name: {
          guild_id: guildId,
          name: name.toLowerCase(),
        },
      },
    });

    if (existingCommand && !existingCommand.deleted_at) {
      return NextResponse.json(
        { error: "A command with this name already exists" },
        { status: 409 },
      );
    }

    // Create the command
    const command = await prisma.customCommand.create({
      data: {
        guild_id: guildId,
        name: name.toLowerCase(),
        description: description || null,
        response,
        created_by: authResult.user.id,
        enabled: true,
      },
    });

    return NextResponse.json({
      message: "Command created successfully",
      command,
    });
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

    // Authenticate user
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

    // Parse request body
    const { commandId, updates } = await request.json();

    if (!commandId) {
      return NextResponse.json(
        { error: "Command ID is required" },
        { status: 400 },
      );
    }

    // Remove fields that shouldn't be updated
    delete updates.id;
    delete updates.guild_id;
    delete updates.created_by;
    delete updates.created_at;

    // Update the command
    const command = await prisma.customCommand.update({
      where: {
        id: commandId,
        guild_id: guildId, // Ensure the command belongs to this guild
      },
      data: {
        ...updates,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      message: "Command updated successfully",
      command,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { guildId } = await params;

    if (!guildId) {
      return NextResponse.json(
        { error: "Guild ID is required" },
        { status: 400 },
      );
    }

    // Authenticate user
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

    // Parse request body
    const { commandId } = await request.json();

    if (!commandId) {
      return NextResponse.json(
        { error: "Command ID is required" },
        { status: 400 },
      );
    }

    // Soft delete the command
    await prisma.customCommand.update({
      where: {
        id: commandId,
        guild_id: guildId, // Ensure the command belongs to this guild
      },
      data: {
        deleted_at: new Date(),
        deleted_by: authResult.user.id,
      },
    });

    return NextResponse.json({
      message: "Command deleted successfully",
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
