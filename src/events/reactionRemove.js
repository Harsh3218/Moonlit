const fs = require('fs');
const path = require('path');
const dataPath = path.join(__dirname, '../../data/reactionRoles.json');

module.exports = {
  name: 'messageReactionRemove',
  async execute(reaction, user, client) {
    if (user.bot) return;

    if (reaction.partial) {
      try { await reaction.fetch(); } catch { return; }
    }
    if (reaction.message.partial) {
      try { await reaction.message.fetch(); } catch { return; }
    }

    if (!fs.existsSync(dataPath)) return;
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    const msgId = reaction.message.id;
    const emoji = reaction.emoji.id ? reaction.emoji.id : reaction.emoji.name;

    if (!data[msgId] || !data[msgId][emoji]) return;

    const guild = reaction.message.guild;
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return;

    const role = guild.roles.cache.get(data[msgId][emoji]);
    if (!role) return;

    try {
      await member.roles.remove(role);
    } catch (err) {
      console.error('Could not remove role:', err);
    }
  },
};
