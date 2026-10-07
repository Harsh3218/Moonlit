const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

const dataPath = path.join(__dirname, '../../data/warnings.json');

module.exports = {
  name: 'warnings',
  description: 'List warnings for a user',
  usage: '!warnings @user',
  permissions: ['ModerateMembers'],
  async execute(message, args) {
    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Please mention a user.');

    if (!fs.existsSync(dataPath)) return message.reply(`✅ **${target.user.tag}** has no warnings.`);

    const warnings = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const key = `${message.guild.id}-${target.id}`;
    const userWarnings = warnings[key] || [];

    if (!userWarnings.length) return message.reply(`✅ **${target.user.tag}** has no warnings.`);

    const embed = new EmbedBuilder()
      .setTitle(`⚠️ Warnings for ${target.user.tag}`)
      .setColor(0xf1c40f)
      .setDescription(
        userWarnings.map((w, i) =>
          `**${i + 1}.** ${w.reason}\n> <t:${Math.floor(w.timestamp / 1000)}:R> by <@${w.moderator}>`
        ).join('\n\n')
      )
      .setFooter({ text: `Total: ${userWarnings.length} warning(s)` });

    message.reply({ embeds: [embed] });
  },
};
