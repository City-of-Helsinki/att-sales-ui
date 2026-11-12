import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  useUploadApartmentReservationMessageAttachmentMutation,
} from '../../redux/services/api';
import {
  ApartmentReservationMessage,
  CreateReservationMessagePayload,
  CustomerReservation,
  MessageAttachment,
} from '../../types';
import formatDateTime from '../../utils/formatDateTime';
import { downloadAttachmentFile, openAttachmentInNewTab } from '../../utils/attachmentFiles';

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

type NewAttachmentDraft = {
  file_id: number;
  display_name?: string;
  mime_type?: string;
  size_bytes?: number;
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

const formatSizeBytes = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
};

const getDraftAttachmentMeta = (attachment: NewAttachmentDraft): string => {
  return [attachment.mime_type, attachment.size_bytes !== undefined ? formatSizeBytes(attachment.size_bytes) : null]
    .filter(Boolean)
    .join(' - ');
};

// open_url falls back to download_url; legacy payloads with a single link use it for both
const getAttachmentUrls = (attachment: MessageAttachment): { openUrl: string; downloadUrl: string } => {
  const downloadUrl = attachment.download_url || attachment.download || attachment.open_url || '';
  const openUrl = attachment.open_url || downloadUrl;

  return { openUrl, downloadUrl };
};

interface IProps {
  reservations?: CustomerReservation[];
  isLoadingReservations?: boolean;
  initialProjectUuid?: string | null;
  initialReservationId?: number | null;
}

const CustomerReservationMessages = ({
  reservations,
  isLoadingReservations = false,
  initialProjectUuid = null,
  initialReservationId = null,
}: IProps): JSX.Element => {
  const { t } = useTranslation();
  const hasAppliedInitialSelection = useRef(false);
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

    if (
      !hasAppliedInitialSelection.current &&
      initialProjectUuid &&
      availableProjectUuids.includes(initialProjectUuid)
    ) {
      hasAppliedInitialSelection.current = true;
      setSelectedProjectUuid(initialProjectUuid);
      return;
    }

    setSelectedProjectUuid((prev) => {
      if (prev && availableProjectUuids.includes(prev)) {
        return prev;
      }
      return availableProjectUuids[0];
    });
  }, [availableProjectUuids, initialProjectUuid]);

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
  const [draftAttachmentIdInput, setDraftAttachmentIdInput] = useState('');
  const [draftAttachmentIds, setDraftAttachmentIds] = useState<number[]>([]);
  const [draftNewAttachmentFileIdInput, setDraftNewAttachmentFileIdInput] = useState('');
  const [draftNewAttachmentDisplayNameInput, setDraftNewAttachmentDisplayNameInput] = useState('');
  const [draftNewAttachments, setDraftNewAttachments] = useState<NewAttachmentDraft[]>([]);
  const [attachmentIdsError, setAttachmentIdsError] = useState('');
  const [newAttachmentsError, setNewAttachmentsError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Manual file_id input is a secondary dev/admin fallback, hidden by default
  const isManualAttachmentModeEnabled = process.env.REACT_APP_ENABLE_MANUAL_ATTACHMENT_IDS === 'true';
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
    if (!initialReservationId || !applicationOptions.length) {
      return;
    }

    const matchingOption = applicationOptions.find(
      (option) => option.representativeReservationId === initialReservationId
    );
    if (matchingOption && matchingOption.key !== selectedApplicationKey) {
      setSelectedApplicationKey(matchingOption.key);
    }
  }, [applicationOptions, initialReservationId, selectedApplicationKey]);

  useEffect(() => {
    setNewMessage('');
    setInputError('');
    setProjectMismatchError(false);
    setDraftAttachmentIdInput('');
    setDraftAttachmentIds([]);
    setDraftNewAttachmentFileIdInput('');
    setDraftNewAttachmentDisplayNameInput('');
    setDraftNewAttachments([]);
    setAttachmentIdsError('');
    setNewAttachmentsError('');
    setUploadError('');
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
  const [uploadAttachment] = useUploadApartmentReservationMessageAttachmentMutation();
  const isUploading = uploadingFileName !== null;
  const [busyAttachmentAction, setBusyAttachmentAction] = useState<string | null>(null);

  // open_url/download_url are authenticated API endpoints, so they can't be used as plain href links
  const handleAttachmentAction = async (attachment: MessageAttachment, action: 'open' | 'download') => {
    const { openUrl, downloadUrl } = getAttachmentUrls(attachment);
    const actionKey = `${attachment.id}:${action}`;

    setBusyAttachmentAction(actionKey);

    try {
      if (action === 'open') {
        await openAttachmentInNewTab(openUrl);
      } else {
        await downloadAttachmentFile(downloadUrl, attachment.display_name);
      }
    } catch (error) {
      toast.show({ type: 'error', content: t(`${T_PATH}.attachmentFileError`) });
    } finally {
      setBusyAttachmentAction(null);
    }
  };

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
    setAttachmentIdsError('');
    setNewAttachmentsError('');
    setSelectedApplicationKey(event.target.value || null);
  };

  const addAttachmentIdToDraft = () => {
    const nextAttachmentId = Number.parseInt(draftAttachmentIdInput, 10);

    if (!Number.isFinite(nextAttachmentId) || nextAttachmentId <= 0) {
      setAttachmentIdsError(t(`${T_PATH}.attachmentIdInvalidError`));
      return;
    }

    setAttachmentIdsError('');
    setDraftAttachmentIds((prev) => {
      if (prev.includes(nextAttachmentId)) {
        return prev;
      }

      return [...prev, nextAttachmentId];
    });
    setDraftAttachmentIdInput('');
  };

  const addNewAttachmentToDraft = () => {
    const nextFileId = Number.parseInt(draftNewAttachmentFileIdInput, 10);

    if (!Number.isFinite(nextFileId) || nextFileId <= 0) {
      setNewAttachmentsError(t(`${T_PATH}.newAttachmentIdInvalidError`));
      return;
    }

    setNewAttachmentsError('');
    setDraftNewAttachments((prev) => {
      const displayName = draftNewAttachmentDisplayNameInput.trim();
      return [
        ...prev,
        {
          file_id: nextFileId,
          ...(displayName ? { display_name: displayName } : {}),
        },
      ];
    });
    setDraftNewAttachmentFileIdInput('');
    setDraftNewAttachmentDisplayNameInput('');
  };

  const getUploadErrorMessage = (error: unknown): string => {
    if (isFetchBaseQueryError(error)) {
      if (error.status === 422) {
        return t(`${T_PATH}.uploadInvalidFileError`);
      }

      if (error.status === 429) {
        return t(`${T_PATH}.errorTooManyRequests`);
      }

      if (error.status === 401 || error.status === 403 || error.status === 404) {
        return t(`${T_PATH}.uploadUnavailableError`);
      }
    }

    return t(`${T_PATH}.errorTemporary`);
  };

  const handleFilesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    // allow selecting the same file again after removal
    event.target.value = '';

    if (!files.length) {
      return;
    }

    if (!selectedReservationId || !selectedProjectUuid) {
      toast.show({ type: 'error', content: t(`${T_PATH}.errorNoProject`) });
      return;
    }

    setUploadError('');
    setNewAttachmentsError('');

    for (const file of files) {
      setUploadingFileName(file.name);

      try {
        const uploaded = await uploadAttachment({
          reservationId: selectedReservationId,
          projectUuid: selectedProjectUuid,
          file,
        }).unwrap();

        setDraftNewAttachments((prev) => [
          ...prev,
          {
            file_id: uploaded.file_id,
            display_name: uploaded.display_name || file.name,
            mime_type: uploaded.mime_type || file.type || undefined,
            size_bytes: uploaded.size_bytes ?? file.size,
          },
        ]);
      } catch (error) {
        setUploadError(getUploadErrorMessage(error));
        break;
      }
    }

    setUploadingFileName(null);
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

    if (isUploading) {
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
    setAttachmentIdsError('');
    setNewAttachmentsError('');

    try {
      const payload: CreateReservationMessagePayload = {
        body: trimmedMessage,
      };

      if (draftAttachmentIds.length) {
        payload.attachment_ids = draftAttachmentIds;
      }

      if (draftNewAttachments.length) {
        payload.new_attachments = draftNewAttachments.map(({ file_id, display_name }) => ({
          file_id,
          ...(display_name ? { display_name } : {}),
        }));
      }

      const createdMessage = await addMessage({
        reservationId: selectedReservationId,
        projectUuid: selectedProjectUuid,
        ...payload,
      }).unwrap();
      if (currentThreadKey) {
        setMessagesByThread((prev) => ({
          ...prev,
          [currentThreadKey]: [...(prev[currentThreadKey] || []), createdMessage],
        }));
      }
      setNewMessage('');
      setDraftAttachmentIdInput('');
      setDraftAttachmentIds([]);
      setDraftNewAttachmentFileIdInput('');
      setDraftNewAttachmentDisplayNameInput('');
      setDraftNewAttachments([]);
      setAttachmentIdsError('');
      setNewAttachmentsError('');
      setUploadError('');
      await refetch();
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
        const data =
          (error.data as {
            body?: string[];
            detail?: string;
            attachment_ids?: string[];
            new_attachments?: string[];
            invalid_attachments?: string[];
            invalid_new_attachments?: string[];
          }) || undefined;

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

        if (error.status === 422) {
          const hasAttachmentIdsError = Boolean(
            (Array.isArray(data?.attachment_ids) && data?.attachment_ids.length) ||
              (Array.isArray(data?.invalid_attachments) && data?.invalid_attachments.length)
          );
          const hasNewAttachmentsError = Boolean(
            (Array.isArray(data?.new_attachments) && data?.new_attachments.length) ||
              (Array.isArray(data?.invalid_new_attachments) && data?.invalid_new_attachments.length)
          );

          if (hasAttachmentIdsError) {
            setAttachmentIdsError(t(`${T_PATH}.invalidAttachmentsError`));
          }

          if (hasNewAttachmentsError) {
            setNewAttachmentsError(t(`${T_PATH}.invalidNewAttachmentsError`));
          }

          if (hasAttachmentIdsError || hasNewAttachmentsError) {
            return;
          }
        }

        if (error.status === 429) {
          toast.show({ type: 'error', content: t(`${T_PATH}.errorTooManyRequests`) });
          return;
        }

        if (error.status === 401 || error.status === 403 || error.status === 404) {
          toast.show({ type: 'error', content: t(`${T_PATH}.errorAttachmentUnavailable`) });
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
                setAttachmentIdsError('');
                setNewAttachmentsError('');
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
                {message.attachments?.length ? (
                  <ul className={styles.messageAttachmentsList}>
                    {message.attachments.map((attachment) => {
                      const { openUrl, downloadUrl } = getAttachmentUrls(attachment);

                      return (
                        <li key={attachment.id} className={styles.messageAttachmentItem}>
                          <div className={styles.messageAttachmentMeta}>
                            <strong>{attachment.display_name}</strong>
                            <span>
                              {attachment.mime_type} - {formatSizeBytes(attachment.size_bytes)}
                            </span>
                          </div>
                          <div className={styles.messageAttachmentActions}>
                            {openUrl && (
                              <Button
                                variant={ButtonVariant.Secondary}
                                disabled={busyAttachmentAction === `${attachment.id}:open`}
                                onClick={() => handleAttachmentAction(attachment, 'open')}
                              >
                                {t(`${T_PATH}.openAttachment`)}
                              </Button>
                            )}
                            {downloadUrl && (
                              <Button
                                variant={ButtonVariant.Secondary}
                                disabled={busyAttachmentAction === `${attachment.id}:download`}
                                onClick={() => handleAttachmentAction(attachment, 'download')}
                              >
                                {t(`${T_PATH}.downloadAttachment`)}
                              </Button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
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

            <div
              className={cx(styles.attachmentBlock, {
                [styles.attachmentBlockError]: Boolean(uploadError || newAttachmentsError),
              })}
            >
              <div className={styles.attachmentBlockTitle}>{t(`${T_PATH}.attachmentsLabel`)}</div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                hidden
                data-testid="attachment-file-input"
                onChange={handleFilesSelected}
                disabled={isSubmitting || isUploading}
              />
              <div className={styles.attachmentRow}>
                <Button
                  variant={ButtonVariant.Secondary}
                  disabled={isSubmitting || isUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {t(`${T_PATH}.chooseFile`)}
                </Button>
                {isUploading && (
                  <span role="status" className={styles.uploadStatus}>
                    {t(`${T_PATH}.uploading`, { name: uploadingFileName })}
                  </span>
                )}
              </div>
              {isUploading && <div className={styles.uploadProgress} aria-hidden="true" />}
              {draftNewAttachments.length > 0 && (
                <ul className={styles.attachmentDraftList}>
                  {draftNewAttachments.map((attachment, index) => (
                    <li key={`${attachment.file_id}:${index}`} className={styles.attachmentDraftItem}>
                      <span>
                        <strong>{attachment.display_name || `file_id #${attachment.file_id}`}</strong>
                        {getDraftAttachmentMeta(attachment) ? ` (${getDraftAttachmentMeta(attachment)})` : ''}
                      </span>
                      <Button
                        variant={ButtonVariant.Secondary}
                        disabled={isSubmitting || isUploading}
                        onClick={() => {
                          setDraftNewAttachments((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
                          setNewAttachmentsError('');
                        }}
                      >
                        {t(`${T_PATH}.removeAttachment`)}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              {(uploadError || newAttachmentsError) && (
                <div className={styles.attachmentError}>{uploadError || newAttachmentsError}</div>
              )}
            </div>

            {isManualAttachmentModeEnabled && (
              <details className={styles.manualAttachments}>
                <summary>{t(`${T_PATH}.manualAttachmentsSummary`)}</summary>
                <div
                  className={cx(styles.attachmentBlock, {
                    [styles.attachmentBlockError]: Boolean(attachmentIdsError),
                  })}
                >
                  <div className={styles.attachmentBlockTitle}>{t(`${T_PATH}.manualAttachmentIdsLabel`)}</div>
                  <div className={styles.attachmentRow}>
                    <input
                      type="number"
                      min={1}
                      value={draftAttachmentIdInput}
                      className={styles.attachmentInput}
                      onChange={(event) => {
                        setAttachmentIdsError('');
                        setDraftAttachmentIdInput(event.target.value);
                      }}
                      disabled={isSubmitting}
                      placeholder={t(`${T_PATH}.attachmentIdPlaceholder`)}
                    />
                    <Button variant={ButtonVariant.Secondary} disabled={isSubmitting} onClick={addAttachmentIdToDraft}>
                      {t(`${T_PATH}.addAttachment`)}
                    </Button>
                  </div>
                  {draftAttachmentIds.length > 0 && (
                    <ul className={styles.attachmentDraftList}>
                      {draftAttachmentIds.map((attachmentId) => (
                        <li key={attachmentId} className={styles.attachmentDraftItem}>
                          <span>#{attachmentId}</span>
                          <Button
                            variant={ButtonVariant.Secondary}
                            disabled={isSubmitting}
                            onClick={() => {
                              setDraftAttachmentIds((prev) => prev.filter((id) => id !== attachmentId));
                              setAttachmentIdsError('');
                            }}
                          >
                            {t(`${T_PATH}.removeAttachment`)}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {attachmentIdsError && <div className={styles.attachmentError}>{attachmentIdsError}</div>}
                </div>

                <div className={styles.attachmentBlock}>
                  <div className={styles.attachmentBlockTitle}>{t(`${T_PATH}.manualNewAttachmentsLabel`)}</div>
                  <div className={styles.attachmentRow}>
                    <input
                      type="number"
                      min={1}
                      value={draftNewAttachmentFileIdInput}
                      className={styles.attachmentInput}
                      onChange={(event) => {
                        setNewAttachmentsError('');
                        setDraftNewAttachmentFileIdInput(event.target.value);
                      }}
                      disabled={isSubmitting}
                      placeholder={t(`${T_PATH}.newAttachmentIdPlaceholder`)}
                    />
                    <input
                      type="text"
                      value={draftNewAttachmentDisplayNameInput}
                      className={styles.attachmentInput}
                      onChange={(event) => setDraftNewAttachmentDisplayNameInput(event.target.value)}
                      disabled={isSubmitting}
                      placeholder={t(`${T_PATH}.newAttachmentNamePlaceholder`)}
                    />
                    <Button variant={ButtonVariant.Secondary} disabled={isSubmitting} onClick={addNewAttachmentToDraft}>
                      {t(`${T_PATH}.addNewAttachment`)}
                    </Button>
                  </div>
                </div>
              </details>
            )}

            <Button disabled={isSubmitting || isUploading || !newMessage.trim()} onClick={handleSubmit}>
              {t(`${T_PATH}.send`)}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerReservationMessages;
