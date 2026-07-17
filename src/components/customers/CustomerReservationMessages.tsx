import React, { useEffect, useMemo, useState } from 'react';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import cx from 'classnames';
import { Button, ButtonVariant, Notification, NotificationSize, TextArea } from 'hds-react';
import { useTranslation } from 'react-i18next';

import Spinner from '../common/spinner/Spinner';
import StatusText from '../common/statusText/StatusText';
import { toast } from '../common/toast/ToastManager';
import {
  useAddApartmentReservationMessageMutation,
  useGetApartmentReservationMessagesQuery,
  useLazyGetApartmentReservationMessagesQuery,
} from '../../redux/services/api';
import { ApartmentReservationMessage, CustomerReservation } from '../../types';
import formatDateTime from '../../utils/formatDateTime';

import styles from './CustomerReservationMessages.module.scss';

const T_PATH = 'components.customers.CustomerReservationMessages';
const OFFER_MESSAGE_DRAFT_KEY = 'offerMessageDraft';

type ApplicationOption = {
  key: string;
  applicationId: number;
  representativeReservationId: number;
  projectHousingCompany: string;
  apartmentNumbers: string[];
  reservationStates: string[];
  lastMessageCreated?: number;
};

type OfferMessageDraft = {
  message: string;
  projectUuid: string;
  reservationId: number;
};

const isDevEnvironment = process.env.NODE_ENV !== 'production';

const buildMessagesUrl = (reservationId: number, projectUuid: string): string =>
  `/v1/sales/apartment_reservations/${reservationId}/messages/?project_uuid=${encodeURIComponent(projectUuid)}`;

function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === 'object' && error !== null && 'status' in error;
}

const formatMessageDateTime = (createdTimestamp: number): string => {
  return formatDateTime(new Date(createdTimestamp * 1000).toISOString());
};

const getSenderLabelKey = (senderRole: ApartmentReservationMessage['sender_role']) => {
  return senderRole === 'sales' ? `${T_PATH}.senderSales` : `${T_PATH}.senderApplicant`;
};

const getStateLabel = (state: string, t: (key: string) => string): string => {
  return t(`ENUMS.ApartmentReservationStates.${state.toUpperCase()}`);
};

interface IProps {
  reservations?: CustomerReservation[];
  isLoadingReservations?: boolean;
}

const CustomerReservationMessages = ({ reservations, isLoadingReservations = false }: IProps): JSX.Element => {
  const { t } = useTranslation();
  const reservationList = useMemo(() => reservations || [], [reservations]);
  const projectsByUuid = useMemo(() => {
    const map = new Map<string, string>();
    reservationList.forEach((res) => {
      map.set(res.project_uuid, res.project_housing_company);
    });
    return map;
  }, [reservationList]);
  const availableProjectUuids = Array.from(projectsByUuid.keys());
  const [selectedProjectUuid, setSelectedProjectUuid] = useState<string | null>(null);
  const [projectMismatchError, setProjectMismatchError] = useState(false);

  useEffect(() => {
    if (!availableProjectUuids.length) {
      setSelectedProjectUuid(null);
      return;
    }
    setSelectedProjectUuid((prev) => {
      if (prev && availableProjectUuids.includes(prev)) {
        return prev;
      }
      return availableProjectUuids[0];
    });
  }, [availableProjectUuids]);

  const reservationListForCurrentProject = useMemo(() => {
    if (!selectedProjectUuid) {
      return [];
    }
    return reservationList.filter((res) => res.project_uuid === selectedProjectUuid);
  }, [reservationList, selectedProjectUuid]);

  const uniqueReservationsForDiscovery = useMemo(() => {
    const seen = new Set<number>();
    return reservationListForCurrentProject.filter((reservation) => {
      if (seen.has(reservation.id)) {
        return false;
      }

      seen.add(reservation.id);
      return true;
    });
  }, [reservationListForCurrentProject]);
  const reservationDiscoveryKey = useMemo(() => {
    return uniqueReservationsForDiscovery
      .map((reservation) => `${reservation.id}:${reservation.apartment_number}:${reservation.state}`)
      .sort()
      .join('|');
  }, [uniqueReservationsForDiscovery]);

  const [applicationOptions, setApplicationOptions] = useState<ApplicationOption[]>([]);
  const [selectedApplicationKey, setSelectedApplicationKey] = useState<string | null>(null);
  const [isDiscoveringApplications, setIsDiscoveringApplications] = useState(false);
  const [hasDiscoveryError, setHasDiscoveryError] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [inputError, setInputError] = useState('');
  const [messagesByThread, setMessagesByThread] = useState<Record<string, ApartmentReservationMessage[]>>({});
  const [discoverApplication] = useLazyGetApartmentReservationMessagesQuery();

  useEffect(() => {
    let isCancelled = false;

    const discoverApplications = async () => {
      if (!uniqueReservationsForDiscovery.length) {
        setApplicationOptions([]);
        setSelectedApplicationKey(null);
        setMessagesByThread({});
        return;
      }

      setIsDiscoveringApplications(true);
      setHasDiscoveryError(false);

      const applicationMap = new Map<string, ApplicationOption>();
      let hasNon404Error = false;

      const results = await Promise.all(
        uniqueReservationsForDiscovery.map(async (reservation) => {
          try {
            if (isDevEnvironment && selectedProjectUuid) {
              console.debug('[ReservationMessages][GET][request]', {
                selectedProjectUuid,
                selectedReservationId: reservation.id,
                url: buildMessagesUrl(reservation.id, selectedProjectUuid),
              });
            }

            const response = await discoverApplication(
              { reservationId: reservation.id, projectUuid: selectedProjectUuid! },
              true
            ).unwrap();

            if (isDevEnvironment) {
              console.debug('[ReservationMessages][GET][response]', {
                status: 200,
                selectedProjectUuid,
                selectedReservationId: reservation.id,
                application_id: response.application_id,
                count: response.count,
              });
            }

            return { reservation, response };
          } catch (error) {
            if (isFetchBaseQueryError(error) && error.status === 404) {
              if (isDevEnvironment) {
                console.debug('[ReservationMessages][GET][response]', {
                  status: 404,
                  selectedProjectUuid,
                  selectedReservationId: reservation.id,
                  application_id: null,
                  count: null,
                });
              }
              return null;
            }

            if (isDevEnvironment && isFetchBaseQueryError(error)) {
              console.debug('[ReservationMessages][GET][response]', {
                status: error.status,
                selectedProjectUuid,
                selectedReservationId: reservation.id,
                application_id: null,
                count: null,
              });
            }

            hasNon404Error = true;
            return null;
          }
        })
      );

      if (isCancelled) {
        return;
      }

      results.forEach((result) => {
        if (!result) {
          return;
        }

        const { reservation, response } = result;
        const key = `${reservation.project_uuid}:${response.application_id}`;
        const existing = applicationMap.get(key);

        if (!existing) {
          applicationMap.set(key, {
            key,
            applicationId: response.application_id,
            representativeReservationId: reservation.id,
            projectHousingCompany: reservation.project_housing_company,
            apartmentNumbers: [reservation.apartment_number],
            reservationStates: [reservation.state],
            lastMessageCreated: response.items[response.items.length - 1]?.created,
          });
          return;
        }

        if (!existing.apartmentNumbers.includes(reservation.apartment_number)) {
          existing.apartmentNumbers.push(reservation.apartment_number);
        }

        if (!existing.reservationStates.includes(reservation.state)) {
          existing.reservationStates.push(reservation.state);
        }

        const latest = response.items[response.items.length - 1]?.created;
        if (latest && (!existing.lastMessageCreated || latest > existing.lastMessageCreated)) {
          existing.lastMessageCreated = latest;
        }
      });

      const nextOptions = Array.from(applicationMap.values()).sort((a, b) => {
        if (a.projectHousingCompany !== b.projectHousingCompany) {
          return a.projectHousingCompany.localeCompare(b.projectHousingCompany);
        }

        return a.applicationId - b.applicationId;
      });

      setApplicationOptions(nextOptions);
      setSelectedApplicationKey((prev) => {
        if (prev && nextOptions.some((option) => option.key === prev)) {
          return prev;
        }

        return nextOptions[0]?.key || null;
      });
      setHasDiscoveryError(hasNon404Error);
      setIsDiscoveringApplications(false);
    };

    discoverApplications();

    return () => {
      isCancelled = true;
    };
  }, [discoverApplication, reservationDiscoveryKey, selectedProjectUuid, uniqueReservationsForDiscovery]);

  const selectedApplication = useMemo(() => {
    if (!selectedApplicationKey) {
      return null;
    }

    return applicationOptions.find((option) => option.key === selectedApplicationKey) || null;
  }, [applicationOptions, selectedApplicationKey]);

  const selectedReservationId = selectedApplication?.representativeReservationId || null;
  const isSelectedReservationInCurrentProject = useMemo(() => {
    if (!selectedReservationId || !selectedProjectUuid) {
      return false;
    }

    return reservationListForCurrentProject.some((reservation) => reservation.id === selectedReservationId);
  }, [reservationListForCurrentProject, selectedProjectUuid, selectedReservationId]);
  const currentThreadKey =
    selectedProjectUuid && selectedReservationId ? `messages:${selectedProjectUuid}:${selectedReservationId}` : null;

  const applicationSelectOptions = useMemo(() => {
    return applicationOptions.map((option) => {
      const lastMessageLabel = option.lastMessageCreated
        ? formatMessageDateTime(option.lastMessageCreated)
        : t(`${T_PATH}.noMessagesShort`);

      return {
        value: option.key,
        label: `${t(`${T_PATH}.applicationOptionPrefix`)} #${option.applicationId} - ${
          option.projectHousingCompany
        } - ${lastMessageLabel}`,
      };
    });
  }, [applicationOptions, t]);

  useEffect(() => {
    setNewMessage('');
    setInputError('');
    setProjectMismatchError(false);
  }, [selectedApplicationKey, selectedProjectUuid]);

  useEffect(() => {
    const rawDraft = sessionStorage.getItem(OFFER_MESSAGE_DRAFT_KEY);
    if (!rawDraft || !selectedProjectUuid) {
      return;
    }

    let parsed: OfferMessageDraft | null = null;
    try {
      parsed = JSON.parse(rawDraft) as OfferMessageDraft;
    } catch {
      sessionStorage.removeItem(OFFER_MESSAGE_DRAFT_KEY);
      return;
    }

    if (!parsed || !parsed.message?.trim() || !parsed.projectUuid) {
      sessionStorage.removeItem(OFFER_MESSAGE_DRAFT_KEY);
      return;
    }

    if (parsed.projectUuid !== selectedProjectUuid && availableProjectUuids.includes(parsed.projectUuid)) {
      setSelectedProjectUuid(parsed.projectUuid);
      return;
    }

    const parsedDraft = parsed;
    const matchingOption = applicationOptions.find(
      (option) => option.representativeReservationId === parsedDraft.reservationId
    );
    if (matchingOption && selectedApplicationKey !== matchingOption.key) {
      setSelectedApplicationKey(matchingOption.key);
      return;
    }
  }, [applicationOptions, availableProjectUuids, selectedApplicationKey, selectedProjectUuid]);

  useEffect(() => {
    const rawDraft = sessionStorage.getItem(OFFER_MESSAGE_DRAFT_KEY);
    if (!rawDraft || !selectedProjectUuid || !selectedApplicationKey) {
      return;
    }

    let parsed: OfferMessageDraft | null = null;
    try {
      parsed = JSON.parse(rawDraft) as OfferMessageDraft;
    } catch {
      return;
    }

    if (!parsed || !parsed.message?.trim() || !parsed.projectUuid) {
      return;
    }

    if (parsed.projectUuid === selectedProjectUuid) {
      const parsedDraft = parsed;
      const matchingOption = applicationOptions.find(
        (option) => option.representativeReservationId === parsedDraft.reservationId
      );
      if (matchingOption && selectedApplicationKey === matchingOption.key) {
        setNewMessage(parsedDraft.message);
        sessionStorage.removeItem(OFFER_MESSAGE_DRAFT_KEY);
      }
    }
  }, [applicationOptions, selectedApplicationKey, selectedProjectUuid]);

  const {
    data,
    isFetching,
    isLoading,
    isError,
    error: queryError,
    refetch,
  } = useGetApartmentReservationMessagesQuery(
    selectedReservationId && selectedProjectUuid
      ? { reservationId: selectedReservationId, projectUuid: selectedProjectUuid }
      : { reservationId: 0, projectUuid: '' },
    {
      skip: !selectedReservationId || !selectedProjectUuid || !isSelectedReservationInCurrentProject,
      refetchOnMountOrArgChange: true,
    }
  );

  useEffect(() => {
    if (!isDevEnvironment || !selectedProjectUuid || !selectedReservationId || !isSelectedReservationInCurrentProject) {
      return;
    }

    console.debug('[ReservationMessages][GET][request]', {
      selectedProjectUuid,
      selectedReservationId,
      url: buildMessagesUrl(selectedReservationId, selectedProjectUuid),
    });
  }, [isSelectedReservationInCurrentProject, selectedProjectUuid, selectedReservationId]);

  useEffect(() => {
    if (
      queryError &&
      isFetchBaseQueryError(queryError) &&
      queryError.status === 400 &&
      (queryError.data as any)?.detail?.includes('does not belong')
    ) {
      setProjectMismatchError(true);
      setMessagesByThread((prev) => {
        if (!currentThreadKey) {
          return prev;
        }

        return {
          ...prev,
          [currentThreadKey]: [],
        };
      });
      setSelectedApplicationKey(null);
      if (isDevEnvironment) {
        console.debug('[ReservationMessages][GET][response]', {
          status: 400,
          selectedProjectUuid,
          selectedReservationId,
          application_id: null,
          count: null,
        });
      }
    }
  }, [currentThreadKey, queryError, selectedProjectUuid, selectedReservationId]);

  useEffect(() => {
    if (!isDevEnvironment || !queryError || !isFetchBaseQueryError(queryError)) {
      return;
    }

    if (queryError.status === 400 && (queryError.data as any)?.detail?.includes('does not belong')) {
      return;
    }

    console.debug('[ReservationMessages][GET][response]', {
      status: queryError.status,
      selectedProjectUuid,
      selectedReservationId,
      application_id: null,
      count: null,
    });
  }, [queryError, selectedProjectUuid, selectedReservationId]);

  const [addMessage, { isLoading: isSubmitting }] = useAddApartmentReservationMessageMutation();

  useEffect(() => {
    if (!currentThreadKey || !data) {
      return;
    }

    setMessagesByThread((prev) => ({
      ...prev,
      [currentThreadKey]: data.items || [],
    }));

    if (isDevEnvironment) {
      console.debug('[ReservationMessages][GET][response]', {
        status: 200,
        selectedProjectUuid,
        selectedReservationId,
        application_id: data.application_id,
        count: data.count,
      });
    }
  }, [currentThreadKey, data, selectedProjectUuid, selectedReservationId]);

  const messages = currentThreadKey ? messagesByThread[currentThreadKey] || [] : [];

  const handleApplicationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setInputError('');
    setNewMessage('');
    setSelectedApplicationKey(event.target.value || null);
  };

  const onRefresh = async () => {
    if (!selectedProjectUuid || !selectedReservationId || !isSelectedReservationInCurrentProject) {
      return;
    }

    if (isDevEnvironment) {
      console.debug('[ReservationMessages][GET][request]', {
        selectedProjectUuid,
        selectedReservationId,
        url: buildMessagesUrl(selectedReservationId, selectedProjectUuid),
      });
    }

    try {
      await refetch();
    } catch (error) {
      toast.show({ type: 'error', content: t(`${T_PATH}.errorRefresh`) });
    }
  };

  const handleSubmit = async () => {
    const trimmedMessage = newMessage.trim();

    if (!trimmedMessage) {
      setInputError(t(`${T_PATH}.emptyMessageError`));
      return;
    }

    if (!selectedReservationId || !selectedProjectUuid) {
      toast.show({ type: 'error', content: t(`${T_PATH}.errorNoProject`) });
      return;
    }

    if (!isSelectedReservationInCurrentProject) {
      setProjectMismatchError(true);
      setSelectedApplicationKey(null);
      return;
    }

    if (isDevEnvironment) {
      console.debug('[ReservationMessages][POST][request]', {
        selectedProjectUuid,
        selectedReservationId,
        url: buildMessagesUrl(selectedReservationId, selectedProjectUuid),
      });
    }

    setInputError('');

    try {
      const createdMessage = await addMessage({
        reservationId: selectedReservationId,
        projectUuid: selectedProjectUuid,
        body: trimmedMessage,
      }).unwrap();
      if (currentThreadKey) {
        setMessagesByThread((prev) => ({
          ...prev,
          [currentThreadKey]: [...(prev[currentThreadKey] || []), createdMessage],
        }));
      }
      setNewMessage('');
      if (isDevEnvironment) {
        console.debug('[ReservationMessages][POST][response]', {
          status: 201,
          selectedProjectUuid,
          selectedReservationId,
          application_id: createdMessage.application_id,
          count: null,
        });
      }
    } catch (error) {
      if (isFetchBaseQueryError(error) && typeof error.status === 'number') {
        const data = error.data as { body?: string[] } | { detail?: string } | undefined;

        if (isDevEnvironment) {
          console.debug('[ReservationMessages][POST][response]', {
            status: error.status,
            selectedProjectUuid,
            selectedReservationId,
            application_id: null,
            count: null,
          });
        }

        if (error.status === 400) {
          if ((data as any)?.detail?.includes('does not belong')) {
            setProjectMismatchError(true);
            if (currentThreadKey) {
              setMessagesByThread((prev) => ({
                ...prev,
                [currentThreadKey]: [],
              }));
            }
            setSelectedApplicationKey(null);
            return;
          }

          if (Array.isArray(data && (data as any).body)) {
            setInputError(t(`${T_PATH}.emptyMessageError`));
            return;
          }
        }

        if (error.status === 403) {
          toast.show({ type: 'error', content: t(`${T_PATH}.errorForbidden`) });
          return;
        }

        if (error.status === 404) {
          toast.show({ type: 'error', content: t(`${T_PATH}.errorNotFound`) });
          return;
        }

        if (error.status === 502 || error.status === 503) {
          toast.show({ type: 'error', content: t(`${T_PATH}.errorTemporary`) });
          return;
        }
      }

      toast.show({ type: 'error', content: t(`${T_PATH}.errorTemporary`) });
    }
  };

  if (isLoadingReservations && !reservationList.length) {
    return <Spinner />;
  }

  if (!reservationList.length) {
    return <StatusText>{t(`${T_PATH}.noReservations`)}</StatusText>;
  }

  if (!selectedProjectUuid) {
    return <Spinner />;
  }

  if (!reservationListForCurrentProject.length) {
    return <StatusText>{t(`${T_PATH}.noReservationsForProject`)}</StatusText>;
  }

  if (isDiscoveringApplications && !applicationOptions.length) {
    return <Spinner />;
  }

  if (!applicationOptions.length) {
    return <StatusText>{t(`${T_PATH}.noApplication`)}</StatusText>;
  }

  const applicationStateLabel = selectedApplication
    ? selectedApplication.reservationStates.map((state) => getStateLabel(state, t)).join(', ')
    : '';

  return (
    <div className={styles.messagesRoot}>
      <div className={styles.controlRow}>
        {availableProjectUuids.length > 1 && (
          <>
            <label htmlFor="project-message-thread" className={styles.selectLabel}>
              {t(`${T_PATH}.projectLabel`)}
            </label>
            <select
              id="project-message-thread"
              className={styles.select}
              value={selectedProjectUuid || ''}
              onChange={(e) => {
                setSelectedProjectUuid(e.target.value);
                setSelectedApplicationKey(null);
                setMessagesByThread({});
                setNewMessage('');
                setInputError('');
                setProjectMismatchError(false);
              }}
            >
              {availableProjectUuids.map((uuid) => (
                <option key={uuid} value={uuid}>
                  {projectsByUuid.get(uuid)}
                </option>
              ))}
            </select>
          </>
        )}
        {applicationSelectOptions.length > 1 && (
          <>
            <label htmlFor="application-message-thread" className={styles.selectLabel}>
              {t(`${T_PATH}.applicationLabel`)}
            </label>
            <select
              id="application-message-thread"
              className={styles.select}
              value={selectedApplicationKey || ''}
              onChange={handleApplicationChange}
            >
              {applicationSelectOptions.map((application) => (
                <option key={application.value} value={application.value}>
                  {application.label}
                </option>
              ))}
            </select>
          </>
        )}
        <Button variant={ButtonVariant.Secondary} onClick={onRefresh} disabled={isFetching}>
          {t(`${T_PATH}.refresh`)}
        </Button>
      </div>

      {selectedApplication && (
        <div className={styles.applicationInfo}>
          <div className={styles.applicationTitle}>
            {t(`${T_PATH}.applicationTitle`, { applicationId: selectedApplication.applicationId })}
          </div>
          <div className={styles.applicationMeta}>
            {t(`${T_PATH}.applicationProject`)}: {selectedApplication.projectHousingCompany}
          </div>
          <div className={styles.applicationMeta}>
            {t(`${T_PATH}.applicationApartments`)}: {selectedApplication.apartmentNumbers.join(', ')}
          </div>
          <div className={styles.applicationMeta}>
            {t(`${T_PATH}.applicationStatuses`)}: {applicationStateLabel}
          </div>
        </div>
      )}

      {hasDiscoveryError && (
        <Notification type="error" size={NotificationSize.Small}>
          {t(`${T_PATH}.errorDiscoveringApplications`)}
        </Notification>
      )}

      {projectMismatchError && (
        <Notification type="error" size={NotificationSize.Small}>
          {t(`${T_PATH}.errorProjectMismatch`)}
        </Notification>
      )}

      <div className={styles.messagesListWrap}>
        {(isLoading || isFetching) && !messages.length ? (
          <Spinner />
        ) : isFetchBaseQueryError(queryError) && queryError.status === 404 ? (
          <div className={styles.noMessages}>{t(`${T_PATH}.errorNotFound`)}</div>
        ) : isError ? (
          <Notification type="error" size={NotificationSize.Small}>
            {t(`${T_PATH}.errorLoading`)}
          </Notification>
        ) : !messages.length ? (
          <div className={styles.noMessages}>{t(`${T_PATH}.noMessages`)}</div>
        ) : (
          <ul className={styles.messagesList}>
            {messages.map((message) => (
              <li key={message.id} className={styles.messageItem}>
                <div className={styles.messageMeta}>
                  <strong>{t(getSenderLabelKey(message.sender_role))}</strong>
                  <span>{formatMessageDateTime(message.created)}</span>
                </div>
                <div className={cx('hds-text-input__helper-text', styles.messageBody)}>{message.body}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.formWrap}>
        {(!isError || !isFetchBaseQueryError(queryError) || queryError.status !== 404) && (
          <>
            <TextArea
              id="new-reservation-message"
              label={t(`${T_PATH}.newMessageLabel`)}
              value={newMessage}
              onChange={(event) => {
                setInputError('');
                setNewMessage(event.target.value);
              }}
              invalid={Boolean(inputError)}
              errorText={inputError || undefined}
              disabled={isSubmitting}
            />
            <Button disabled={isSubmitting || !newMessage.trim()} onClick={handleSubmit}>
              {t(`${T_PATH}.send`)}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerReservationMessages;
