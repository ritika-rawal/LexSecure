const MAXIMUM_IMPORT_FILE_BYTES = 10 * 1024 * 1024;
const EXPECTED_EXPORT_VERSION = 1;
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const EXPECTED_EXPORT_FIELDS = new Set([
  'exportVersion',
  'generatedAt',
  'account',
  'lawyerProfile',
  'appointments',
]);

const containsExactly = (value, expectedFields) =>
  value
  && typeof value === 'object'
  && !Array.isArray(value)
  && Object.keys(value).length === expectedFields.size
  && Object.keys(value).every((key) => expectedFields.has(key));

const parseSafeJson = (text) => JSON.parse(text, (key, value) => {
  if (DANGEROUS_KEYS.has(key)) {
    throw new Error('The selected file contains a prohibited property name.');
  }
  return value;
});

const assertOwnedExport = (account, user) => {
  if (
    !account
    || account.id !== user.id
    || account.email !== user.email
    || account.role !== user.role
  ) {
    throw new Error('Select an account export created for the currently signed-in account.');
  }
};

const buildLawyerProfileImport = (profile) => {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
    throw new Error('The selected export does not contain a lawyer profile.');
  }

  return {
    professionalTitle: profile.professionalTitle,
    biography: profile.biography,
    specializations: Array.isArray(profile.specializations)
      ? [...profile.specializations]
      : profile.specializations,
    yearsOfExperience: profile.yearsOfExperience,
    consultationFee: {
      amount: profile.consultationFee?.amount,
      currency: profile.consultationFee?.currency,
    },
    timezone: profile.timezone,
    weeklyAvailability: Array.isArray(profile.weeklyAvailability)
      ? profile.weeklyAvailability.map(({ dayOfWeek, startTime, endTime }) => ({
          dayOfWeek,
          startTime,
          endTime,
        }))
      : profile.weeklyAvailability,
  };
};

export const createImportPreview = async ({ file, user }) => {
  if (!file || !file.name.toLowerCase().endsWith('.json')) {
    throw new Error('Select a JSON account export file.');
  }

  if (file.size < 2 || file.size > MAXIMUM_IMPORT_FILE_BYTES) {
    throw new Error('The selected file must be between 2 bytes and 10 MB.');
  }

  let accountExport;

  try {
    accountExport = parseSafeJson(await file.text());
  } catch (error) {
    if (error.message.includes('prohibited property')) throw error;
    throw new Error('The selected file does not contain valid JSON.');
  }

  if (
    !containsExactly(accountExport, EXPECTED_EXPORT_FIELDS)
    || accountExport.exportVersion !== EXPECTED_EXPORT_VERSION
    || !Array.isArray(accountExport.appointments)
  ) {
    throw new Error('The selected file is not a supported LexSecure account export.');
  }

  assertOwnedExport(accountExport.account, user);

  if (user.role === 'client') {
    if (typeof accountExport.account.fullName !== 'string') {
      throw new Error('The selected export does not contain a valid account name.');
    }

    return Object.freeze({
      fileName: file.name,
      summary: `Account name: ${accountExport.account.fullName}`,
      payload: {
        importVersion: EXPECTED_EXPORT_VERSION,
        account: { fullName: accountExport.account.fullName },
      },
    });
  }

  const lawyerProfile = buildLawyerProfileImport(accountExport.lawyerProfile);

  return Object.freeze({
    fileName: file.name,
    summary: `${lawyerProfile.professionalTitle} / ${lawyerProfile.specializations?.length || 0} specializations / ${lawyerProfile.weeklyAvailability?.length || 0} availability slots`,
    payload: {
      importVersion: EXPECTED_EXPORT_VERSION,
      lawyerProfile,
    },
  });
};
