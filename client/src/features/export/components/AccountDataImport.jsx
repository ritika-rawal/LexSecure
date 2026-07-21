import { useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileJson,
  LoaderCircle,
  Upload,
  X,
} from 'lucide-react';

import { useAuth } from '../../auth/hooks/useAuth.js';
import { getAuthApiError } from '../../auth/utils/apiError.js';
import { importAccountData } from '../api/accountImport.api.js';
import { createImportPreview } from '../utils/accountImport.js';

const AccountDataImport = () => {
  const fileInputRef = useRef(null);
  const { setAuthenticatedUser, user } = useAuth();
  const [preview, setPreview] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isReading, setIsReading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const clearSelection = () => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFile = async (event) => {
    const [file] = event.target.files;
    setErrorMessage('');
    setFeedback('');
    setPreview(null);

    if (!file) return;

    setIsReading(true);
    try {
      setPreview(await createImportPreview({ file, user }));
    } catch (error) {
      setErrorMessage(error.message || 'The selected file could not be read.');
      clearSelection();
    } finally {
      setIsReading(false);
    }
  };

  const handleImport = async () => {
    if (!preview) return;

    setIsImporting(true);
    setErrorMessage('');
    setFeedback('');

    try {
      const response = await importAccountData(preview.payload);
      if (response.data.user) setAuthenticatedUser(response.data.user);
      setFeedback(
        user.role === 'lawyer'
          ? 'Professional profile imported and submitted for administrator review.'
          : response.message,
      );
      clearSelection();
    } catch (error) {
      setErrorMessage(getAuthApiError(error, 'Account data could not be imported.').message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <section className="mt-8 border-y border-line bg-white" aria-labelledby="data-import-heading">
      <div className="flex flex-col justify-between gap-5 px-5 py-6 sm:flex-row sm:items-center sm:px-7">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center bg-blue-50 text-blue-800">
            <FileJson aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-bold" id="data-import-heading">Import my data</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
              Restore editable account information from a LexSecure JSON export.
            </p>
          </div>
        </div>
        <input accept=".json,application/json" className="sr-only" onChange={handleFile} ref={fileInputRef} type="file" />
        <button className="flex h-11 shrink-0 items-center justify-center gap-2 border border-forest bg-white px-4 text-sm font-semibold text-forest hover:bg-emerald-50 disabled:opacity-60" disabled={isReading || isImporting} onClick={() => fileInputRef.current?.click()} type="button">
          {isReading ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Upload aria-hidden="true" className="h-4 w-4" />}
          {isReading ? 'Reading file' : 'Select export'}
        </button>
      </div>

      {preview ? (
        <div className="border-t border-line bg-gray-50 px-5 py-5 sm:px-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{preview.fileName}</p>
              <p className="mt-1 text-sm text-gray-600">{preview.summary}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button aria-label="Cancel import" className="grid h-10 w-10 place-items-center border border-gray-300 bg-white hover:bg-gray-100" disabled={isImporting} onClick={clearSelection} title="Cancel import" type="button">
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
              <button className="flex h-10 items-center gap-2 bg-forest px-4 text-sm font-semibold text-white hover:bg-forest-dark disabled:opacity-60" disabled={isImporting} onClick={handleImport} type="button">
                {isImporting ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Upload aria-hidden="true" className="h-4 w-4" />}
                {isImporting ? 'Importing' : 'Confirm import'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <p className="flex items-start gap-2 border-t border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700 sm:px-7" role="alert">
          <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          {errorMessage}
        </p>
      ) : null}
      {feedback ? (
        <p className="flex items-start gap-2 border-t border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-800 sm:px-7" role="status">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          {feedback}
        </p>
      ) : null}
    </section>
  );
};

export default AccountDataImport;
