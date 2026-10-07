const { EmbedBuilder } = require('discord.js');
const config = require('../env');

async function logAction(guild, { action, target, moderator, reason, duration }) {
  const logChannel = guild.channels.cache.find(c => c.name === config.modLogChannel);
  if (!logChannel) return;

  const colors = {
    Ban: 0xe74c3c,
    Unban: 0x2ecc71,
    Kick: 0xe67e22,
    Mute: 0xf39c12,
    Unmute: 0x1abc9c,
    Warn: 0xf1c40f,
    Clear: 0x3498db,
  };

  const embed = new EmbedBuilder()
    .setTitle(`🔨 ${action}`)
    .setColor(colors[action] || 0x99aab5)
    .addFields(
      { name: 'Target', value: target ? `${target.tag || target} (${target.id || target})` : 'Unknown', inline: true },
      { name: 'Moderator', value: moderator ? `${moderator.tag} (${moderator.id})` : 'Unknown', inline: true },
      { name: 'Reason', value: reason || 'No reason provided' },
    )
    .setTimestamp();

  if (duration) embed.addFields({ name: 'Duration', value: duration });

  await logChannel.send({ embeds: [embed] }).catch(() => {});
}

module.exports = { logAction };
