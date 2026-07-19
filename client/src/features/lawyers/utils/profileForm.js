const createRowId = () => crypto.randomUUID();

const getLocalTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

export const createEmptyProfileForm = () => ({
  professionalTitle: '',
  biography: '',
  specializations: [''],
  yearsOfExperience: '',
  consultationFeeAmount: '',
  consultationFeeCurrency: 'NPR',
  timezone: getLocalTimezone(),
  weeklyAvailability: [],
});

export const profileToForm = (profile) => ({
  professionalTitle: profile.professionalTitle,
  biography: profile.biography,
  specializations: [...profile.specializations],
  yearsOfExperience: String(profile.yearsOfExperience),
  consultationFeeAmount: String(profile.consultationFee.amount),
  consultationFeeCurrency: profile.consultationFee.currency,
  timezone: profile.timezone,
  weeklyAvailability: profile.weeklyAvailability.map((slot) => ({
    rowId: createRowId(),
    dayOfWeek: slot.dayOfWeek,
    startTime: slot.startTime,
    endTime: slot.endTime,
  })),
});

export const profileFormToPayload = (values) => ({
  professionalTitle: values.professionalTitle.trim(),
  biography: values.biography.trim(),
  specializations: values.specializations.map((value) => value.trim()),
  yearsOfExperience: Number(values.yearsOfExperience),
  consultationFee: {
    amount: Number(values.consultationFeeAmount),
    currency: values.consultationFeeCurrency.trim().toUpperCase(),
  },
  timezone: values.timezone.trim(),
  weeklyAvailability: values.weeklyAvailability.map(
    ({ dayOfWeek, startTime, endTime }) => ({
      dayOfWeek,
      startTime,
      endTime,
    }),
  ),
});

export const createAvailabilityRow = () => ({
  rowId: createRowId(),
  dayOfWeek: 'monday',
  startTime: '09:00',
  endTime: '10:00',
});
