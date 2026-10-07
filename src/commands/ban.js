const { logAction } = require('../utils/modlog');

module.exports = {
  name: 'ban',
  description: 'Ban a member from the server',
  usage: '!ban @user [reason]',
  permissions: ['BanMembers'],
  async execute(message, args) {
    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Please mention a user to ban.');
    if (!target.bannable) return message.reply('❌ I cannot ban that user.');
    if (target.id === message.author.id) return message.reply('❌ You cannot ban yourself.');

    const reason = args.slice(1).join(' ') || 'No reason provided';

    await target.ban({ reason, deleteMessageSeconds: 86400 });

    await message.reply(`✅ **${target.user.tag}** has been banned. Reason: ${reason}`);

    await logAction(message.guild, {
      action: 'Ban',
      target: target.user,
      moderator: message.author,
      reason,
    });
  },
};
