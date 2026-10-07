module.exports = {
  name: 'lock',
  description: 'Lock the current channel (prevent @everyone from sending messages)',
  usage: '!lock',
  permissions: ['ManageChannels'],
  async execute(message) {
    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
      SendMessages: false,
    });
    message.reply('🔒 Channel locked. Only staff can send messages.');
  },
};
