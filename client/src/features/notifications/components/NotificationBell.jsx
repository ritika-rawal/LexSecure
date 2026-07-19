import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  Bell,
  CalendarCheck,
  CalendarClock,
  CalendarX,
  Check,
  LoaderCircle,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { USER_ROLES } from '../../auth/constants/userRoles.js';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { getAuthApiError } from '../../auth/utils/apiError.js';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
} from '../api/notification.api.js';

const NOTIFICATION_ICONS = Object.freeze({
  appointment_created: CalendarClock,
  appointment_approved: CalendarCheck,
  appointment_rejected: CalendarX,
  appointment_cancelled: CalendarX,
  appointment_rescheduled: CalendarClock,
});

const formatNotificationTime = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const NotificationBell = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const appointmentPath =
    user.role === USER_ROLES.CLIENT
      ? '/client/appointments'
      : '/lawyer/schedule';

  useEffect(() => {
    const controller = new AbortController();

    const loadUnreadCount = async () => {
      try {
        const response = await getUnreadNotificationCount({
          signal: controller.signal,
        });
        setUnreadCount(response.data.unreadCount);
      } catch (error) {
        if (!axios.isCancel(error)) setUnreadCount(0);
      }
    };

    loadUnreadCount();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    const controller = new AbortController();

    const loadNotifications = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const response = await getNotifications({
          limit: 8,
          signal: controller.signal,
        });
        setNotifications(response.data.notifications);
      } catch (error) {
        if (axios.isCancel(error)) return;

        setLoadError(
          getAuthApiError(
            error,
            'Notifications could not be loaded.',
          ).message,
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    loadNotifications();
    return () => controller.abort();
  }, [isOpen]);

  const markAsRead = async (notification) => {
    if (notification.isRead) return;

    try {
      const response = await markNotificationAsRead(notification.id);
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? response.data.notification
            : item));
      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (error) {
      setLoadError(
        getAuthApiError(
          error,
          'The notification could not be marked as read.',
        ).message,
      );
    }
  };

  return (
    <div className="relative">
      <button
        aria-expanded={isOpen}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        className="relative grid h-10 w-10 place-items-center border border-gray-300 bg-white text-ink hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-2"
        onClick={() => setIsOpen((current) => !current)}
        title="Notifications"
        type="button"
      >
        <Bell aria-hidden="true" className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center bg-red-700 px-1 text-[11px] font-bold leading-none text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <section
          aria-label="Notifications"
          className="absolute right-0 z-30 mt-2 w-[min(380px,calc(100vw-2rem))] border border-line bg-white shadow-xl"
        >
          <div className="flex h-14 items-center justify-between border-b border-line px-4">
            <div>
              <h2 className="font-bold">Notifications</h2>
              <p className="text-xs text-gray-500">{unreadCount} unread</p>
            </div>
            <button
              aria-label="Close notifications"
              className="grid h-9 w-9 place-items-center hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
              title="Close"
              type="button"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>

          {isLoading ? (
            <div
              aria-busy="true"
              className="flex min-h-40 items-center justify-center gap-2 text-sm font-semibold"
            >
              <LoaderCircle
                aria-hidden="true"
                className="h-5 w-5 animate-spin text-forest"
              />
              Loading notifications
            </div>
          ) : null}

          {loadError && !isLoading ? (
            <p
              className="flex items-start gap-2 bg-red-50 px-4 py-4 text-sm text-red-700"
              role="alert"
            >
              <AlertCircle
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0"
              />
              {loadError}
            </p>
          ) : null}

          {!isLoading && notifications.length === 0 && !loadError ? (
            <div className="px-5 py-10 text-center">
              <Bell
                aria-hidden="true"
                className="mx-auto h-7 w-7 text-gray-400"
              />
              <p className="mt-3 text-sm font-semibold">No notifications</p>
            </div>
          ) : null}

          {!isLoading && notifications.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((notification) => {
                const Icon =
                  NOTIFICATION_ICONS[notification.type] || CalendarClock;

                return (
                  <button
                    className={`flex w-full items-start gap-3 border-b border-line px-4 py-4 text-left hover:bg-gray-50 ${
                      notification.isRead ? 'bg-white' : 'bg-emerald-50'
                    }`}
                    key={notification.id}
                    onClick={() => markAsRead(notification)}
                    type="button"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center bg-white text-forest">
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-3">
                        <span className="font-semibold">
                          {notification.title}
                        </span>
                        {!notification.isRead ? (
                          <span className="mt-1.5 h-2 w-2 shrink-0 bg-forest" />
                        ) : (
                          <Check
                            aria-label="Read"
                            className="h-4 w-4 shrink-0 text-gray-400"
                          />
                        )}
                      </span>
                      <span className="mt-1 block text-sm leading-5 text-gray-600">
                        {notification.message}
                      </span>
                      <span className="mt-2 block text-xs text-gray-500">
                        {formatNotificationTime(notification.createdAt)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}

          <Link
            className="flex h-12 items-center justify-center border-t border-line text-sm font-semibold text-forest hover:bg-gray-50"
            onClick={() => setIsOpen(false)}
            to={appointmentPath}
          >
            View appointments
          </Link>
        </section>
      ) : null}
    </div>
  );
};

export default NotificationBell;
