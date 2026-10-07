module.exports = {
  name: 'unlock',
  description: 'Unlock the current channel',
  usage: '!unlock',
  permissions: ['ManageChannels'],
  async execute(message) {
    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
      SendMessages: null,
    });
    message.reply('🔓 Channel unlocked.');
  },
};
