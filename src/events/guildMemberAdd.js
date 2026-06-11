const logger = require('../utils/logger');

const UNVERIFIED_ROLE_ID = process.env.UNVERIFIED_ROLE_ID || '1514733536622415972';

module.exports = {
  name: 'guildMemberAdd',

  async execute(member) {
    try {
      const role = member.guild.roles.cache.get(UNVERIFIED_ROLE_ID);

      if (!role) {
        logger.warn(`Unverified role ${UNVERIFIED_ROLE_ID} not found in guild ${member.guild.id}. Skipping auto-role.`);
        return;
      }

      await member.roles.add(role);
      logger.info(`Auto-role assigned to new member ${member.user.tag} (${member.id}) in guild ${member.guild.id}`);
    } catch (err) {
      logger.error(`Failed to assign auto-role to ${member.user.tag}: ${err.message}`);
    }
  },
};
