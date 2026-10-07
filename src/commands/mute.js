const { logAction } = require('../utils/modlog');

const TIME_UNITS = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

function parseDuration(str) {
  const match = str?.match(/^(\d+)([smhd])$/);
  if (!match) return null;
  return parseInt(match[1]) * TIME_UNITS[match[2]];
}

module.exports = {
  name: 'mute',
  description: 'Timeout (mute) a member. Duration: 10s, 5m, 2h, 1d',
  usage: '!mute @user <duration> [reason]',
  permissions: ['ModerateMembers'],
  async execute(message, args) {
    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Please mention a user to mute.');

    const durationStr = args[1];
    const ms = parseDuration(durationStr);
    if (!ms) return message.reply('❌ Invalid duration. Use formats like `10s`, `5m`, `2h`, `1d`.');
    if (ms > 28 * 86_400_000) return message.reply('❌ Max timeout is 28 days.');

    const reason = args.slice(2).join(' ') || 'No reason provided';

    await target.timeout(ms, reason);
    await message.reply(`✅ **${target.user.tag}** has been muted for **${durationStr}**. Reason: ${reason}`);

    await logAction(message.guild, {
      action: 'Mute',
      target: target.user,
      moderator: message.author,
      reason,
      duration: durationStr,
    });
  },
};
