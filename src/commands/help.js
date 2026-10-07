const { EmbedBuilder } = require('discord.js');
const config = require('../env');

module.exports = {
  name: 'help',
  description: 'Show all commands',
  usage: '!help [command]',
  async execute(message, args, client) {
    const p = config.prefix;

    if (args[0]) {
      const cmd = client.commands.get(args[0].toLowerCase());
      if (!cmd) return message.reply('❌ Unknown command.');
      const embed = new EmbedBuilder()
        .setTitle(`📖 ${p}${cmd.name}`)
        .setColor(0x5865F2)
        .addFields(
          { name: 'Description', value: cmd.description || 'No description' },
          { name: 'Usage', value: `\`${cmd.usage || p + cmd.name}\`` },
          { name: 'Required Permissions', value: cmd.permissions?.join(', ') || 'None' },
        );
      return message.reply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setTitle('📋 Bot Commands')
      .setColor(0x5865F2)
      .setDescription(`Prefix: \`${p}\` | Use \`${p}help <command>\` for details`)
      .addFields(
        {
          name: '🔨 Moderation',
          value: [
            `\`${p}ban\` — Ban a member`,
            `\`${p}kick\` — Kick a member`,
            `\`${p}mute\` — Timeout a member`,
            `\`${p}unmute\` — Remove timeout`,
            `\`${p}warn\` — Warn a member`,
            `\`${p}warnings\` — View warnings`,
            `\`${p}clear\` — Bulk delete messages`,
            `\`${p}slowmode\` — Set channel slowmode`,
            `\`${p}lock\` — Lock a channel`,
            `\`${p}unlock\` — Unlock a channel`,
          ].join('\n'),
        },
        {
          name: '🎭 Reaction Roles',
          value: [
            `\`${p}reactionrole create\` — Create a reaction role message`,
            `\`${p}reactionrole add\` — Add emoji → role pair`,
            `\`${p}reactionrole remove\` — Remove an emoji pair`,
            `\`${p}reactionrole list\` — List all setups`,
          ].join('\n'),
        },
        {
          name: 'ℹ️ Info',
          value: [
            `\`${p}userinfo\` — User info`,
            `\`${p}serverinfo\` — Server info`,
          ].join('\n'),
        },
      )
      .setFooter({ text: `${client.guilds.cache.size} server(s) | ${client.commands.size} commands` })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
