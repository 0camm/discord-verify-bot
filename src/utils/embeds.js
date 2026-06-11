const { EmbedBuilder } = require('discord.js');

const BRAND_COLOR  = 0x5865F2; // Discord Blurple
const SUCCESS_COLOR = 0x57F287; // Green
const ERROR_COLOR   = 0xED4245; // Red
const WARN_COLOR    = 0xFEE75C; // Yellow

function verificationPanelEmbed() {
  return new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle('🔐  Server Verification')
    .setDescription(
      '**Welcome!** To gain access to this server, you need to verify that you are a human.\n\n' +
      '**How it works:**\n' +
      '> **1.** Click the **Generate Key** button below.\n' +
      '> **2.** The bot will send you a unique key via **Direct Message**.\n' +
      '> **3.** Come back here and run `/verify <your-key>` in any channel.\n' +
      '> **4.** Once verified, you\'ll receive full server access automatically.\n\n' +
      '⚠️  Keys expire after **10 minutes** and can only be used **once**.\n' +
      '🔒  Make sure your DMs are open — right-click the server icon → **Privacy Settings** → enable **Direct Messages**.'
    )
    .setFooter({ text: 'Verification System • Keys are single-use and time-limited' })
    .setTimestamp();
}

function dmKeyEmbed(key, expiryMinutes, guildName) {
  return new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle('🔑  Your Verification Key')
    .setDescription(
      `Here is your one-time verification key for **${guildName}**:\n\n` +
      `\`\`\`\n${key}\n\`\`\`\n` +
      `Run the following command in the server:\n` +
      `> \`/verify ${key}\`\n\n` +
      `⏳  This key expires in **${expiryMinutes} minutes**.\n` +
      `⚠️  Do **not** share this key with anyone.`
    )
    .setFooter({ text: 'If you did not request this key, you can ignore this message.' })
    .setTimestamp();
}

function successEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(SUCCESS_COLOR)
    .setTitle(`✅  ${title}`)
    .setDescription(description)
    .setTimestamp();
}

function errorEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(ERROR_COLOR)
    .setTitle(`❌  ${title}`)
    .setDescription(description)
    .setTimestamp();
}

function warnEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(WARN_COLOR)
    .setTitle(`⚠️  ${title}`)
    .setDescription(description)
    .setTimestamp();
}

module.exports = { verificationPanelEmbed, dmKeyEmbed, successEmbed, errorEmbed, warnEmbed };
