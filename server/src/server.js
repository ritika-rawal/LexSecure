import app from './app.js';
import { appConfig } from './config/app.config.js';
import { connectDatabase, disconnectDatabase } from './config/database.config.js';

let server;

const startServer = async () => {
  try {
    await connectDatabase();

    server = app.listen(appConfig.port, () => {
      console.log(`LexSecure API listening on port ${appConfig.port}`);
    });
  } catch (error) {
    console.error('LexSecure API startup failed.');
    console.error(error.message);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  console.log(`${signal} received. Closing LexSecure API server.`);

  if (server) {
    server.close(async () => {
      await disconnectDatabase();
      console.log('LexSecure API server closed.');
      process.exit(0);
    });
    return;
  }

  await disconnectDatabase();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

await startServer();
