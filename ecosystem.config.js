module.exports = {
  apps: [{
    name: 'servSync-backend',
    script: './server.js',
    cwd: '/var/www/ServSync/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/pm2/servSync-error.log',
    out_file: '/var/log/pm2/servSync-out.log',
    log_file: '/var/log/pm2/servSync-combined.log',
    time: true
  }]
};