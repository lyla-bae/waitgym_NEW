module.exports = {
  apps: [
    {
      name: 'waitgym-be',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
    },
  ],
}
