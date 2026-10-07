const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

const dataPath = path.join(__dirname, '../../data/reactionRoles.json');

function load() {
  if (!fs.existsSync(dataPath)) return {};
  return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
}

function save(data) {
  fs.mkdirSync(path.dirname(dataPath), { recursive: true });
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: 'reactionrole',
  description: 'Set up reaction roles. Subcommands: create, add, remove, list',
  usage: '!reactionrole create <title> | !reactionrole add <msgId> <emoji> @role | !reactionrole remove <msgId> <emoji> | !reactionrole list',
  permissions: ['ManageRoles'],
  async execute(message, args) {
    const sub = args[0]?.toLowerCase();

    // --- CREATE a new reaction role message ---
    if (sub === 'create') {
      const title = args.slice(1).join(' ') || 'React to get a role!';

      const embed = new EmbedBuilder()
        .setTitle('🎭 ' + title)
        .setColor(0x5865F2)
        .setDescription('React below to receive your role.\n\n*(Roles will appear here as they are added)*')
        .setFooter({ text: 'React to assign/remove a role' });

      const msg = await message.channel.send({ embeds: [embed] });

      const data = load();
      data[msg.id] = {};
      save(data);

      message.reply(`✅ Reaction role message created! ID: \`${msg.id}\`\nNow add emojis with: \`!reactionrole add ${msg.id} <emoji> @role\``);
      return;
    }

    // --- ADD an emoji-role pair ---
    if (sub === 'add') {
      const msgId = args[1];
      const emojiRaw = args[2];
      const role = message.mentions.roles.first();

      if (!msgId || !emojiRaw || !role) {
        return message.reply('❌ Usage: `!reactionrole add <messageId> <emoji> @role`');
      }

      // Resolve emoji: custom vs unicode
      const customMatch = emojiRaw.match(/<a?:(\w+):(\d+)>/);
      const emojiKey = customMatch ? customMatch[2] : emojiRaw;

      // Fetch the target message
      let targetMsg;
      for (const channel of message.guild.channels.cache.values()) {
        if (!channel.isTextBased()) continue;
        try {
          targetMsg = await channel.messages.fetch(msgId);
          if (targetMsg) break;
        } catch {}
      }

      if (!targetMsg) return message.reply('❌ Could not find that message. Make sure the ID is correct.');

      const data = load();
      if (!data[msgId]) data[msgId] = {};
      data[msgId][emojiKey] = role.id;
      save(data);

      await targetMsg.react(emojiRaw).catch(() => {});

      // Update embed description
      const pairs = Object.entries(data[msgId]);
      const lines = await Promise.all(pairs.map(async ([e, rId]) => {
        const r = message.guild.roles.cache.get(rId);
        const emojiDisplay = message.guild.emojis.cache.get(e) ? `<:_:${e}>` : e;
        return `${emojiDisplay} → ${r ? r.toString() : 'Unknown Role'}`;
      }));

      const embed = EmbedBuilder.from(targetMsg.embeds[0])
        .setDescription('React below to receive your role.\n\n' + lines.join('\n'));
      await targetMsg.edit({ embeds: [embed] });

      message.reply(`✅ Added ${emojiRaw} → ${role} to message \`${msgId}\``);
      return;
    }

    // --- REMOVE an emoji-role pair ---
    if (sub === 'remove') {
      const msgId = args[1];
      const emojiRaw = args[2];
      if (!msgId || !emojiRaw) return message.reply('❌ Usage: `!reactionrole remove <messageId> <emoji>`');

      const customMatch = emojiRaw.match(/<a?:(\w+):(\d+)>/);
      const emojiKey = customMatch ? customMatch[2] : emojiRaw;

      const data = load();
      if (!data[msgId] || !data[msgId][emojiKey]) return message.reply('❌ That emoji-role pair does not exist.');

      delete data[msgId][emojiKey];
      save(data);

      message.reply(`✅ Removed ${emojiRaw} from message \`${msgId}\``);
      return;
    }

    // --- LIST all reaction role messages ---
    if (sub === 'list') {
      const data = load();
      const keys = Object.keys(data);
      if (!keys.length) return message.reply('📋 No reaction role messages set up yet.');

      const lines = keys.map(id => {
        const pairs = Object.entries(data[id]);
        const pairStr = pairs.length ? pairs.map(([e, r]) => `${e} → <@&${r}>`).join(', ') : 'No pairs';
        return `• \`${id}\`: ${pairStr}`;
      });

      message.reply({ content: '📋 **Reaction Role Messages:**\n' + lines.join('\n') });
      return;
    }

    message.reply('❌ Unknown subcommand. Use: `create`, `add`, `remove`, `list`');
  },
};
