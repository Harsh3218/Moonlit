module.exports = {
  name: 'slowmode',
  description: 'Set slowmode in the current channel (0 to disable, max 21600 seconds)',
  usage: '!slowmode <seconds>',
  permissions: ['ManageChannels'],
  async execute(message, args) {
    const seconds = parseInt(args[0]);
    if (isNaN(seconds) || seconds < 0 || seconds > 21600) {
      return message.reply('❌ Please provide a number between 0 and 21600.');
    }

    await message.channel.setRateLimitPerUser(seconds);

    if (seconds === 0) {
      message.reply('✅ Slowmode disabled.');
    } else {
      message.reply(`✅ Slowmode set to **${seconds}** second(s).`);
    }
  },
};
