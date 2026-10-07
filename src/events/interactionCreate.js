const fs = require('fs');
const path = require('path');
const dataPath = path.join(__dirname, '../../data/reactionRoles.json');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // ── Reaction Role Buttons ──
    if (interaction.isButton() && interaction.customId.startsWith('rr_')) {
      await interaction.deferReply({ ephemeral: true });

      if (!fs.existsSync(dataPath)) return interaction.editReply({ content: '❌ No roles configured.' });
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

      const emojiKey = interaction.customId.replace('rr_', '');
      const roleId = data.pairs?.[emojiKey];
      if (!roleId) return interaction.editReply({ content: '❌ This role no longer exists.' });

      const role = interaction.guild.roles.cache.get(roleId);
      if (!role) return interaction.editReply({ content: '❌ Role not found in server.' });

      const member = interaction.member;
      const hasRole = member.roles.cache.has(roleId);

      if (hasRole) {
        await member.roles.remove(role);
        return interaction.editReply({
          content: `✅ Removed **${role.name}** from your roles.`,
        });
      } else {
        await member.roles.add(role);
        return interaction.editReply({
          content: `🎉 You now have the **${role.name}** role!`,
        });
      }
    }

    // ── Prefix commands (handled in messageCreate) ──
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands?.get(interaction.commandName);
    if (!command) return;
    try { await command.execute(interaction, [], client); }
    catch (err) { console.error(err); }
  },
};
