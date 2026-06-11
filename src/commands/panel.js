const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} = require('discord.js');
const { verificationPanelEmbed } = require('../utils/embeds');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Send the verification panel to a channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option.setName('channel').setDescription('The channel to send the panel to.').addChannelTypes(ChannelType.GuildText).setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const channel = interaction.options.getChannel('channel');
    const botMember = interaction.guild.members.me;
    if (!channel.permissionsFor(botMember).has(['SendMessages', 'EmbedLinks'])) {
      return interaction.editReply({ content: `❌ I don't have permission to send messages in ${channel}.` });
    }
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('generate_key').setLabel('Generate Key').setStyle(ButtonStyle.Primary).setEmoji('🔑'),
      new ButtonBuilder().setCustomId('submit_key').setLabel('Submit Key').setStyle(ButtonStyle.Success).setEmoji('✅')
    );
    try {
      await channel.send({ embeds: [verificationPanelEmbed()], components: [row] });
      logger.info(`Panel sent to #${channel.name} by ${interaction.user.tag}`);
      await interaction.editReply({ content: `✅ Verification panel sent to ${channel}.` });
    } catch (err) {
      logger.error(`Failed to send panel: ${err.message}`);
      await interaction.editReply({ content: `❌ Failed to send panel: ${err.message}` });
    }
  },
};
