const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

module.exports = {
  name: 'ready',
  once: true,

  async execute(client) {
    logger.info(`Logged in as ${client.user.tag} (${client.user.id})`);
    client.user.setPresence({
      activities: [{ name: 'for /verify', type: 3 }], // type 3 = Watching
      status: 'online',
    });

    // Register slash commands globally
    const commands = [];
    const commandsPath = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

    for (const file of commandFiles) {
      const command = require(path.join(commandsPath, file));
      if (command.data) commands.push(command.data.toJSON());
    }

    const rest = new REST().setToken(process.env.BOT_TOKEN);

    try {
      logger.info(`Registering ${commands.length} slash command(s)...`);
      await rest.put(
        Routes.applicationCommands(client.user.id),
        { body: commands }
      );
      logger.info('Slash commands registered successfully.');
    } catch (err) {
      logger.error(`Failed to register slash commands: ${err.message}`);
    }
  },
};
