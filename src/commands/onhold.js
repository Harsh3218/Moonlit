const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require('discord.js');

const ON_HOLD_ROLE_NAME = 'On Hold';

// Cooldown tracker for refresh button (per guild)
const refreshCooldowns = new Map();

function getAge(timestamp) {
  const ageDays = Math.floor((Date.now() - timestamp) / 86_400_000);
  const years = Math.floor(ageDays / 365);
  const months = Math.floor((ageDays % 365) / 30);
  const days = ageDays % 30;
  const parts = [];
  if (years > 0) parts.push(`${years}y`);
  if (months > 0) parts.push(`${months}mo`);
  if (days > 0 || parts.length === 0) parts.push(`${days}d`);
  return parts.join(' ');
}

function getRiskLevel(timestamp) {
  const ageDays = Math.floor((Date.now() - timestamp) / 86_400_000);
  if (ageDays < 7)  return { label: '🔴 Very New', color: 0xef4444 };
  if (ageDays < 30) return { label: '🟠 New',      color: 0xf97316 };
  if (ageDays < 90) return { label: '🟡 Recent',   color: 0xeab308 };
  return              { label: '🟢 Moderate',       color: 0x22c55e };
}

// Re-filter from cache — no rate-limited fetch
function getHeldFromCache(guild, holdRoleId) {
  return [...guild.members.cache.filter(m => m.roles.cache.has(holdRoleId)).values()];
}

function buildPage(heldMembers, page, totalPages) {
  const member = heldMembers[page];
  const risk = getRiskLevel(member.user.createdTimestamp);
  const accountAge = getAge(member.user.createdTimestamp);
  const joinedAge = getAge(member.joinedTimestamp);

  return new EmbedBuilder()
    .setColor(risk.color)
    .setAuthor({
      name: `🔒 On Hold Review — ${page + 1} of ${totalPages}`,
      iconURL: member.guild.iconURL({ size: 64 }),
    })
    .setTitle(member.user.tag)
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .setDescription(`${member} was automatically placed on hold due to a new account.\nReview and decide below.`)
    .addFields(
      {
        name: '👤 User Info',
        value: [`> **ID:** \`${member.id}\``, `> **Tag:** ${member.user.tag}`, `> **Bot:** ${member.user.bot ? 'Yes' : 'No'}`].join('\n'),
        inline: true,
      },
      {
        name: '📅 Account Age',
        value: [`> **Created:** ${accountAge} ago`, `> **Joined:** ${joinedAge} ago`, `> **Risk:** ${risk.label}`].join('\n'),
        inline: true,
      },
      {
        name: '🏠 Server Info',
        value: [`> **Member #${member.guild.memberCount}**`, `> **Roles:** ${member.roles.cache.size - 1}`].join('\n'),
        inline: true,
      },
    )
    .setFooter({ text: `Reviewed by a moderator  •  ${new Date().toLocaleDateString()}` })
    .setTimestamp();
}

function buildButtons(page, total, refreshOnCooldown = false) {
  const nav = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('prev').setLabel('◀ Prev').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
    new ButtonBuilder().setCustomId('counter').setLabel(`${page + 1} / ${total}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
    new ButtonBuilder().setCustomId('next').setLabel('Next ▶').setStyle(ButtonStyle.Secondary).setDisabled(page === total - 1),
  );

  const actions = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('release').setLabel('✅  Release User').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('kick').setLabel('👢  Kick').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('ban').setLabel('🔨  Ban').setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('refresh')
      .setLabel(refreshOnCooldown ? '🔄  Refresh (cooldown)' : '🔄  Refresh')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(refreshOnCooldown),
  );

  return [nav, actions];
}

module.exports = {
  name: 'onhold',
  description: 'Interactive On Hold user review panel',
  usage: '!onhold',
  permissions: ['ManageRoles'],

  async execute(message, args, client) {
    const holdRole = message.guild.roles.cache.find(r => r.name === ON_HOLD_ROLE_NAME);
    if (!holdRole) return message.reply(`❌ No role named **${ON_HOLD_ROLE_NAME}** found. Create it first.`);

    // Initial fetch once — populates cache
    await message.guild.members.fetch();
    let heldMembers = getHeldFromCache(message.guild, holdRole.id);

    if (!heldMembers.length) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x22c55e)
            .setTitle('✅ No Users On Hold')
            .setDescription('Everyone is cleared! No accounts are currently flagged.')
            .setTimestamp(),
        ],
      });
    }

    let page = 0;

    const sent = await message.reply({
      embeds: [buildPage(heldMembers, page, heldMembers.length)],
      components: buildButtons(page, heldMembers.length),
    });

    const collector = sent.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 5 * 60 * 1000,
      filter: i => i.user.id === message.author.id,
    });

    collector.on('collect', async interaction => {
      await interaction.deferUpdate();
      const id = interaction.customId;

      if (id === 'prev') {
        page = Math.max(0, page - 1);

      } else if (id === 'next') {
        page = Math.min(heldMembers.length - 1, page + 1);

      } else if (id === 'refresh') {
        // Rate limit guard: 15s cooldown per guild
        const lastRefresh = refreshCooldowns.get(message.guild.id) || 0;
        const remaining = 15000 - (Date.now() - lastRefresh);

        if (remaining > 0) {
          // Show cooldown button temporarily
          await sent.edit({ components: buildButtons(page, heldMembers.length, true) });
          setTimeout(() => {
            sent.edit({ components: buildButtons(page, heldMembers.length, false) }).catch(() => {});
          }, remaining);
          return;
        }

        refreshCooldowns.set(message.guild.id, Date.now());
        await message.guild.members.fetch(); // rate-safe: only runs after 15s gap
        heldMembers = getHeldFromCache(message.guild, holdRole.id);
        page = Math.min(page, Math.max(0, heldMembers.length - 1));
        if (!heldMembers.length) { collector.stop('empty'); return; }

      } else if (id === 'release') {
        const target = heldMembers[page];
        try { await target.roles.remove(holdRole, `Released by ${message.author.tag} via panel`); } catch {}
        heldMembers = getHeldFromCache(message.guild, holdRole.id);
        page = Math.min(page, Math.max(0, heldMembers.length - 1));
        if (!heldMembers.length) { collector.stop('empty'); return; }

        await sent.edit({
          embeds: [
            new EmbedBuilder().setColor(0x22c55e).setDescription(`✅ **${target.user.tag}** released.`).setTimestamp(),
            buildPage(heldMembers, page, heldMembers.length),
          ],
          components: buildButtons(page, heldMembers.length),
        });
        return;

      } else if (id === 'kick') {
        const target = heldMembers[page];
        try {
          await target.send(`👢 You have been kicked from **${message.guild.name}**. Your account is too new. You may rejoin when your account is older.`).catch(() => {});
          await target.kick('Kicked via On Hold panel — new account');
        } catch {}
        heldMembers = getHeldFromCache(message.guild, holdRole.id);
        page = Math.min(page, Math.max(0, heldMembers.length - 1));
        if (!heldMembers.length) { collector.stop('empty'); return; }

        await sent.edit({
          embeds: [
            new EmbedBuilder().setColor(0xf97316).setDescription(`👢 **${target.user.tag}** has been kicked.`).setTimestamp(),
            buildPage(heldMembers, page, heldMembers.length),
          ],
          components: buildButtons(page, heldMembers.length),
        });
        return;

      } else if (id === 'ban') {
        const target = heldMembers[page];
        try { await target.ban({ reason: 'Banned via On Hold panel — new account', deleteMessageSeconds: 86400 }); } catch {}
        heldMembers = getHeldFromCache(message.guild, holdRole.id);
        page = Math.min(page, Math.max(0, heldMembers.length - 1));
        if (!heldMembers.length) { collector.stop('empty'); return; }

        await sent.edit({
          embeds: [
            new EmbedBuilder().setColor(0xef4444).setDescription(`🔨 **${target.user.tag}** has been banned.`).setTimestamp(),
            buildPage(heldMembers, page, heldMembers.length),
          ],
          components: buildButtons(page, heldMembers.length),
        });
        return;
      }

      await sent.edit({
        embeds: [buildPage(heldMembers, page, heldMembers.length)],
        components: buildButtons(page, heldMembers.length),
      });
    });

    collector.on('end', async (_, reason) => {
      if (reason === 'empty') {
        await sent.edit({
          embeds: [new EmbedBuilder().setColor(0x22c55e).setTitle('✅ All Clear!').setDescription('No more users on hold. Great work!').setTimestamp()],
          components: [],
        }).catch(() => {});
      } else {
        const disabled = buildButtons(page, heldMembers.length).map(row => {
          row.components.forEach(btn => btn.setDisabled(true));
          return row;
        });
        await sent.edit({ components: disabled }).catch(() => {});
      }
    });
  },
};