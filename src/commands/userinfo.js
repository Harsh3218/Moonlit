const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'userinfo',
  description: 'Show info about a user',
  usage: '!userinfo [@user]',
  async execute(message, args) {
    const target = message.mentions.members.first() || message.member;

    const roles = target.roles.cache
      .filter(r => r.id !== message.guild.id)
      .sort((a, b) => b.position - a.position)
      .map(r => r.toString())
      .slice(0, 10);

    const embed = new EmbedBuilder()
      .setTitle(`👤 ${target.user.tag}`)
      .setThumbnail(target.user.displayAvatarURL({ size: 256 }))
      .setColor(target.displayHexColor || 0x5865F2)
      .addFields(
        { name: 'User ID', value: target.id, inline: true },
        { name: 'Nickname', value: target.nickname || 'None', inline: true },
        { name: 'Bot', value: target.user.bot ? 'Yes' : 'No', inline: true },
        { name: 'Account Created', value: `<t:${Math.floor(target.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Joined Server', value: `<t:${Math.floor(target.joinedTimestamp / 1000)}:R>`, inline: true },
        { name: `Roles (${target.roles.cache.size - 1})`, value: roles.join(', ') || 'None' },
      )
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
