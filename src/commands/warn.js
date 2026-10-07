const fs = require('fs');
const path = require('path');
const { logAction } = require('../utils/modlog');

const dataPath = path.join(__dirname, '../../data/warnings.json');

function loadWarnings() {
  if (!fs.existsSync(dataPath)) return {};
  return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
}

function saveWarnings(data) {
  fs.mkdirSync(path.dirname(dataPath), { recursive: true });
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: 'warn',
  description: 'Warn a member',
  usage: '!warn @user [reason]',
  permissions: ['ModerateMembers'],
  async execute(message, args) {
    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Please mention a user to warn.');

    const reason = args.slice(1).join(' ') || 'No reason provided';

    const warnings = loadWarnings();
    const key = `${message.guild.id}-${target.id}`;
    if (!warnings[key]) warnings[key] = [];
    warnings[key].push({ reason, moderator: message.author.id, timestamp: Date.now() });
    saveWarnings(warnings);

    const count = warnings[key].length;
    await message.reply(`⚠️ **${target.user.tag}** has been warned. (${count} total warning${count !== 1 ? 's' : ''})\nReason: ${reason}`);

    try {
      await target.send(`⚠️ You have been warned in **${message.guild.name}**.\nReason: ${reason}\nTotal warnings: ${count}`);
    } catch {}

    await logAction(message.guild, {
      action: 'Warn',
      target: target.user,
      moderator: message.author,
      reason,
    });
  },
};
