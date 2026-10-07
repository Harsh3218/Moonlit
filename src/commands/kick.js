const { logAction } = require('../utils/modlog');

module.exports = {
  name: 'kick',
  description: 'Kick a member from the server',
  usage: '!kick @user [reason]',
  permissions: ['KickMembers'],
  async execute(message, args) {
    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Please mention a user to kick.');
    if (!target.kickable) return message.reply('❌ I cannot kick that user.');
    if (target.id === message.author.id) return message.reply('❌ You cannot kick yourself.');

    const reason = args.slice(1).join(' ') || 'No reason provided';

    await target.kick(reason);
    await message.reply(`✅ **${target.user.tag}** has been kicked. Reason: ${reason}`);

    await logAction(message.guild, {
      action: 'Kick',
      target: target.user,
      moderator: message.author,
      reason,
    });
  },
};
