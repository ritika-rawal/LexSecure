import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileJson,
  LoaderCircle,
} from 'lucide-react';

import { downloadAccountExport } from '../api/accountExport.api.js';
import {
  getAccountExportErrorMessage,
  saveAccountExport,
} from '../utils/accountExport.js';

const AccountDataExport = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleDownload = async () => {
    setIsDownloading(true);
    setErrorMessage('');
    setFeedback('');

    try {
      const exportBlob = await downloadAccountExport();
      saveAccountExport(exportBlob);
      setFeedback('Account export downloaded.');
    } catch (error) {
      setErrorMessage(await getAccountExportErrorMessage(error));
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <section className="mt-8 border-y border-line bg-white" aria-labelledby="data-export-heading">
      <div className="flex flex-col justify-between gap-5 px-5 py-6 sm:flex-row sm:items-center sm:px-7">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center bg-emerald-50 text-forest">
            <FileJson aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-bold" id="data-export-heading">Export my data</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
              Download a machine-readable copy of your account and appointment history.
              It does not contain passwords, documents, messages, or security records.
            </p>
          </div>
        </div>
        <button
          className="flex h-11 shrink-0 items-center justify-center gap-2 bg-forest px-4 text-sm font-semibold text-white hover:bg-forest-dark disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isDownloading}
          onClick={handleDownload}
          type="button"
        >
          {isDownloading ? (
            <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <Download aria-hidden="true" className="h-4 w-4" />
          )}
          {isDownloading ? 'Preparing export' : 'Download my data'}
        </button>
      </div>

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

export default AccountDataExport;
