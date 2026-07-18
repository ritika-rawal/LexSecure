import { AlertCircle } from 'lucide-react';

const FieldError = ({ id, message }) =>
  message ? (
    <p id={id} className="mt-1.5 flex items-center gap-1.5 text-sm text-red-700">
      <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
      {message}
    </p>
  ) : null;

export default FieldError;
