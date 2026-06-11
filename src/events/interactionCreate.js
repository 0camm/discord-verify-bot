const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require('discord.js');
const { checkRateLimit, storeKey, validateKey, KEY_EXPIRY_MS } = require('../utils/keyStore');
const { dmKeyEmbed, successEmbed, errorEmbed, warnEmbed } = require('../utils/embeds');
const logger = require('../utils/logger');

const VERIFIED_ROLE_ID   = process.env.VERIFIED_ROLE_ID   || '1514732060856549437';
const UNVERIFIED_ROLE_ID = process.env.UNVERIFIED_ROLE_ID || '1514733536622415972';

module.exports = {
  name: 'interactionCreate',

  async execute(interaction, client) {

    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (err) {
        logger.error(`Error executing /${interaction.commandName}: ${err.message}`);
        const msg = { embeds: [errorEmbed('Command Error', 'Something went wrong. Please try again later.')], ephemeral: true };
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply(msg).catch(() => {});
        } else {
          await interaction.reply(msg).catch(() => {});
        }
      }
      return;
    }

    if (interaction.isButton() && interaction.customId === 'generate_key') {
      await interaction.deferReply({ ephemeral: true });
      const userId = interaction.user.id;
      const guild  = interaction.guild;
      const rl = checkRateLimit(userId);
      if (rl.limited) {
        const minutesLeft = Math.ceil(rl.remainingMs / 60000);
        return interaction.editReply({
          embeds: [warnEmbed('Too Many Requests', `You've requested too many keys recently. Please wait **${minutesLeft} minute(s)** before trying again.`)],
        });
      }
      const key = storeKey(userId, guild.id);
      const expiryMinutes = Math.round(KEY_EXPIRY_MS / 60000);
      try {
        const dmChannel = await interaction.user.createDM();
        await dmChannel.send({ embeds: [dmKeyEmbed(key, expiryMinutes, guild.name)] });
        logger.info(`Key sent via DM to ${interaction.user.tag} (${userId})`);
        await interaction.editReply({
          embeds: [{
            color: 0x5865F2,
            title: '📬  Key Sent!',
            description: `Check your **Direct Messages** — your key is waiting there.\n\nOnce you have it, click the **Submit Key** button on the panel.\n\n⏳  The key expires in **${expiryMinutes} minutes**.`,
            footer: { text: "Can't see the DM? Enable DMs from Server Members in Privacy Settings." },
            timestamp: new Date().toISOString(),
          }],
        });
      } catch (err) {
        logger.warn(`Could not DM ${interaction.user.tag}: ${err.message}`);
        return interaction.editReply({
          embeds: [errorEmbed('DM Failed', 'I couldn\'t send you a Direct Message.\n\n> Right-click the server icon → **Privacy Settings** → turn on **Direct Messages**\n\nThen click **Generate Key** again.')],
        });
      }
      return;
    }

    if (interaction.isButton() && interaction.customId === 'submit_key') {
      const modal = new ModalBuilder()
        .setCustomId('verify_modal')
        .setTitle('Enter Your Verification Key');
      const keyInput = new TextInputBuilder()
        .setCustomId('key_input')
        .setLabel('Verification Key')
        .setPlaceholder('XXXX-XXXX-XXXX-XXXX')
        .setStyle(TextInputStyle.Short)
        .setMinLength(4)
        .setMaxLength(20)
        .setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(keyInput));
      await interaction.showModal(modal);
      return;
    }

    if (interaction.isModalSubmit() && interaction.customId === 'verify_modal') {
      await interaction.deferReply({ ephemeral: true });
      const submittedKey = interaction.fields.getTextInputValue('key_input');
      const userId = interaction.user.id;
      const guild  = interaction.guild;
      const result = validateKey(userId, submittedKey);
      if (!result.valid) {
        logger.warn(`Failed verification by ${interaction.user.tag} (${userId}): ${result.reason}`);
        return interaction.editReply({ embeds: [errorEmbed('Verification Failed', result.reason)] });
      }
      try {
        const member = await guild.members.fetch(userId);
        const role   = guild.roles.cache.get(VERIFIED_ROLE_ID);
        if (!role) {
          logger.error(`Verified role ${VERIFIED_ROLE_ID} not found in guild ${guild.id}`);
          return interaction.editReply({ embeds: [errorEmbed('Configuration Error', 'Verified role not found. Please contact an admin.')] });
        }
        const unverifiedRole = guild.roles.cache.get(UNVERIFIED_ROLE_ID);
        await member.roles.add(role);
        if (unverifiedRole && member.roles.cache.has(UNVERIFIED_ROLE_ID)) {
          await member.roles.remove(unverifiedRole);
        }
        logger.info(`User ${interaction.user.tag} (${userId}) successfully verified in guild ${guild.id}`);
        return interaction.editReply({ embeds: [successEmbed('Verified!', `Welcome to **${guild.name}**! You now have full access. 🎉`)] });
      } catch (err) {
        logger.error(`Error assigning role to ${userId}: ${err.message}`);
        return interaction.editReply({ embeds: [errorEmbed('Error', `Failed to assign your role: ${err.message}`)] });
      }
    }
  },
};
