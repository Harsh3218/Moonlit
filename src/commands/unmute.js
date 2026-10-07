const { logAction } = require('../utils/modlog');

module.exports = {
  name: 'unmute',
  description: 'Remove timeout from a member',
  usage: '!unmute @user [reason]',
  permissions: ['ModerateMembers'],
  async execute(message, args) {
    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Please mention a user to unmute.');

    const reason = args.slice(1).join(' ') || 'No reason provided';

    await target.timeout(null, reason);
    await message.reply(`✅ **${target.user.tag}** has been unmuted.`);

    await logAction(message.guild, {
      action: 'Unmute',
      target: target.user,
      moderator: message.author,
      reason,
    });
  },
};
