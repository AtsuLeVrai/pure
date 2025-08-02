# Pure Discord Bot

> **The Discord bot as it should be: simple, powerful, and completely free.**

Pure combines the best features from premium Discord bots like MEE6, Ticket Tool, DraftBot, and RaidProtect into a single, comprehensive solution—**without paywalls, premium tiers, or feature restrictions**.

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![Discord.js](https://img.shields.io/badge/discord.js-v14-blue.svg)](https://discord.js.org/)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/)

## Why Pure?

**Discord bots shouldn't be locked behind paywalls.** Essential server management features should be accessible to everyone, regardless of budget.

### The Problem
- **MEE6**: Leveling and moderation features locked behind premium
- **Ticket Tool**: Advanced customization requires premium
- **DraftBot**: Economy and games need premium
- **RaidProtect**: Anti-raid features partially premium
- **Multiple bots**: Managing 5+ different bots with different commands and interfaces

### The Solution
Pure provides **all these features in one bot, completely free, forever.**

## Features

### 🛡️ **Advanced Moderation**
- **Anti-raid protection** with intelligent pattern detection
- **Auto-moderation** with customizable filters and actions
- **Comprehensive logging** with detailed audit trails
- **Flexible punishment system** (warns, mutes, kicks, bans)
- **Mass moderation tools** for handling large-scale issues

### 🎫 **Professional Ticket System**
- **Multi-category support** with custom templates
- **Automatic staff assignment** based on roles and availability
- **Ticket transcripts** with full conversation history
- **Priority levels** and escalation workflows
- **Department routing** for complex organizations

### 📊 **Engagement & Leveling**
- **XP and leveling system** without artificial restrictions
- **Custom rank cards** with personalization options
- **Role rewards** for reaching specific levels
- **Leaderboards** with various sorting options
- **Activity tracking** and engagement analytics

### 💰 **Virtual Economy**
- **Currency system** with earning and spending mechanics
- **Interactive games** and activities
- **Daily/weekly rewards** and streak bonuses
- **Shop system** with custom items and roles
- **Economic balancing** tools for administrators

### 🎮 **Server Engagement**
- **Reaction roles** with unlimited configurations
- **Custom commands** and autoresponders
- **Welcome/goodbye messages** with rich embeds
- **Announcement systems** with cross-posting
- **Event management** and reminders

### 📈 **Analytics & Insights**
- **Server growth metrics** and member analytics
- **Command usage statistics** and performance monitoring
- **Activity heatmaps** and engagement tracking
- **Custom dashboards** for administrators
- **Export capabilities** for external analysis


**And much more!** *Pure is designed to be modular and extensible, allowing for future growth and community-driven features.*

## Quick Start

### Prerequisites
- **Node.js** 22.0.0 or higher
- **PostgreSQL/Supabase** database
- **Discord Bot Token** ([Create one here](https://discord.com/developers/applications))

### Environment Setup

```env
# Required
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_bot_client_id
DATABASE_URL=postgresql://user:password@localhost:5432/pure
```

## Production Deployment

Pure is designed for enterprise-grade deployments and can handle **100,000+ servers** with proper infrastructure.

### Scaling Considerations
- **Horizontal scaling** with multiple bot instances
- **Database clustering** for high availability
- **Redis caching** for improved performance
- **Load balancing** for API endpoints
- **Monitoring** with Prometheus and Grafana

## Contributing

We welcome contributions from developers of all skill levels! Pure is built by the community, for the community.

### Getting Started
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- **Code Quality**: We use TypeScript, ESLint, and Prettier
- **Testing**: Add tests for new features
- **Documentation**: Update docs for user-facing changes
- **Performance**: Consider impact on large servers (100k+ members)

## Philosophy

> "Essential Discord functionality should be accessible to everyone, not just those who can afford premium subscriptions."

Pure believes that:
- **Community first**: Features are driven by actual user needs, not profit margins
- **Transparency**: Open source means no hidden agendas or data harvesting
- **Quality**: Enterprise-grade code quality and reliability
- **Accessibility**: Free forever, with no artificial limitations

## Comparison

| Feature | MEE6 | Ticket Tool | DraftBot | RaidProtect | **Pure** |
|---------|------|-------------|----------|-------------|----------|
| **Moderation** | Limited free | ❌ | Basic | Limited free | ✅ **Full** |
| **Tickets** | ❌ | Paid tiers | ❌ | ❌ | ✅ **Full** |
| **Leveling** | Paid premium | ❌ | Paid premium | ❌ | ✅ **Full** |
| **Economy** | ❌ | ❌ | Paid premium | ❌ | ✅ **Full** |
| **Anti-raid** | Basic | ❌ | ❌ | Paid premium | ✅ **Full** |
| **Custom branding** | Premium only | Premium only | Premium only | Premium only | ✅ **Free** |
| **API access** | Premium only | Premium only | ❌ | ❌ | ✅ **Free** |
| **Priority support** | Premium only | Premium only | Premium only | Premium only | ✅ **Community** |
| **Monthly cost** | $11.95 | $4.99 | $3.99 | $2.99 | **$0.00** |

## Support

[//]: # (- **Documentation**: [docs.purebot.dev]&#40;https://docs.purebot.dev&#41; *&#40;coming soon&#41;*)
- **Discord Server**: [Join our community](https://discord.gg/pure) *(coming soon)*
- **GitHub Issues**: [Report bugs or request features](https://github.com/AtsuLeVrai/pure/issues)
- **Email**: [support@purebot.dev](mailto:support@purebot.dev) *(coming soon)*

## License

Pure is licensed under the [Apache License 2.0](LICENSE). This means:
- ✅ **Commercial use** allowed
- ✅ **Modification** allowed
- ✅ **Distribution** allowed
- ✅ **Private use** allowed
- ⚠️ **Trademark use** limited
- ⚠️ **Warranty** not provided

## Acknowledgments

Pure is inspired by the excellent work of existing Discord bots. We aim to honor their innovations while making these features accessible to everyone.

---

**Made with ❤️ by the Pure community**

*Pure - Discord made simple, powerful, and free.*