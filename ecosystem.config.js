module.exports = {
  apps: [
    {
      name: 'discord-verify-bot',
      script: 'src/index.js',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000, // wait 5s before restarting
      env: {
        NODE_ENV: 'production',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      merge_logs: true,
    },
  ],
};
