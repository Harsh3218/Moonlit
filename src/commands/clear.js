const { logAction } = require('../utils/modlog');

module.exports = {
  name: 'clear',
  description: 'Delete messages in bulk (max 100)',
  usage: '!clear <amount>',
  permissions: ['ManageMessages'],
  async execute(message, args) {
    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount < 1 || amount > 100) {
      return message.reply('❌ Please provide a number between 1 and 100.');
    }

    await message.delete().catch(() => {});
    const deleted = await message.channel.bulkDelete(amount, true).catch(() => null);
    if (!deleted) return message.channel.send('❌ Could not delete messages (they may be older than 14 days).');

    const confirm = await message.channel.send(`✅ Deleted **${deleted.size}** message(s).`);
    setTimeout(() => confirm.delete().catch(() => {}), 4000);

    await logAction(message.guild, {
      action: 'Clear',
      target: `#${message.channel.name}`,
      moderator: message.author,
      reason: `Deleted ${deleted.size} messages`,
    });
  },
};
