import { connectDatabase, disconnectDatabase } from '../src/config/database.config.js';
import { createInitialAdmin } from '../src/services/admin-account.service.js';
import { validateAdminAccountInput } from '../src/validators/admin-account.validator.js';

const run = async () => {
  try {
    const input = validateAdminAccountInput({
      fullName: process.env.ADMIN_FULL_NAME,
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    });

    await connectDatabase();

    const admin = await createInitialAdmin(input);

    console.log(`Admin account created successfully for ${admin.email}.`);
  } catch (error) {
    console.error(`Admin account creation failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
};

await run();
