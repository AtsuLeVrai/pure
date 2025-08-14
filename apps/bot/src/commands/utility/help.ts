import {
  ActionRowBuilder,
  type ApplicationCommandOptionData,
  ApplicationCommandOptionType,
  ButtonBuilder,
  type ButtonInteraction,
  ButtonStyle,
  bold,
  type ChatInputCommandInteraction,
  type Client,
  Colors,
  ComponentType,
  EmbedBuilder,
  hyperlink,
  inlineCode,
  MessageFlags,
  StringSelectMenuBuilder,
  type StringSelectMenuInteraction,
  StringSelectMenuOptionBuilder,
  userMention,
} from "discord.js";
import { type CommandCategory, defineSlashCommand } from "@/types/index.js";
import { commandRegistry } from "@/utils/registry.js";

interface CommandInfo {
  name: string;
  description: string;
  usage?: string;
  examples?: string[];
  permissions?: string[];
  aliases?: string[];
  cooldown?: number;
  nsfw?: boolean;
  guildOnly?: boolean;
}

interface CategoryInfo {
  name: string;
  description: string;
  emoji: string;
  commands: CommandInfo[];
  color: number;
}

// Category metadata for display purposes
const CATEGORY_METADATA: Record<
  CommandCategory,
  Omit<CategoryInfo, "commands">
> = {
  moderation: {
    name: "Moderation",
    description: "Advanced server moderation and user management tools",
    emoji: "🔨",
    color: Colors.Red,
  },
  utility: {
    name: "Utility",
    description: "Essential utility commands and server information",
    emoji: "🔧",
    color: Colors.Blue,
  },
  fun: {
    name: "Fun & Games",
    description: "Entertainment commands and interactive games",
    emoji: "🎮",
    color: Colors.Green,
  },
  tickets: {
    name: "Ticket System",
    description: "Advanced support ticket management and workflow",
    emoji: "🎫",
    color: Colors.Purple,
  },
  leveling: {
    name: "Leveling & XP",
    description: "User progression, rankings, and achievement system",
    emoji: "📈",
    color: Colors.Gold,
  },
  economy: {
    name: "Economy & Casino",
    description: "Virtual currency, shop, and casino games",
    emoji: "💰",
    color: Colors.Yellow,
  },
  admin: {
    name: "Administration",
    description: "Server configuration and advanced management tools",
    emoji: "⚙️",
    color: Colors.Orange,
  },
};

// Enhanced command information extraction from actual command definitions
function getCommandInfo(
  command: (typeof commandRegistry)[number],
): CommandInfo {
  // Extract usage and examples from command options
  const options = command.data.options || [];
  const requiredOptions = options
    .filter((opt) => "required" in opt && opt.required)
    .map((opt) => `<${opt.name}>`);
  const optionalOptions = options
    .filter((opt) => !("required" in opt) || !opt.required)
    .map((opt) => `[${opt.name}]`);
  const usage = `/${command.data.name} ${[...requiredOptions, ...optionalOptions].join(" ")}`;

  // Generate examples based on command type
  const examples = generateCommandExamples(command.data.name, options);

  // Extract permissions from command data (this would need to be enhanced in actual commands)
  const permissions = getCommandPermissions(command.data.name);

  return {
    name: command.data.name,
    description: command.data.description,
    usage: usage.trim(),
    examples,
    permissions,
    cooldown: getCommandCooldown(command.data.name),
    guildOnly: isCommandGuildOnly(command.data.name),
  };
}

// Generate smart examples based on command name and options
function generateCommandExamples(
  commandName: string,
  options: readonly ApplicationCommandOptionData[],
): string[] {
  const baseCommand = `/${commandName}`;

  switch (commandName) {
    case "ban":
      return [
        `${baseCommand} @user Spamming`,
        `${baseCommand} @user Rule violation 7 true`,
      ];
    case "kick":
      return [
        `${baseCommand} @user Breaking rules`,
        `${baseCommand} @user Warning violation true`,
      ];
    case "timeout":
      return [
        `${baseCommand} @user 1h Spam`,
        `${baseCommand} @user 30m Rule violation`,
      ];
    case "warn":
      return [
        `${baseCommand} add @user Inappropriate behavior`,
        `${baseCommand} list @user`,
      ];
    case "mute":
      return [`${baseCommand} @user Voice chat disruption`];
    case "unmute":
      return [`${baseCommand} @user Appeal accepted`];
    case "purge":
      return [
        `${baseCommand} 50`,
        `${baseCommand} 10 @user`,
        `${baseCommand} 25 contains:spam`,
      ];
    case "lock":
      return [`${baseCommand}`, `${baseCommand} #general @members Emergency`];
    case "unlock":
      return [
        `${baseCommand}`,
        `${baseCommand} #general @members Issue resolved`,
      ];
    case "slowmode":
      return [`${baseCommand} 30s`, `${baseCommand} 5m Rate limiting`];
    case "massban":
      return [`${baseCommand} 123,456,789 Raid participants`];
    case "modlogs":
      return [`${baseCommand} @user`, `${baseCommand} moderator:@mod type:ban`];
    case "nickname":
      return [`${baseCommand} @user NewName`, `${baseCommand} @user (reset)`];
    case "unban":
      return [`${baseCommand} 123456789 Appeal approved`];
    case "userinfo":
      return [`${baseCommand} @user`];
    case "help":
      return [
        `${baseCommand}`,
        `${baseCommand} ban`,
        `${baseCommand} category:moderation`,
      ];
    case "ping":
      return [`${baseCommand}`];
    default:
      return options.length > 0
        ? [
            `${baseCommand} ${options.map((opt) => ("required" in opt && opt.required ? `<${opt.name}>` : `[${opt.name}]`)).join(" ")}`,
          ]
        : [`${baseCommand}`];
  }
}

// Get command permissions (this could be enhanced to read from command metadata)
function getCommandPermissions(commandName: string): string[] {
  const permissionMap: Record<string, string[]> = {
    ban: ["BAN_MEMBERS"],
    kick: ["KICK_MEMBERS"],
    timeout: ["MODERATE_MEMBERS"],
    warn: ["MANAGE_MESSAGES"],
    mute: ["MUTE_MEMBERS"],
    unmute: ["MUTE_MEMBERS"],
    purge: ["MANAGE_MESSAGES"],
    lock: ["MANAGE_CHANNELS"],
    unlock: ["MANAGE_CHANNELS"],
    slowmode: ["MANAGE_CHANNELS"],
    massban: ["BAN_MEMBERS", "ADMINISTRATOR"],
    modlogs: ["MANAGE_GUILD"],
    nickname: ["MANAGE_NICKNAMES"],
    unban: ["BAN_MEMBERS"],
    userinfo: ["MANAGE_GUILD"],
  };
  return permissionMap[commandName] || [];
}

// Get command cooldown (this could be enhanced to read from command metadata)
function getCommandCooldown(commandName: string): number {
  const cooldownMap: Record<string, number> = {
    ban: 3,
    kick: 3,
    timeout: 2,
    warn: 2,
    mute: 2,
    unmute: 2,
    purge: 5,
    lock: 3,
    unlock: 3,
    slowmode: 2,
    massban: 10,
    modlogs: 3,
    nickname: 2,
    unban: 3,
    userinfo: 5,
    help: 2,
    ping: 3,
  };
  return cooldownMap[commandName] || 0;
}

// Check if command is guild only
function isCommandGuildOnly(commandName: string): boolean {
  const guildOnlyCommands = [
    "ban",
    "kick",
    "timeout",
    "warn",
    "mute",
    "unmute",
    "purge",
    "lock",
    "unlock",
    "slowmode",
    "massban",
    "modlogs",
    "nickname",
    "unban",
    "userinfo",
  ];
  return guildOnlyCommands.includes(commandName);
}

// Dynamic command database generation from registry
function getCommandDatabase(): Record<CommandCategory, CategoryInfo> {
  const database: Record<CommandCategory, CategoryInfo> = {} as any;

  // Initialize all categories with metadata
  for (const [category, metadata] of Object.entries(CATEGORY_METADATA)) {
    database[category as CommandCategory] = {
      ...metadata,
      commands: [],
    };
  }

  // Populate commands from registry
  for (const command of commandRegistry) {
    const category = command.category;
    const commandInfo = getCommandInfo(command);

    if (database[category]) {
      database[category].commands.push(commandInfo);
    }
  }

  return database;
}

export default defineSlashCommand({
  data: {
    name: "help",
    description:
      "Interactive help system with comprehensive command documentation",
    options: [
      {
        name: "command",
        description: "Get detailed information about a specific command",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
      {
        name: "category",
        description: "Browse commands by category",
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
          { name: "🔨 Moderation", value: "moderation" },
          { name: "🔧 Utility", value: "utility" },
          { name: "🎮 Fun & Games", value: "fun" },
          { name: "🎫 Ticket System", value: "tickets" },
          { name: "📈 Leveling & XP", value: "leveling" },
          { name: "💰 Economy & Casino", value: "economy" },
          { name: "⚙️ Administration", value: "admin" },
        ],
      },
    ],
  },
  category: "utility",
  async execute(client, interaction) {
    const specificCommand = interaction.options.getString("command");
    const specificCategory = interaction.options.getString(
      "category",
    ) as CommandCategory | null;

    if (specificCommand) {
      await handleSpecificCommand(client, interaction, specificCommand);
      return;
    }

    if (specificCategory) {
      await handleCategoryView(client, interaction, specificCategory, 0);
      return;
    }

    await handleMainMenu(client, interaction);
  },
});

async function handleMainMenu(
  client: Client<true>,
  interaction: ChatInputCommandInteraction | ButtonInteraction,
) {
  const commandDatabase = getCommandDatabase();
  const totalCommands = Object.values(commandDatabase).reduce(
    (total, category) => total + category.commands.length,
    0,
  );

  const embed = new EmbedBuilder()
    .setTitle("🤖 Pure Bot - Command Center")
    .setDescription(
      `${bold("Welcome to Pure's comprehensive help system!")}\n\n` +
        `📋 ${bold("Quick Stats")}\n` +
        `├ Total Commands: ${inlineCode(totalCommands.toString())}\n` +
        `├ Active Categories: ${inlineCode(Object.keys(commandDatabase).length.toString())}\n` +
        `└ Bot Version: ${inlineCode("v2.0.0")}\n\n` +
        `🔍 ${bold("Navigation Options")}\n` +
        `• Use the ${bold("category selector")} below to browse commands\n` +
        `• Click ${bold("Quick Search")} to find specific commands\n` +
        `• Use ${bold("/help <command>")} for detailed command info\n\n` +
        `💡 ${bold("Pro Tips")}\n` +
        "• Commands shown are based on your permissions\n" +
        "• All moderation actions are logged automatically\n" +
        `• Use ${inlineCode("/help category:<name>")} for quick access`,
    )
    .setColor(Colors.Blurple)
    .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
    .addFields(
      {
        name: "📊 Category Overview",
        value:
          Object.entries(commandDatabase)
            .filter(([_, category]) => category.commands.length > 0)
            .map(
              ([_key, category]) =>
                `${category.emoji} ${bold(category.name)}: ${category.commands.length} commands`,
            )
            .join("\n") || "No categories available",
        inline: false,
      },
      {
        name: "🔗 Useful Links",
        value: [
          `${hyperlink("Documentation", "https://docs.pure.bot")}`,
          `${hyperlink("Support Server", "https://discord.gg/pure")}`,
          `${hyperlink("Invite Bot", "https://invite.pure.bot")}`,
        ].join(" • "),
        inline: false,
      },
    )
    .setFooter({
      text: `Requested by ${interaction.user.tag} • Pure Bot v2.0.0`,
      iconURL: interaction.user.displayAvatarURL({ size: 64 }),
    })
    .setTimestamp();

  const categorySelect = new StringSelectMenuBuilder()
    .setCustomId("help_category_select")
    .setPlaceholder("📂 Select a category to explore...")
    .setMinValues(1)
    .setMaxValues(1);

  Object.entries(commandDatabase)
    .filter(([_, category]) => category.commands.length > 0)
    .forEach(([key, category]) => {
      categorySelect.addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel(category.name)
          .setDescription(category.description)
          .setValue(key)
          .setEmoji(category.emoji),
      );
    });

  const actionButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("help_quick_search")
      .setLabel("Quick Search")
      .setEmoji("🔍")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("help_permissions")
      .setLabel("My Permissions")
      .setEmoji("🔒")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("help_refresh")
      .setLabel("Refresh")
      .setEmoji("🔄")
      .setStyle(ButtonStyle.Primary),
  );

  const selectRow =
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      categorySelect,
    );

  const response = await interaction.reply({
    embeds: [embed],
    components: [selectRow, actionButtons],
    flags: MessageFlags.Ephemeral,
  });

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: 300_000,
  });

  const buttonCollector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 300_000,
  });

  collector.on("collect", async (selectInteraction) => {
    if (selectInteraction.user.id !== interaction.user.id) {
      await selectInteraction.reply({
        content:
          "❌ This help menu can only be used by the person who requested it.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const selectedCategory = selectInteraction.values[0] as CommandCategory;
    await handleCategoryView(client, selectInteraction, selectedCategory, 0);
  });

  buttonCollector.on("collect", async (buttonInteraction) => {
    if (buttonInteraction.user.id !== interaction.user.id) {
      await buttonInteraction.reply({
        content:
          "❌ This help menu can only be used by the person who requested it.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (buttonInteraction.customId === "help_refresh") {
      await buttonInteraction.deferUpdate();
      await handleMainMenu(client, buttonInteraction);
    } else if (buttonInteraction.customId === "help_quick_search") {
      await handleQuickSearch(buttonInteraction);
    } else if (buttonInteraction.customId === "help_permissions") {
      await handlePermissionCheck(buttonInteraction);
    }
  });

  collector.on("end", async () => {
    try {
      const disabledSelectRow = ActionRowBuilder.from(selectRow).setComponents(
        selectRow.components.map((component) => component.setDisabled(true)),
      );
      const disabledActionButtons = ActionRowBuilder.from(
        actionButtons,
      ).setComponents(
        actionButtons.components.map((component) =>
          component.setDisabled(true),
        ),
      );

      await response.edit({
        embeds: [
          embed.setFooter({
            text: "❌ This help menu has expired. Use /help to get a new one.",
          }),
        ],
        components: [
          disabledSelectRow.toJSON(),
          disabledActionButtons.toJSON(),
        ],
      });
    } catch {
      // Ignore errors when editing expired interactions
    }
  });
}

async function handleCategoryView(
  client: Client<true>,
  interaction:
    | ChatInputCommandInteraction
    | ButtonInteraction
    | StringSelectMenuInteraction,
  categoryKey: CommandCategory,
  page = 0,
) {
  const commandDatabase = getCommandDatabase();
  const category = commandDatabase[categoryKey];
  const commandsPerPage = 5;
  const totalPages = Math.ceil(category.commands.length / commandsPerPage);
  const startIndex = page * commandsPerPage;
  const endIndex = startIndex + commandsPerPage;
  const currentCommands = category.commands.slice(startIndex, endIndex);

  const embed = new EmbedBuilder()
    .setTitle(`${category.emoji} ${category.name} Commands`)
    .setDescription(
      `${category.description}\n\n` +
        `📊 ${bold("Category Stats")}\n` +
        `├ Total Commands: ${inlineCode(category.commands.length.toString())}\n` +
        `├ Page: ${inlineCode(`${page + 1}/${totalPages}`)}\n` +
        `└ Showing: ${inlineCode(`${startIndex + 1}-${Math.min(endIndex, category.commands.length)}`)}\n`,
    )
    .setColor(category.color)
    .setFooter({
      text: `Page ${page + 1}/${totalPages} • Use /help <command> for detailed info`,
      iconURL: client.user.displayAvatarURL({ size: 64 }),
    })
    .setTimestamp();

  if (currentCommands.length === 0) {
    embed.addFields({
      name: "🚧 Coming Soon",
      value:
        "Commands in this category are currently under development.\nCheck back soon for exciting new features!",
      inline: false,
    });
  } else {
    currentCommands.forEach((command, _index) => {
      const permissions = command.permissions
        ? `\n🔒 **Permissions:** ${command.permissions.map((p) => inlineCode(p)).join(", ")}`
        : "";
      const cooldown = command.cooldown
        ? `\n⏱️ **Cooldown:** ${command.cooldown}s`
        : "";
      const guildOnly = command.guildOnly ? "\n🏠 **Server Only**" : "";

      embed.addFields({
        name: `${inlineCode(`/${command.name}`)} • ${command.description}`,
        value:
          (command.usage ? `📝 **Usage:** ${inlineCode(command.usage)}` : "") +
          permissions +
          cooldown +
          guildOnly,
        inline: false,
      });
    });
  }

  const navigationButtons = new ActionRowBuilder<ButtonBuilder>();

  if (totalPages > 1) {
    navigationButtons.addComponents(
      new ButtonBuilder()
        .setCustomId(`help_category_${categoryKey}_${Math.max(0, page - 1)}`)
        .setLabel("◀ Previous")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 0),
      new ButtonBuilder()
        .setCustomId(
          `help_category_${categoryKey}_${Math.min(totalPages - 1, page + 1)}`,
        )
        .setLabel("Next ▶")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === totalPages - 1),
    );
  }

  navigationButtons.addComponents(
    new ButtonBuilder()
      .setCustomId("help_back_main")
      .setLabel("◀ Back to Menu")
      .setEmoji("🏠")
      .setStyle(ButtonStyle.Primary),
  );

  if (interaction.replied || interaction.deferred) {
    await interaction.editReply({
      embeds: [embed],
      components: [navigationButtons],
    });
  } else {
    await interaction.reply({
      embeds: [embed],
      components: [navigationButtons],
      flags: MessageFlags.Ephemeral,
    });
  }

  if (!interaction.replied) {
    const response = await interaction.fetchReply();
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300_000,
    });

    collector.on("collect", async (buttonInteraction) => {
      if (buttonInteraction.user.id !== interaction.user.id) {
        await buttonInteraction.reply({
          content:
            "❌ This help menu can only be used by the person who requested it.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (buttonInteraction.customId === "help_back_main") {
        await buttonInteraction.deferUpdate();
        await handleMainMenu(client, buttonInteraction);
      } else if (buttonInteraction.customId.startsWith("help_category_")) {
        const [_, __, category, pageStr] =
          buttonInteraction.customId.split("_");
        await buttonInteraction.deferUpdate();
        await handleCategoryView(
          client,
          buttonInteraction,
          category as CommandCategory,
          Number.parseInt(pageStr as string, 10),
        );
      }
    });
  }
}

async function handleSpecificCommand(
  client: Client<true>,
  interaction: ChatInputCommandInteraction,
  commandName: string,
) {
  const command = findCommand(commandName.toLowerCase());

  if (!command) {
    const suggestions = findSimilarCommands(commandName);
    const embed = new EmbedBuilder()
      .setTitle("❌ Command Not Found")
      .setDescription(
        `The command ${inlineCode(`/${commandName}`)} could not be found.\n\n` +
          (suggestions.length > 0
            ? `🔍 ${bold("Did you mean?")}\n${suggestions.map((cmd) => `• ${inlineCode(`/${cmd.name}`)} - ${cmd.description}`).join("\n")}`
            : `💡 ${bold("Suggestions")}\n• Use ${inlineCode("/help")} to browse all commands\n• Check your spelling and try again\n• Use ${inlineCode("/help category:<name>")} to browse by category`),
      )
      .setColor(Colors.Red)
      .setFooter({ text: "Use /help to see all available commands" });

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    return;
  }

  const category = findCategoryForCommand(command.name);
  const embed = new EmbedBuilder()
    .setTitle(`${inlineCode(`/${command.name}`)} Command Reference`)
    .setDescription(command.description)
    .setColor(category?.color || Colors.Blue)
    .addFields({
      name: "📝 Usage",
      value: command.usage
        ? inlineCode(command.usage)
        : inlineCode(`/${command.name}`),
      inline: false,
    })
    .setFooter({
      text: `Category: ${category?.name || "Unknown"} • Pure Bot v2.0.0`,
      iconURL: client.user.displayAvatarURL({ size: 64 }),
    })
    .setTimestamp();

  if (command.examples?.length) {
    embed.addFields({
      name: "💡 Examples",
      value: command.examples.map((ex) => `• ${inlineCode(ex)}`).join("\n"),
      inline: false,
    });
  }

  if (command.permissions?.length) {
    embed.addFields({
      name: "🔒 Required Permissions",
      value: command.permissions.map((perm) => inlineCode(perm)).join(", "),
      inline: true,
    });
  }

  if (command.cooldown) {
    embed.addFields({
      name: "⏱️ Cooldown",
      value: `${command.cooldown} seconds`,
      inline: true,
    });
  }

  const badges = [];
  if (command.guildOnly) badges.push("🏠 Server Only");
  if (command.nsfw) badges.push("🔞 NSFW");
  if (badges.length > 0) {
    embed.addFields({
      name: "🏷️ Restrictions",
      value: badges.join("\n"),
      inline: true,
    });
  }

  const backButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(
        `help_category_${category ? Object.keys(getCommandDatabase()).find((key) => getCommandDatabase()[key as CommandCategory] === category) : "utility"}_0`,
      )
      .setLabel(`◀ Back to ${category?.name || "Category"}`)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("help_back_main")
      .setLabel("🏠 Main Menu")
      .setStyle(ButtonStyle.Primary),
  );

  await interaction.reply({
    embeds: [embed],
    components: [backButton],
    flags: MessageFlags.Ephemeral,
  });
}

async function handleQuickSearch(interaction: any) {
  const commandDatabase = getCommandDatabase();
  const allCommands = Object.values(commandDatabase)
    .flatMap((category) => category.commands)
    .filter((cmd) => cmd.name !== "help")
    .slice(0, 25);

  if (allCommands.length === 0) {
    await interaction.reply({
      content: "❌ No commands available for search.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const searchSelect = new StringSelectMenuBuilder()
    .setCustomId("help_search_select")
    .setPlaceholder("🔍 Choose a command to view details...")
    .setMinValues(1)
    .setMaxValues(1);

  allCommands.forEach((command) => {
    const category = findCategoryForCommand(command.name);
    searchSelect.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(`/${command.name}`)
        .setDescription(command.description.slice(0, 100))
        .setValue(command.name)
        .setEmoji(category?.emoji || "🔧"),
    );
  });

  const selectRow =
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(searchSelect);
  const backButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("help_back_main")
      .setLabel("◀ Back to Menu")
      .setStyle(ButtonStyle.Secondary),
  );

  const embed = new EmbedBuilder()
    .setTitle("🔍 Quick Command Search")
    .setDescription(
      "Select a command from the dropdown below to view detailed information.\n\n" +
        `📊 ${bold("Available Commands")}: ${allCommands.length}\n` +
        `💡 ${bold("Tip")}: Use ${inlineCode("/help <command>")} to search directly!`,
    )
    .setColor(Colors.Blue)
    .setFooter({ text: "Select a command to view its documentation" });

  await interaction.reply({
    embeds: [embed],
    components: [selectRow, backButton],
    flags: MessageFlags.Ephemeral,
  });
}

async function handlePermissionCheck(interaction: any) {
  const member = interaction.member;
  const permissions = member?.permissions;

  if (!permissions) {
    await interaction.reply({
      content: "❌ Unable to check permissions in DMs.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const relevantPerms = [
    "ADMINISTRATOR",
    "MANAGE_GUILD",
    "MANAGE_CHANNELS",
    "MANAGE_MESSAGES",
    "MANAGE_NICKNAMES",
    "KICK_MEMBERS",
    "BAN_MEMBERS",
    "MODERATE_MEMBERS",
    "MUTE_MEMBERS",
  ];

  const hasPerms = relevantPerms.filter((perm) => permissions.has(perm as any));
  const missingPerms = relevantPerms.filter(
    (perm) => !permissions.has(perm as any),
  );

  const embed = new EmbedBuilder()
    .setTitle("🔒 Your Permission Summary")
    .setDescription(`Permission check for ${userMention(interaction.user.id)}`)
    .setColor(
      hasPerms.length > missingPerms.length ? Colors.Green : Colors.Orange,
    )
    .addFields(
      {
        name: `✅ Available Permissions (${hasPerms.length})`,
        value:
          hasPerms.length > 0
            ? hasPerms.map((perm) => `• ${inlineCode(perm)}`).join("\n")
            : "No moderation permissions",
        inline: false,
      },
      {
        name: `❌ Missing Permissions (${missingPerms.length})`,
        value:
          missingPerms.length > 0
            ? missingPerms.map((perm) => `• ${inlineCode(perm)}`).join("\n")
            : "You have all relevant permissions!",
        inline: false,
      },
    )
    .setFooter({
      text: "Commands shown in help are filtered based on your permissions",
    });

  const backButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("help_back_main")
      .setLabel("◀ Back to Menu")
      .setStyle(ButtonStyle.Secondary),
  );

  await interaction.reply({
    embeds: [embed],
    components: [backButton],
    flags: MessageFlags.Ephemeral,
  });
}

function findCommand(commandName: string): CommandInfo | null {
  const commandDatabase = getCommandDatabase();
  for (const category of Object.values(commandDatabase)) {
    const command = category.commands.find(
      (cmd) =>
        cmd.name.toLowerCase() === commandName.toLowerCase() ||
        cmd.aliases?.some(
          (alias) => alias.toLowerCase() === commandName.toLowerCase(),
        ),
    );
    if (command) return command;
  }
  return null;
}

function findCategoryForCommand(commandName: string): CategoryInfo | null {
  const commandDatabase = getCommandDatabase();
  for (const category of Object.values(commandDatabase)) {
    if (category.commands.some((cmd) => cmd.name === commandName)) {
      return category;
    }
  }
  return null;
}

function findSimilarCommands(input: string): CommandInfo[] {
  const commandDatabase = getCommandDatabase();
  const allCommands = Object.values(commandDatabase).flatMap(
    (cat) => cat.commands,
  );
  return allCommands
    .filter((cmd) => {
      const similarity = calculateSimilarity(
        input.toLowerCase(),
        cmd.name.toLowerCase(),
      );
      return similarity > 0.4;
    })
    .sort(
      (a, b) =>
        calculateSimilarity(input.toLowerCase(), b.name.toLowerCase()) -
        calculateSimilarity(input.toLowerCase(), a.name.toLowerCase()),
    )
    .slice(0, 3);
}

function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array.from({ length: str2.length + 1 }, (_, i) => [i]);
  for (let i = 0; i <= str1.length; i++) (matrix[0] as number[])[i] = i;

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      const cost = str1[j - 1] === str2[i - 1] ? 0 : 1;
      (matrix[i] as number[])[j] = Math.min(
        ((matrix[i - 1] as number[])[j] as number) + 1,
        ((matrix[i] as number[])[j - 1] as number) + 1,
        ((matrix[i - 1] as number[])[j - 1] as number) + cost,
      );
    }
  }
  return (matrix[str2.length] as number[])[str1.length] as number;
}
