const { EmbedBuilder } = require('discord.js');

const ON_HOLD_ROLE_NAME = 'On Hold'; // change this to your exact role name
const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000; // ~6 months in ms
const ALERT_CHANNEL_ID = '1553288328512798870';

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    const accountAge = Date.now() - member.user.createdTimestamp;
    const isNewAccount = accountAge < SIX_MONTHS_MS;

    if (!isNewAccount) return;

    // Find the On Hold role
    const holdRole = member.guild.roles.cache.find(r => r.name === ON_HOLD_ROLE_NAME);
    if (!holdRole) {
      console.warn(`[On Hold] Role "${ON_HOLD_ROLE_NAME}" not found in ${member.guild.name}`);
      return;
    }

    // Assign the role
    try {
      await member.roles.add(holdRole, 'Account younger than 6 months');
    } catch (err) {
      console.error('[On Hold] Failed to assign role:', err.message);
      return;
    }

    // Post alert in the channel
    const alertChannel = member.guild.channels.cache.get(ALERT_CHANNEL_ID);
    if (!alertChannel) return;

    const createdDaysAgo = Math.floor(accountAge / (1000 * 60 * 60 * 24));
    const createdMonths = Math.floor(createdDaysAgo / 30);
    const createdDaysRemainder = createdDaysAgo % 30;

    const ageString = createdMonths > 0
      ? `${createdMonths} month${createdMonths !== 1 ? 's' : ''} and ${createdDaysRemainder} day${createdDaysRemainder !== 1 ? 's' : ''}`
      : `${createdDaysAgo} day${createdDaysAgo !== 1 ? 's' : ''}`;

    const embed = new EmbedBuilder()
      .setTitle('⚠️ New Account Flagged')
      .setColor(0xf59e0b)
      .setThumbnail(member.user.displayAvatarURL({ size: 128 }))
      .setDescription(`${member} has been placed on hold automatically.`)
      .addFields(
        { name: '👤 User', value: `${member.user.tag} (${member.id})`, inline: true },
        { name: '📅 Account Age', value: ageString, inline: true },
        { name: '🔒 Role Assigned', value: holdRole.toString(), inline: true },
        { name: '📌 Reason', value: 'Account created less than 6 months ago' },
      )
      .setFooter({ text: 'Review and remove the role manually if the user is legitimate' })
      .setTimestamp();

    await alertChannel.send({ embeds: [embed] });
  },
};