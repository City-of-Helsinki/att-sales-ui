import React, { useEffect, useMemo } from 'react';
import { Button, ButtonVariant, Notification, NotificationSize } from 'hds-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import Container from '../../components/common/container/Container';
import Spinner from '../../components/common/spinner/Spinner';
import { toast } from '../../components/common/toast/ToastManager';
import { ROUTES } from '../../enums';
import { useGetMessagesInboxSummaryQuery } from '../../redux/services/api';
import { MessagesInboxSummaryItem } from '../../types';
import formatDateTime from '../../utils/formatDateTime';
import { usePageTitle } from '../../utils/usePageTitle';

import styles from './MessagesInbox.module.scss';

const T_PATH = 'pages.messages.MessagesInbox';

type InboxItem = {
  applicationId: number;
  unreadCount: number;
  hasUnread: boolean;
  lastMessageAt: string | null;
  lastMessagePreview: string;
  applicantName: string;
  projectName: string;
  projectId?: number;
  projectUuid?: string;
  customerId?: number;
  reservationId?: number;
};

type ThreadTarget = {
  customerId: number;
  projectUuid: string;
  reservationId: number;
};

const MessagesInbox = (): JSX.Element => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    data: inboxSummary,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetMessagesInboxSummaryQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const items = useMemo(() => {
    const source = inboxSummary?.items || [];

    return source
      .map(
        (item: MessagesInboxSummaryItem): InboxItem => ({
          applicationId: item.application_id,
          unreadCount: item.unread_count,
          hasUnread: item.has_unread,
          lastMessageAt: item.last_message_at,
          lastMessagePreview: item.last_message_preview,
          applicantName: item.applicant_name,
          projectName: item.project_name,
          projectId: item.project_id,
          projectUuid: item.project_uuid,
          customerId: item.customer_id,
          reservationId: item.reservation_id,
        })
      )
      .sort((a, b) => {
        if (!a.lastMessageAt && !b.lastMessageAt) {
          return 0;
        }

        if (!a.lastMessageAt) {
          return 1;
        }

        if (!b.lastMessageAt) {
          return -1;
        }

        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      });
  }, [inboxSummary]);

  usePageTitle(t('PAGES.messages'));

  useEffect(() => {
    const refreshUnread = () => {
      refetch();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshUnread();
      }
    };

    window.addEventListener('pageshow', refreshUnread);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('pageshow', refreshUnread);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [refetch]);

  const totalUnread = items.reduce((total, item) => total + item.unreadCount, 0);
  const hasServiceError = Boolean((error as { status?: number } | undefined)?.status === 503);
  const hasForbiddenError = Boolean((error as { status?: number } | undefined)?.status === 403);

  const navigateToThread = (target: ThreadTarget) => {
    navigate(
      `/${ROUTES.CUSTOMERS}/${target.customerId}?tab=messages&projectUuid=${encodeURIComponent(
        target.projectUuid
      )}&reservationId=${target.reservationId}`
    );
  };

  const handleOpenThread = (item: InboxItem) => {
    if (item.customerId && item.projectUuid && item.reservationId) {
      const directTarget = {
        customerId: item.customerId,
        projectUuid: item.projectUuid,
        reservationId: item.reservationId,
      };
      navigateToThread(directTarget);
      return;
    }

    toast.show({ type: 'error', content: t(`${T_PATH}.temporaryUnavailable`) });
  };

  return (
    <Container>
      <header className={styles.header}>
        <h1>{t(`${T_PATH}.pageTitle`)}</h1>
      </header>

      <p className={styles.subTitle}>{t(`${T_PATH}.subTitle`, { count: totalUnread })}</p>

      <div className={styles.actions}>
        <Button variant={ButtonVariant.Secondary} onClick={() => refetch()} disabled={isFetching}>
          {t(`${T_PATH}.refresh`)}
        </Button>
      </div>

      {hasForbiddenError && (
        <div className={styles.errorWrap}>
          <Notification type="error" size={NotificationSize.Small}>
            {t(`${T_PATH}.forbidden`)}
          </Notification>
        </div>
      )}

      {hasServiceError && (
        <div className={styles.errorWrap}>
          <Notification type="info" size={NotificationSize.Small}>
            {t(`${T_PATH}.temporaryUnavailable`)}
          </Notification>
        </div>
      )}

      {isLoading && <Spinner />}

      {!isLoading && !hasForbiddenError && !items.length && <p className={styles.empty}>{t(`${T_PATH}.empty`)}</p>}

      {!isLoading && !!items.length && (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.applicationId}>
              <button className={styles.cardButton} type="button" onClick={() => handleOpenThread(item)}>
                <div className={styles.cardHeader}>
                  <span className={styles.projectName}>{item.projectName}</span>
                  {item.unreadCount > 0 ? (
                    <span className={styles.unreadBadge}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</span>
                  ) : null}
                </div>
                <div className={styles.applicantName}>{item.applicantName}</div>
                <p className={styles.preview}>{item.lastMessagePreview}</p>
                <div className={styles.meta}>
                  {t(`${T_PATH}.application`)} #{item.applicationId}
                  {item.lastMessageAt ? ` | ${formatDateTime(item.lastMessageAt)}` : ''}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
};

export default MessagesInbox;
