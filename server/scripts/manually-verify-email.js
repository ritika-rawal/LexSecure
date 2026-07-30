import { connectDatabase, disconnectDatabase } from '../src/config/database.config.js';
import { User } from '../src/models/User.model.js';
import { issueEmailVerificationToken } from '../src/services/email-verification.service.js';

/*
 * Dev/testing utility: issues a fresh email-verification token for an
 * account that predates the verification feature (so it never received
 * one at registration). Prints the verification link to the console,
 * same as the automatic dev-mode fallback used at registration.
 */
const run = async () => {
  const email = process.argv[2];

  if (!email) {
    console.error('Usage: node scripts/manually-verify-email.js <email>');
    process.exitCode = 1;
    return;
  }

  try {
    await connectDatabase();

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.error(`No account found for ${email}.`);
      process.exitCode = 1;
      return;
    }

    const req = { ip: '127.0.0.1', get: () => undefined };
    await issueEmailVerificationToken({ req, user });
    console.log(`Verification token issued for ${email}. Check the link above.`);

    // issueEmailVerificationToken delivers the link and records its audit
    // event in the background; give it a moment to finish before the
    // database connection closes.
    await new Promise((resolve) => setTimeout(resolve, 500));
  } finally {
    await disconnectDatabase();
  }
};

await run();
