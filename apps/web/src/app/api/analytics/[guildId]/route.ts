import { NextResponse } from "next/server";
import { authenticateUser, getDiscordToken } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { DiscordUtils } from "@/lib/discord-api";

interface RouteParams {
  params: { guildId: string };
}

export async function GET(request: Request, { params }: RouteParams) {
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

    // Get query parameters
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get("days") || "30");
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get analytics data from database
    const analytics = await prisma.analytics.findMany({
      where: {
        guild_id: guildId,
        date: {
          gte: startDate,
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    // Get member metrics
    const memberMetrics = await prisma.userMetrics.aggregate({
      where: {
        guild_id: guildId,
      },
      _sum: {
        messages_sent: true,
        commands_used: true,
        reactions_given: true,
        reactions_received: true,
      },
      _count: {
        user_id: true,
      },
    });

    // Get moderation stats
    const moderationStats = await prisma.moderationLog.aggregate({
      where: {
        guild_id: guildId,
        timestamp: {
          gte: startDate,
        },
      },
      _count: {
        id: true,
      },
    });

    // Get warning stats
    const warningStats = await prisma.warning.aggregate({
      where: {
        guild_id: guildId,
        created_at: {
          gte: startDate,
        },
      },
      _count: {
        id: true,
      },
    });

    // Get ticket stats
    const ticketStats = await prisma.ticket.aggregate({
      where: {
        guild_id: guildId,
        created_at: {
          gte: startDate,
        },
      },
      _count: {
        id: true,
      },
    });

    // Get custom command usage
    const commandUsage = await prisma.customCommand.findMany({
      where: {
        guild_id: guildId,
        deleted_at: null,
      },
      select: {
        name: true,
        uses: true,
      },
      orderBy: {
        uses: "desc",
      },
      take: 10,
    });

    // Get recent audit logs
    const recentActivity = await prisma.auditLog.findMany({
      where: {
        guild_id: guildId,
      },
      orderBy: {
        timestamp: "desc",
      },
      take: 20,
    });

    // Calculate totals
    const totals = analytics.reduce(
      (acc, record) => ({
        members:
          record.member_count > acc.members ? record.member_count : acc.members,
        joins: acc.joins + record.joins,
        leaves: acc.leaves + record.leaves,
        messages: acc.messages + record.message_count,
        voiceMinutes: acc.voiceMinutes + record.voice_minutes,
        commands: acc.commands + record.commands_used,
        reactions: acc.reactions + record.reactions_count,
        threads: acc.threads + record.threads_created,
        tickets: acc.tickets + record.tickets_created,
        errors: acc.errors + record.error_count,
        warnings: acc.warnings + record.warning_count,
      }),
      {
        members: 0,
        joins: 0,
        leaves: 0,
        messages: 0,
        voiceMinutes: 0,
        commands: 0,
        reactions: 0,
        threads: 0,
        tickets: 0,
        errors: 0,
        warnings: 0,
      },
    );

    // Format analytics data for charts
    const chartData = analytics.map((record) => ({
      date: record.date.toISOString().split("T")[0],
      members: record.member_count,
      joins: record.joins,
      leaves: record.leaves,
      messages: record.message_count,
      voiceMinutes: record.voice_minutes,
      commands: record.commands_used,
      reactions: record.reactions_count,
    }));

    const responseData = {
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      },
      totals,
      chartData,
      memberMetrics: {
        totalUsers: memberMetrics._count.user_id || 0,
        totalMessages: memberMetrics._sum.messages_sent || 0,
        totalCommands: memberMetrics._sum.commands_used || 0,
        totalReactionsGiven: memberMetrics._sum.reactions_given || 0,
        totalReactionsReceived: memberMetrics._sum.reactions_received || 0,
      },
      moderationStats: {
        totalActions: moderationStats._count.id || 0,
        totalWarnings: warningStats._count.id || 0,
        totalTickets: ticketStats._count.id || 0,
      },
      commandUsage,
      recentActivity: recentActivity.map((log) => ({
        id: log.id,
        action: log.action,
        level: log.level,
        title: log.title,
        description: log.description,
        timestamp: log.timestamp.toISOString(),
        user_id: log.user_id,
        success: log.success,
      })),
    };

    return NextResponse.json(responseData);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
