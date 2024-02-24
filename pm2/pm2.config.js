module.exports = {
  apps : [{
    name: 'TJ',
    cwd: '..',
    script: 'index.js',
    log_file: 'pm2/production.log',
    node_args: '--env-file .env.production',
    time: true,
  }, {
    name: 'Dev',
    cwd: '..',
    script: 'index.js',
    log_file: 'pm2/development.log',
    node_args: '--env-file .env',
    watch: true,
    ignore_watch: [
      'node_modules',
      'data',
      'scripts',
      'pm2',
      '.git',
      '.gitignore',
      'LICENSE',
      'README.md',
      '.env.production',
    ],
  }],
};