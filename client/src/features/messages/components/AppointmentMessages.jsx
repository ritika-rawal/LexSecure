import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  LoaderCircle,
  MessageSquare,
  RefreshCw,
  Send,
} from 'lucide-react';

import { useAuth } from '../../auth/hooks/useAuth.js';
import { getAuthApiError } from '../../auth/utils/apiError.js';
import {
  getAppointmentMessages,
  sendAppointmentMessage,
} from '../api/message.api.js';
import {
  MESSAGE_MAXIMUM_LENGTH,
  MESSAGE_PAGE_SIZE,
} from '../constants/message.js';
import {
  countMessageCharacters,
  formatMessageDate,
  validateMessage,
} from '../utils/message.js';

const EMPTY_PAGINATION = Object.freeze({
  page: 1,
  limit: MESSAGE_PAGE_SIZE,
  totalItems: 0,
  totalPages: 0,
});

const AppointmentMessages = ({
  appointmentId,
  appointmentStatus,
  participantName,
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const canSend = appointmentStatus === 'approved';
  const characterCount = countMessageCharacters(draft);
  const chronologicalMessages = useMemo(
    () => [...messages].reverse(),
    [messages],
  );

  useEffect(() => {
    if (!isOpen) return undefined;

    const controller = new AbortController();

    const loadMessages = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const response = await getAppointmentMessages({
          appointmentId,
          page,
          limit: MESSAGE_PAGE_SIZE,
          signal: controller.signal,
        });
        const nextMessages = response.data.messages;
        const nextPagination = response.data.pagination;

        if (
          nextMessages.length === 0
          && page > 1
          && nextPagination.totalPages < page
        ) {
          setPage(Math.max(1, nextPagination.totalPages));
          return;
        }

        setMessages(nextMessages);
        setPagination(nextPagination);
      } catch (error) {
        if (axios.isCancel(error)) return;

        setMessages([]);
        setPagination(EMPTY_PAGINATION);
        setLoadError(
          getAuthApiError(error, 'Messages could not be loaded.').message,
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    loadMessages();
    return () => controller.abort();
  }, [appointmentId, isOpen, page, reloadKey]);

  const handleSend = async (event) => {
    event.preventDefault();

    const normalizedMessage = draft.trim();
    const validationError = validateMessage(normalizedMessage);

    if (validationError) {
      setSendError(validationError);
      return;
    }

    setIsSending(true);
    setSendError('');

    try {
      await sendAppointmentMessage({
        appointmentId,
        message: normalizedMessage,
      });
      setDraft('');
      setPage(1);
      setReloadKey((current) => current + 1);
    } catch (error) {
      setSendError(
        getAuthApiError(error, 'Message could not be sent.').message,
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleDraftChange = (event) => {
    const nextDraft = event.target.value;

    if (countMessageCharacters(nextDraft) > MESSAGE_MAXIMUM_LENGTH) {
      setSendError(
        `Message must not exceed ${MESSAGE_MAXIMUM_LENGTH} characters.`,
      );
      return;
    }

    setDraft(nextDraft);
    if (sendError) setSendError('');
  };

  return (
    <section className="border-t border-line bg-white">
      <button
        aria-controls={`appointment-messages-${appointmentId}`}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-5 py-3 text-left text-sm font-semibold hover:bg-gray-50 sm:px-6"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className="flex min-w-0 items-center gap-2">
          <MessageSquare aria-hidden="true" className="h-4 w-4 shrink-0 text-forest" />
          <span>Secure messages</span>
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
          id={`appointment-messages-${appointmentId}`}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold">Conversation with {participantName}</h3>
              <p className="mt-1 text-xs text-gray-500">
                Messages are available only to appointment participants.
              </p>
            </div>
            <button
              aria-label="Refresh messages"
              className="grid h-9 w-9 shrink-0 place-items-center border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50"
              disabled={isLoading}
              onClick={() => setReloadKey((current) => current + 1)}
              title="Refresh messages"
              type="button"
            >
              <RefreshCw
                aria-hidden="true"
                className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              />
            </button>
          </div>

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

          {isLoading ? (
            <div className="flex min-h-32 items-center justify-center gap-2 border border-line bg-white text-sm font-semibold text-gray-600" aria-live="polite">
              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin text-forest" />
              Loading messages
            </div>
          ) : null}

          {!isLoading && !loadError && chronologicalMessages.length === 0 ? (
            <div className="border border-dashed border-gray-300 bg-white px-4 py-10 text-center">
              <MessageSquare aria-hidden="true" className="mx-auto h-7 w-7 text-gray-400" />
              <p className="mt-2 text-sm font-semibold">No messages yet</p>
            </div>
          ) : null}

          {!isLoading && !loadError && chronologicalMessages.length > 0 ? (
            <ol
              aria-label={`Messages with ${participantName}`}
              className="space-y-3 border border-line bg-white p-3 sm:p-4"
            >
              {chronologicalMessages.map((message) => {
                const isOwnMessage = message.sender.id === user.id;

                return (
                  <li
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    key={message.id}
                  >
                    <div
                      className={`max-w-[88%] border px-3 py-2.5 sm:max-w-[72%] ${
                        isOwnMessage
                          ? 'border-forest bg-forest text-white'
                          : 'border-line bg-gray-50 text-ink'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                        <span className={`text-xs font-semibold ${isOwnMessage ? 'text-emerald-100' : 'text-gray-600'}`}>
                          {isOwnMessage ? 'You' : message.sender.fullName}
                        </span>
                        <time
                          className={`text-xs ${isOwnMessage ? 'text-emerald-100' : 'text-gray-500'}`}
                          dateTime={message.createdAt}
                        >
                          {formatMessageDate(message.createdAt)}
                        </time>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
                        {message.message}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : null}

          {!isLoading && !loadError && pagination.totalPages > 1 ? (
            <nav className="mt-3 flex items-center justify-end gap-2" aria-label="Message history pages">
              <span className="mr-1 text-xs text-gray-500">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                aria-label="Newer messages"
                className="grid h-9 w-9 place-items-center border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                title="Newer messages"
                type="button"
              >
                <ChevronLeft aria-hidden="true" className="h-4 w-4" />
              </button>
              <button
                aria-label="Older messages"
                className="grid h-9 w-9 place-items-center border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((current) => current + 1)}
                title="Older messages"
                type="button"
              >
                <ChevronRight aria-hidden="true" className="h-4 w-4" />
              </button>
            </nav>
          ) : null}

          {canSend ? (
            <form className="mt-4 border border-line bg-white p-3" onSubmit={handleSend}>
              <label
                className="block text-sm font-semibold"
                htmlFor={`message-draft-${appointmentId}`}
              >
                Message
              </label>
              <textarea
                aria-describedby={`message-count-${appointmentId}`}
                aria-invalid={Boolean(sendError)}
                className="profile-control mt-2 min-h-24 resize-y"
                disabled={isSending}
                id={`message-draft-${appointmentId}`}
                onChange={handleDraftChange}
                placeholder={`Write a confidential message to ${participantName}.`}
                value={draft}
              />
              <div className="mt-2 flex items-start justify-between gap-4">
                <div>
                  {sendError ? (
                    <p className="flex items-start gap-2 text-sm text-red-700" role="alert">
                      <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                      {sendError}
                    </p>
                  ) : null}
                </div>
                <span
                  className="shrink-0 text-xs text-gray-500"
                  id={`message-count-${appointmentId}`}
                >
                  {characterCount}/{MESSAGE_MAXIMUM_LENGTH}
                </span>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  className="flex h-10 items-center justify-center gap-2 bg-forest px-4 text-sm font-semibold text-white hover:bg-forest-dark disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSending || draft.trim().length === 0}
                  type="submit"
                >
                  {isSending ? (
                    <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send aria-hidden="true" className="h-4 w-4" />
                  )}
                  {isSending ? 'Sending' : 'Send'}
                </button>
              </div>
            </form>
          ) : (
            <p className="mt-4 border border-line bg-white px-3 py-3 text-sm text-gray-600">
              New messages can be sent only while the appointment is approved.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
};

export default AppointmentMessages;
