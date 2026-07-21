import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  FileText,
  LoaderCircle,
  Paperclip,
  Upload,
} from 'lucide-react';

import { getAuthApiError } from '../../auth/utils/apiError.js';
import {
  downloadAppointmentDocument,
  getAppointmentDocuments,
  uploadAppointmentDocument,
} from '../api/document.api.js';
import {
  DOCUMENT_ACCEPT_VALUE,
  DOCUMENT_PAGE_SIZE,
} from '../constants/document.js';
import {
  formatDocumentDate,
  formatDocumentSize,
  validateDocumentFile,
} from '../utils/document.js';

const EMPTY_PAGINATION = Object.freeze({
  page: 1,
  limit: DOCUMENT_PAGE_SIZE,
  totalItems: 0,
  totalPages: 0,
});

const AppointmentDocuments = ({
  appointmentId,
  canUpload,
}) => {
  const fileInputRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadFeedback, setUploadFeedback] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingDocumentId, setDownloadingDocumentId] = useState('');
  const [downloadError, setDownloadError] = useState('');

  useEffect(() => {
    if (!isOpen) return undefined;

    const controller = new AbortController();

    const loadDocuments = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const response = await getAppointmentDocuments({
          appointmentId,
          page,
          limit: DOCUMENT_PAGE_SIZE,
          signal: controller.signal,
        });
        const nextDocuments = response.data.documents;
        const nextPagination = response.data.pagination;

        if (
          nextDocuments.length === 0
          && page > 1
          && nextPagination.totalPages < page
        ) {
          setPage(Math.max(1, nextPagination.totalPages));
          return;
        }

        setDocuments(nextDocuments);
        setPagination(nextPagination);
      } catch (error) {
        if (axios.isCancel(error)) return;

        setDocuments([]);
        setPagination(EMPTY_PAGINATION);
        setLoadError(
          getAuthApiError(error, 'Documents could not be loaded.').message,
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    loadDocuments();
    return () => controller.abort();
  }, [appointmentId, isOpen, page, reloadKey]);

  const handleFileSelection = (event) => {
    const file = event.target.files?.[0] || null;

    setSelectedFile(file);
    setUploadFeedback('');
    setUploadError(file ? validateDocumentFile(file) : '');
  };

  const handleUpload = async () => {
    const validationError = validateDocumentFile(selectedFile);

    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadFeedback('');
    setUploadProgress(0);

    try {
      const response = await uploadAppointmentDocument({
        appointmentId,
        file: selectedFile,
        onUploadProgress: ({ loaded, total }) => {
          if (total) {
            setUploadProgress(Math.min(100, Math.round((loaded / total) * 100)));
          }
        },
      });

      setSelectedFile(null);
      setUploadProgress(100);
      setUploadFeedback(response.message);
      setPage(1);
      setReloadKey((current) => current + 1);

      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      setUploadError(
        getAuthApiError(error, 'Document could not be uploaded.').message,
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (document) => {
    setDownloadingDocumentId(document.id);
    setDownloadError('');

    try {
      const blob = await downloadAppointmentDocument(document.id);
      const objectUrl = URL.createObjectURL(blob);
      const link = window.document.createElement('a');

      link.href = objectUrl;
      link.download = document.originalName;
      link.style.display = 'none';
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    } catch (error) {
      setDownloadError(
        getAuthApiError(error, 'Document could not be downloaded.').message,
      );
    } finally {
      setDownloadingDocumentId('');
    }
  };

  return (
    <section className="border-t border-line bg-white">
      <button
        aria-controls={`appointment-documents-${appointmentId}`}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-5 py-3 text-left text-sm font-semibold hover:bg-gray-50 sm:px-6"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className="flex min-w-0 items-center gap-2">
          <Paperclip aria-hidden="true" className="h-4 w-4 shrink-0 text-forest" />
          <span>Legal documents</span>
          {pagination.totalItems > 0 ? (
            <span className="border border-line bg-gray-50 px-2 py-0.5 text-xs text-gray-600">
              {pagination.totalItems}
            </span>
          ) : null}
        </span>
        {isOpen ? (
          <ChevronUp aria-hidden="true" className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0" />
        )}
      </button>

      {isOpen ? (
        <div
          className="border-t border-line bg-[#f8faf9] px-5 py-5 sm:px-6"
          id={`appointment-documents-${appointmentId}`}
        >
          {canUpload ? (
            <div className="mb-5 border border-line bg-white p-4">
              <label
                className="block text-sm font-semibold"
                htmlFor={`appointment-document-${appointmentId}`}
              >
                Add a confidential document
              </label>
              <p className="mt-1 text-xs text-gray-500">
                PDF, DOCX, TXT, JPG, JPEG, or PNG. Maximum 5 MB.
              </p>

              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-stretch">
                <label
                  className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3 border border-dashed border-gray-400 bg-gray-50 px-3 text-sm hover:border-forest hover:bg-emerald-50"
                  htmlFor={`appointment-document-${appointmentId}`}
                >
                  <FileText aria-hidden="true" className="h-5 w-5 shrink-0 text-forest" />
                  <span className="min-w-0 truncate">
                    {selectedFile ? selectedFile.name : 'Choose document'}
                  </span>
                </label>
                <input
                  accept={DOCUMENT_ACCEPT_VALUE}
                  className="sr-only"
                  disabled={isUploading}
                  id={`appointment-document-${appointmentId}`}
                  onChange={handleFileSelection}
                  ref={fileInputRef}
                  type="file"
                />
                <button
                  className="flex h-11 items-center justify-center gap-2 bg-forest px-4 text-sm font-semibold text-white hover:bg-forest-dark disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!selectedFile || Boolean(uploadError) || isUploading}
                  onClick={handleUpload}
                  type="button"
                >
                  {isUploading ? (
                    <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload aria-hidden="true" className="h-4 w-4" />
                  )}
                  {isUploading ? `Uploading ${uploadProgress}%` : 'Upload'}
                </button>
              </div>

              {isUploading ? (
                <div
                  aria-label={`Upload ${uploadProgress}% complete`}
                  aria-valuemax="100"
                  aria-valuemin="0"
                  aria-valuenow={uploadProgress}
                  className="mt-3 h-1.5 overflow-hidden bg-gray-200"
                  role="progressbar"
                >
                  <div
                    className="h-full bg-forest transition-[width]"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              ) : null}

              {uploadError ? (
                <p className="mt-3 flex items-start gap-2 text-sm text-red-700" role="alert">
                  <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                  {uploadError}
                </p>
              ) : null}

              {uploadFeedback ? (
                <p className="mt-3 flex items-start gap-2 text-sm text-emerald-800" role="status">
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                  {uploadFeedback}
                </p>
              ) : null}
            </div>
          ) : null}

          {loadError ? (
            <div className="flex items-start justify-between gap-4 border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
              <span className="flex items-start gap-2">
                <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                {loadError}
              </span>
              <button
                className="shrink-0 font-semibold underline"
                onClick={() => setReloadKey((current) => current + 1)}
                type="button"
              >
                Retry
              </button>
            </div>
          ) : null}

          {downloadError ? (
            <p className="mb-3 flex items-start gap-2 text-sm text-red-700" role="alert">
              <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              {downloadError}
            </p>
          ) : null}

          {isLoading ? (
            <div className="flex min-h-24 items-center justify-center gap-2 text-sm font-semibold text-gray-600" aria-live="polite">
              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin text-forest" />
              Loading documents
            </div>
          ) : null}

          {!isLoading && !loadError && documents.length === 0 ? (
            <div className="border border-dashed border-gray-300 bg-white px-4 py-8 text-center">
              <Paperclip aria-hidden="true" className="mx-auto h-6 w-6 text-gray-400" />
              <p className="mt-2 text-sm font-semibold">No documents attached</p>
            </div>
          ) : null}

          {!isLoading && !loadError && documents.length > 0 ? (
            <div>
              <ul className="divide-y divide-line border border-line bg-white">
                {documents.map((document) => (
                  <li
                    className="flex flex-col justify-between gap-3 p-3 sm:flex-row sm:items-center"
                    key={document.id}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center bg-emerald-50 text-forest">
                        <FileText aria-hidden="true" className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold" title={document.originalName}>
                          {document.originalName}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {formatDocumentSize(document.size)}
                          {' | '}
                          {formatDocumentDate(document.createdAt)}
                          {' | '}
                          {document.uploadedBy.fullName}
                        </p>
                      </div>
                    </div>
                    <button
                      aria-label={`Download ${document.originalName}`}
                      className="flex h-9 shrink-0 items-center justify-center gap-2 border border-gray-300 bg-white px-3 text-sm font-semibold text-forest hover:bg-emerald-50 disabled:opacity-60"
                      disabled={downloadingDocumentId === document.id}
                      onClick={() => handleDownload(document)}
                      type="button"
                    >
                      {downloadingDocumentId === document.id ? (
                        <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download aria-hidden="true" className="h-4 w-4" />
                      )}
                      Download
                    </button>
                  </li>
                ))}
              </ul>

              {pagination.totalPages > 1 ? (
                <nav className="mt-3 flex items-center justify-end gap-2" aria-label="Document pages">
                  <span className="mr-1 text-xs text-gray-500">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    aria-label="Previous document page"
                    className="grid h-9 w-9 place-items-center border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    title="Previous page"
                    type="button"
                  >
                    <ChevronLeft aria-hidden="true" className="h-4 w-4" />
                  </button>
                  <button
                    aria-label="Next document page"
                    className="grid h-9 w-9 place-items-center border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((current) => current + 1)}
                    title="Next page"
                    type="button"
                  >
                    <ChevronRight aria-hidden="true" className="h-4 w-4" />
                  </button>
                </nav>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};

export default AppointmentDocuments;
