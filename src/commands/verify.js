const { SlashCommandBuilder } = require('discord.js');
const { validateKey } = require('../utils/keyStore');
const { successEmbed, errorEmbed } = require('../utils/embeds');
const logger = require('../utils/logger');

const VERIFIED_ROLE_ID   = process.env.VERIFIED_ROLE_ID   || '1514732060856549437';
const UNVERIFIED_ROLE_ID = process.env.UNVERIFIED_ROLE_ID || '1514733536622415972';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Submit your verification key to gain access.')
    .addStringOption(option =>
      option
        .setName('key')
        .setDescription('Your verification key (sent to you via DM).')
        .setRequired(true)
        .setMinLength(4)
        .setMaxLength(20)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const submittedKey = interaction.options.getString('key');
    const userId = interaction.user.id;
    const guild  = interaction.guild;

    if (!guild) {
      return interaction.editReply({ embeds: [errorEmbed('Server Only', 'This command must be used inside a server.')] });
    }

    const result = validateKey(userId, submittedKey);

    if (!result.valid) {
      logger.warn(`Failed verification attempt by ${interaction.user.tag} (${userId}): ${result.reason}`);
      return interaction.editReply({
        embeds: [errorEmbed('Verification Failed', result.reason)],
      });
    }

    // Assign verified role
    try {
      const member = await guild.members.fetch(userId);
      const role   = guild.roles.cache.get(VERIFIED_ROLE_ID);

      if (!role) {
        logger.error(`Verified role ${VERIFIED_ROLE_ID} not found in guild ${guild.id}`);
        return interaction.editReply({
          embeds: [errorEmbed('Configuration Error', 'Verified role not found. Please contact an admin.')],
        });
      }

      // Add verified role and remove unverified role atomically
      const unverifiedRole = guild.roles.cache.get(UNVERIFIED_ROLE_ID);
      await member.roles.add(role);
      if (unverifiedRole && member.roles.cache.has(UNVERIFIED_ROLE_ID)) {
        await member.roles.remove(unverifiedRole);
      }
      logger.info(`User ${interaction.user.tag} (${userId}) successfully verified in guild ${guild.id}`);

      return interaction.editReply({
        embeds: [successEmbed('Verified!', `Welcome to **${guild.name}**! You now have full access to the server. Enjoy your stay! 🎉`)],
      });
    } catch (err) {
      logger.error(`Error assigning verified role to ${userId}: ${err.message}`);
      return interaction.editReply({
        embeds: [errorEmbed('Error', `Failed to assign your role: ${err.message}`)],
      });
    }
  },
};
