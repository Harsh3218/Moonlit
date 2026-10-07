require('dotenv').config();

module.exports = {
  token: process.env.BOT_TOKEN,
  prefix: process.env.PREFIX || '!',
  modLogChannel: process.env.MOD_LOG_CHANNEL || 'mod-logs',
};
