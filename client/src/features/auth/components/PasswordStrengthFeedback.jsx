import { Check, Circle } from 'lucide-react';

import { getPasswordStrength } from '../validation/password.validation.js';

const PasswordStrengthFeedback = ({ password }) => {
  if (!password) return null;

  const { label, metCount, requirements } = getPasswordStrength(password);
  const percentage = `${(metCount / requirements.length) * 100}%`;

  return (
    <div className="mt-3" aria-live="polite">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold text-gray-600">
        <span>Password strength</span>
        <span>{label}</span>
      </div>
      <div className="h-1.5 overflow-hidden bg-gray-200" aria-hidden="true">
        <div className="h-full bg-forest transition-[width]" style={{ width: percentage }} />
      </div>
      <ul className="mt-3 grid gap-1.5 text-xs text-gray-600 sm:grid-cols-2">
        {requirements.map(({ id, label: requirementLabel, met }) => (
          <li className="flex items-center gap-1.5" key={id}>
            {met ? (
              <Check aria-hidden="true" className="h-3.5 w-3.5 text-emerald-700" />
            ) : (
              <Circle aria-hidden="true" className="h-3.5 w-3.5 text-gray-400" />
            )}
            <span>{requirementLabel}</span>
            <span className="sr-only">{met ? 'met' : 'not met'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PasswordStrengthFeedback;
