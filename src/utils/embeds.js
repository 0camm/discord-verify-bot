const { EmbedBuilder } = require('discord.js');

const BRAND_COLOR   = 0x5865F2;
const SUCCESS_COLOR = 0x57F287;
const ERROR_COLOR   = 0xED4245;
const WARN_COLOR    = 0xFEE75C;

function verificationPanelEmbed() {
  return new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle('Verification Required')
    .setDescription(
      'To gain access to this server, you must complete a one-time verification.\n\n' +
      '**1.** Press **Generate Key** — a unique code will be sent to your Direct Messages.\n' +
      '**2.** Open the DM, copy your code, then press **Submit Key**.\n' +
      '**3.** Paste the code into the prompt and submit.\n\n' +
      'Access is granted instantly upon successful verification.'
    )
    .addFields(
      { name: 'Code Expiry', value: '10 minutes', inline: true },
      { name: 'Single Use', value: 'Yes', inline: true },
      { name: 'DMs Required', value: 'Yes', inline: true }
    )
    .setFooter({ text: 'If you did not attempt to join this server, disregard this message.' })
    .setTimestamp();
}

function dmKeyEmbed(key, expiryMinutes, guildName) {
  return new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle('Your Verification Code')
    .setDescription(
      `You requested a verification code for **${guildName}**.\n\n` +
      `**PC** — click the box to copy:\n` +
      `\`\`\`${key}\`\`\`\n` +
      `**Mobile** — tap and hold to copy:\n` +
      `\`${key}\`\n\n` +
      `Return to the server and press **Submit Key**, then paste the code when prompted.\n\n` +
      `This code expires in **${expiryMinutes} minutes** and can only be used once.`
    )
    .setFooter({ text: 'If you did not request this, you can safely ignore this message.' })
    .setTimestamp();
}

function successEmbed(title, description) {
  return new EmbedBuilder().setColor(SUCCESS_COLOR).setTitle(title).setDescription(description).setTimestamp();
}

function errorEmbed(title, description) {
  return new EmbedBuilder().setColor(ERROR_COLOR).setTitle(title).setDescription(description).setTimestamp();
}

function warnEmbed(title, description) {
  return new EmbedBuilder().setColor(WARN_COLOR).setTitle(title).setDescription(description).setTimestamp();
}

module.exports = { verificationPanelEmbed, dmKeyEmbed, successEmbed, errorEmbed, warnEmbed };
