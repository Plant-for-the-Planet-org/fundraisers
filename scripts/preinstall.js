if (process.env.npm_command === 'install') {
  console.error('Use npm ci instead of npm install. See README.');
  process.exit(1);
}
