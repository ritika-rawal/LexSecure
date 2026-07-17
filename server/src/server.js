import app from './app.js';
import { appConfig } from './config/app.config.js';

const server = app.listen(appConfig.port, () => {
  console.log(`LexSecure API listening on port ${appConfig.port}`);
});

const shutdown = (signal) => {
  console.log(`${signal} received. Closing LexSecure API server.`);

  server.close(() => {
    console.log('LexSecure API server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
