const requiredVariables = [
  'MONGO_DATABASE',
  'MONGO_APP_USERNAME',
  'MONGO_APP_PASSWORD',
];

for (const variableName of requiredVariables) {
  if (!process.env[variableName]) {
    throw new Error(`${variableName} is required during MongoDB initialization.`);
  }
}

const applicationDatabase = db.getSiblingDB(process.env.MONGO_DATABASE);
const existingUser = applicationDatabase.getUser(process.env.MONGO_APP_USERNAME);

if (!existingUser) {
  applicationDatabase.createUser({
    user: process.env.MONGO_APP_USERNAME,
    pwd: process.env.MONGO_APP_PASSWORD,
    roles: [
      {
        role: 'readWrite',
        db: process.env.MONGO_DATABASE,
      },
    ],
  });
}
