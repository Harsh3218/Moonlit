const fs = require('fs');
const path = require('path');
const dataPath = path.join(__dirname, '../../data/reactionRoles.json');

module.exports = {
  name: 'messageReactionAdd',
  async execute(reaction, user, client) {
    if (user.bot) return;

    if (reaction.partial) { try { await reaction.fetch(); } catch { return; } }
    if (reaction.message.partial) { try { await reaction.message.fetch(); } catch { return; } }

    if (!fs.existsSync(dataPath)) return;
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    // Only care about reactions on the single panel message
    if (reaction.message.id !== data.messageId) return;

    const emojiKey = reaction.emoji.id ?? reaction.emoji.name;
    const roleId = data.pairs?.[emojiKey];
    if (!roleId) return;

    const guild = reaction.message.guild;
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return;

    const role = guild.roles.cache.get(roleId);
    if (!role) return;

    await member.roles.add(role).catch(err => console.error('[RR] Add role failed:', err.message));
  },
};
