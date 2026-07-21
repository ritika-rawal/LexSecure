const REQUIRED_DATABASE_VARIABLES = [
  'MONGO_HOST',
  'MONGO_PORT',
  'MONGO_DATABASE',
  'MONGO_APP_USERNAME',
  'MONGO_APP_PASSWORD',
];

const missingVariables = REQUIRED_DATABASE_VARIABLES.filter(
  (variableName) => !process.env[variableName],
);

if (missingVariables.length > 0) {
  throw new Error(
    `Missing container database configuration: ${missingVariables.join(', ')}.`,
  );
}

const mongoPort = Number.parseInt(process.env.MONGO_PORT, 10);

if (!Number.isInteger(mongoPort) || mongoPort < 1 || mongoPort > 65535) {
  throw new Error('MONGO_PORT must be a valid TCP port.');
}

const host = process.env.MONGO_HOST;

if (!/^[A-Za-z0-9.-]+$/.test(host)) {
  throw new Error('MONGO_HOST must be a valid container hostname.');
}

const username = encodeURIComponent(process.env.MONGO_APP_USERNAME);
const password = encodeURIComponent(process.env.MONGO_APP_PASSWORD);
const database = encodeURIComponent(process.env.MONGO_DATABASE);

process.env.MONGODB_URI =
  `mongodb://${username}:${password}@${host}:${mongoPort}/${database}`
  + `?authSource=${database}`;

await import('../src/server.js');
