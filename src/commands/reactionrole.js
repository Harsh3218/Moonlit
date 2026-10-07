const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const dataPath = path.join(__dirname, '../../data/reactionRoles.json');
const PANEL_CHANNEL_ID = '1551841211566792784';

// Banner image — replace this URL with your own if you want a custom one
const BANNER_URL = 'https://cdn.discordapp.com/attachments/1553648555003224134/1557273785202245652/Icy_Crystal_Reaction_Role_Banner.png?backend=b2&ex=6ac733bb&is=6ac5e23b&hm=8225ea9ea710bedc0396f50ac6d86591fdf101375dd5e7a4095297548ab8c3a3&';

function load() {
  if (!fs.existsSync(dataPath)) return {};
  return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
}

function save(data) {
  fs.mkdirSync(path.dirname(dataPath), { recursive: true });
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

function buildEmbed(guild, data) {
  const pairs = data.pairs || {};
  const entries = Object.entries(pairs);

  const roleLines = entries.length === 0
    ? '*No roles yet — check back soon!*'
    : entries.map(([emojiKey, roleId]) => {
        const role = guild.roles.cache.get(roleId);
        const customEmoji = guild.emojis.cache.get(emojiKey);
        const emojiDisplay = customEmoji ? `<:${customEmoji.name}:${emojiKey}>` : emojiKey;
        return `${emojiDisplay} **${role ? role.name : 'Unknown Role'}**`;
      }).join('   ·   ');

  return new EmbedBuilder()
    .setColor(0x5865F2)
    .setImage(BANNER_URL)
    .setTitle('🌸  Welcome to the Neighbourhood!')
    .setDescription(
      [
        "We're a chill community — hang out, chat, play games, and make yourself at home.",
        'Pick the roles that fit you below and dive right in. 🎉',
        '',
        '**Roles? Yeah, we got those.**',
        roleLines,
      ].join('\n')
    )
    .setFooter({
      text: `React below to get a role  ·  ${guild.name}`,
      iconURL: guild.iconURL({ size: 32 }),
    });
}

function buildButtons(guild, data) {
  const pairs = data.pairs || {};
  const entries = Object.entries(pairs);
  if (!entries.length) return [];

  // Discord allows max 5 buttons per row, max 5 rows = 25 buttons
  const rows = [];
  for (let i = 0; i < Math.min(entries.length, 25); i += 5) {
    const row = new ActionRowBuilder();
    const chunk = entries.slice(i, i + 5);
    for (const [emojiKey, roleId] of chunk) {
      const role = guild.roles.cache.get(roleId);
      const customEmoji = guild.emojis.cache.get(emojiKey);
      const emojiDisplay = customEmoji
        ? { id: emojiKey, name: customEmoji.name }
        : emojiKey;

      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`rr_${emojiKey}`)
          .setLabel(role ? role.name : 'Unknown')
          .setEmoji(emojiDisplay)
          .setStyle(ButtonStyle.Secondary)
      );
    }
    rows.push(row);
  }
  return rows;
}

async function fetchPanelMsg(guild, data) {
  if (!data.messageId) return null;
  const channel = guild.channels.cache.get(PANEL_CHANNEL_ID);
  if (!channel) return null;
  try { return await channel.messages.fetch(data.messageId); }
  catch { return null; }
}

async function syncPanel(guild) {
  const data = load();
  const channel = guild.channels.cache.get(PANEL_CHANNEL_ID);
  if (!channel) return console.warn('[RR] Panel channel not found:', PANEL_CHANNEL_ID);

  const embed = buildEmbed(guild, data);
  const components = buildButtons(guild, data);
  let panelMsg = await fetchPanelMsg(guild, data);

  if (panelMsg) {
    await panelMsg.edit({ embeds: [embed], components });
  } else {
    panelMsg = await channel.send({ embeds: [embed], components });
    try { await panelMsg.pin(); } catch {}
    data.messageId = panelMsg.id;
    save(data);
  }
}

module.exports = {
  name: 'reactionrole',
  description: 'One-embed button-based role panel',
  usage: '!reactionrole setup | !reactionrole add <emoji> @role | !reactionrole remove <emoji> | !reactionrole list',
  permissions: ['ManageRoles'],
  syncPanel,

  async execute(message, args) {
    const sub = args[0]?.toLowerCase();

    if (sub === 'setup') {
      const data = load();
      delete data.messageId;
      save(data);
      await syncPanel(message.guild);
      const ch = message.guild.channels.cache.get(PANEL_CHANNEL_ID);
      return message.reply(`✅ Panel posted in ${ch}!`);
    }

    if (sub === 'add') {
      const emojiRaw = args[1];
      const role = message.mentions.roles.first();
      if (!emojiRaw || !role) return message.reply('❌ Usage: `!reactionrole add <emoji> @role`');

      const customMatch = emojiRaw.match(/<a?:(\w+):(\d+)>/);
      const emojiKey = customMatch ? customMatch[2] : emojiRaw;

      const data = load();
      if (!data.pairs) data.pairs = {};
      if (data.pairs[emojiKey]) return message.reply(`❌ ${emojiRaw} is already used.`);

      data.pairs[emojiKey] = role.id;
      save(data);
      await syncPanel(message.guild);
      return message.reply(`✅ Added ${emojiRaw} → ${role} — panel updated!`);
    }

    if (sub === 'remove') {
      const emojiRaw = args[1];
      if (!emojiRaw) return message.reply('❌ Usage: `!reactionrole remove <emoji>`');

      const customMatch = emojiRaw.match(/<a?:(\w+):(\d+)>/);
      const emojiKey = customMatch ? customMatch[2] : emojiRaw;

      const data = load();
      if (!data.pairs?.[emojiKey]) return message.reply(`❌ No mapping for ${emojiRaw}.`);

      delete data.pairs[emojiKey];
      save(data);
      await syncPanel(message.guild);
      return message.reply(`✅ Removed ${emojiRaw} — panel updated!`);
    }

    if (sub === 'list') {
      const data = load();
      const pairs = data.pairs || {};
      const entries = Object.entries(pairs);
      if (!entries.length) return message.reply('📋 No reaction roles set up yet.');

      const lines = entries.map(([emojiKey, roleId]) => {
        const emoji = message.guild.emojis.cache.get(emojiKey) ? `<:_:${emojiKey}>` : emojiKey;
        return `${emoji} → <@&${roleId}>`;
      });

      return message.reply({
        embeds: [new EmbedBuilder().setTitle('📋 Reaction Roles').setColor(0x5865F2).setDescription(lines.join('\n'))]
      });
    }

    message.reply('❌ Subcommands: `setup` · `add <emoji> @role` · `remove <emoji>` · `list`');
  },
};
