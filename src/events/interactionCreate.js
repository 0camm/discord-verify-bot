const { checkRateLimit, storeKey, KEY_EXPIRY_MS } = require('../utils/keyStore');
const { dmKeyEmbed, errorEmbed, warnEmbed } = require('../utils/embeds');
const logger = require('../utils/logger');

module.exports = {
  name: 'interactionCreate',

  async execute(interaction, client) {
    // ─── Slash Commands ────────────────────────────────────────────────
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

    // ─── Button: Generate Key ──────────────────────────────────────────
    if (interaction.isButton() && interaction.customId === 'generate_key') {
      await interaction.deferReply({ ephemeral: true });

      const userId = interaction.user.id;
      const guild  = interaction.guild;

      // Rate limit check
      const rl = checkRateLimit(userId);
      if (rl.limited) {
        const minutesLeft = Math.ceil(rl.remainingMs / 60000);
        return interaction.editReply({
          embeds: [warnEmbed(
            'Too Many Requests',
            `You've requested too many keys recently. Please wait **${minutesLeft} minute(s)** before trying again.`
          )],
        });
      }

      // Generate & store key
      const key = storeKey(userId, guild.id);
      const expiryMinutes = Math.round(KEY_EXPIRY_MS / 60000);

      // Send DM
      try {
        const dmChannel = await interaction.user.createDM();
        await dmChannel.send({ embeds: [dmKeyEmbed(key, expiryMinutes, guild.name)] });
        logger.info(`Key sent via DM to ${interaction.user.tag} (${userId})`);

        await interaction.editReply({
          embeds: [
            {
              color: 0x5865F2,
              title: '📬  Key Sent!',
              description:
                `Check your **Direct Messages** from me — your key is waiting there.\n\n` +
                `Then come back and run:\n\`/verify <your-key>\`\n\n` +
                `⏳  The key expires in **${expiryMinutes} minutes**.`,
              footer: { text: 'Can\'t see the DM? Enable DMs from Server Members in Privacy Settings.' },
              timestamp: new Date().toISOString(),
            },
          ],
        });
      } catch (err) {
        logger.warn(`Could not DM ${interaction.user.tag}: ${err.message}`);
        return interaction.editReply({
          embeds: [errorEmbed(
            'DM Failed',
            'I couldn\'t send you a Direct Message. Please enable DMs from Server Members:\n\n' +
            '> Right-click the server icon → **Privacy Settings** → turn on **Direct Messages**\n\n' +
            'Then click **Generate Key** again.'
          )],
        });
      }
    }
  },
};
