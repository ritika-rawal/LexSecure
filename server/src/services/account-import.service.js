import { USER_ROLES } from '../constants/user-roles.js';
import { LawyerProfile } from '../models/LawyerProfile.model.js';
import { User } from '../models/User.model.js';
import {
  createLawyerProfile,
  updateLawyerProfile,
} from './lawyer-profile.service.js';

const createImportUnavailableError = () => {
  const error = new Error('Account import is unavailable for this role.');
  error.statusCode = 403;
  return error;
};

export const importAccountData = async ({ user, importPayload }) => {
  if (user.role === USER_ROLES.CLIENT) {
    const updatedUser = await User.findOneAndUpdate(
      { _id: user.id, role: USER_ROLES.CLIENT, isActive: true },
      { $set: { fullName: importPayload.account.fullName } },
      { new: true, runValidators: true },
    ).select('+passwordChangedAt +passwordExpiresAt');

    if (!updatedUser) throw createImportUnavailableError();

    return Object.freeze({ resourceType: 'user', resource: updatedUser });
  }

  if (user.role !== USER_ROLES.LAWYER) throw createImportUnavailableError();

  const profileExists = await LawyerProfile.exists({ user: user.id });
  const profile = profileExists
    ? await updateLawyerProfile({
        lawyerId: user.id,
        profileData: importPayload.lawyerProfile,
      })
    : await createLawyerProfile({
        lawyerId: user.id,
        profileData: importPayload.lawyerProfile,
      });

  return Object.freeze({ resourceType: 'lawyerProfile', resource: profile });
};
