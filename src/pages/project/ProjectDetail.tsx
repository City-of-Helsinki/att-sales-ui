import cx from 'classnames';
import {
  Button,
  ButtonVariant,
  Dialog,
  IconQuestionCircle,
  Notification,
  NotificationSize,
  RadioButton,
  SelectionGroup,
  Tabs,
} from 'hds-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import ApartmentStateFilterSelect from '../../components/apartment/ApartmentStateFilterSelect';
import ApartmentTable from '../../components/apartment/ApartmentTable';
import Breadcrumbs, { BreadcrumbItem } from '../../components/common/breadcrumbs/Breadcrumbs';
import Container from '../../components/common/container/Container';
import Spinner from '../../components/common/spinner/Spinner';
import { toast } from '../../components/common/toast/ToastManager';
import ProjectInstallments from '../../components/installments/ProjectInstallments';
import ProjectOfferMessageForm from '../../components/offer/ProjectOfferMessageForm';
import ProjectActions from '../../components/project/ProjectActions';
import ProjectCard from '../../components/project/ProjectCard';
import { ApplicantMailingListExportType, ROUTES } from '../../enums';
import { useGetProjectByIdQuery, useStartLotteryForProjectMutation } from '../../redux/services/api';
import { Project } from '../../types';
import { usePageTitle } from '../../utils/usePageTitle';
import useSessionStorage from '../../utils/useSessionStorage';

import { useDownloadFile } from '../../utils/useDownloadFile';
import { useFileDownloadApi } from '../../utils/useFileDownloadApi';
import styles from './ProjectDetail.module.scss';

const T_PATH = 'pages.project.ProjectDetail';

const ProjectDetail = (): JSX.Element | null => {
  const { t } = useTranslation();
  const { projectId } = useParams();
  const {
    data: project,
    isLoading,
    isFetching,
    refetch,
    isError,
    isSuccess,
  } = useGetProjectByIdQuery(projectId || '0');
  const [startLotteryForProject, { isLoading: startLotterIsLoading }] = useStartLotteryForProjectMutation();
  const [apartmentStateFilter, setApartmentStateFilter] = useSessionStorage({
    defaultValue: '-',
    key: `apartmentStateFilter-${projectId || project?.id}`,
  });
  const hasActiveFilters = apartmentStateFilter !== '-';

  const [isMailingListDialogOpen, setIsMailingListDialogOpen] = useState(false);
  const [mailingListReservationType, setMailingListReservationType] = useState(ApplicantMailingListExportType.RESERVED);

  const [isLoadingApplicantsList, setIsLoadingApplicantsList] = useState(false);

  const getApplicantListFileName = (): string => {
    const projectName = project?.housing_company.replace(/\s/g, '-').toLocaleLowerCase();
    const prefix = 'hakijalista';
    const fileFormat = 'csv';

    // Example output: "hakijalista_as-oy-project-x_2022-01-01.pdf"
    return `${prefix}${JSON.stringify(projectName)}${new Date().toJSON().slice(0, 10)}.${fileFormat}`;
  };

  const preApplicantListDownloading = () => setIsLoadingApplicantsList(true);
  const postApplicantListDownloading = () => setIsLoadingApplicantsList(false);

  const onApplicantListLoadError = () => {
    setIsLoadingApplicantsList(false);
    toast.show({ type: 'error' });
  };
  const applicantExportApiUrl = `/projects/${project?.uuid}/export_applicants_mailing_list/${mailingListReservationType}`;
  const {
    download,
    ref: fileRef,
    url: fileUrl,
    name: fileName,
  } = useDownloadFile({
    apiDefinition: useFileDownloadApi(applicantExportApiUrl),
    getFileName: getApplicantListFileName,
    onError: onApplicantListLoadError,
    postDownloading: postApplicantListDownloading,
    preDownloading: preApplicantListDownloading,
  });

  usePageTitle(project?.housing_company ? project.housing_company : t('PAGES.projects'));

  const onStartLotteryClick = async () => {
    if (!startLotterIsLoading) {
      try {
        await startLotteryForProject({ project_uuid: project?.uuid })
          .unwrap()
          .then(() => {
            // Show success toast
            toast.show({ type: 'success' });
            // Refetch project data after form was successfully submitted
            refetch();
          });
      } catch (err) {
        console.error('Failed to post: ', err);
      }
    }
  };

  const breadcrumbAncestors: BreadcrumbItem[] = [
    {
      label: t(`${T_PATH}.projects`),
      path: `/${ROUTES.PROJECTS}`,
    },
  ];

  const handleFilterChangeCallback = (value: string) => {
    setApartmentStateFilter(value);
  };

  if (isLoading) {
    return <Spinner />;
  }

  if (isError) {
    return (
      <Container>
        <Notification type="error" size={NotificationSize.Small} style={{ marginTop: 15 }}>
          {t(`${T_PATH}.errorLoadingProject`)}
        </Notification>
      </Container>
    );
  }

  if (!isSuccess || !project) return null;

  const getFilteredProjects = (): Project['apartments'] => {
    if (hasActiveFilters) {
      return project.apartments.filter((p) => p.state === apartmentStateFilter);
    }
    return project.apartments;
  };

  const downloadApplicantMailingList = () => {
    const onApplicantListLoadError = () => {
      // setIsLoadingApplicantsList(false);
      toast.show({ type: 'error' });
    };

    download();
  };

  return (
    <>
      <Container>
        <Breadcrumbs current={project.housing_company} ancestors={breadcrumbAncestors} />
      </Container>
      {isFetching && (
        <div className={styles.fixedSpinner}>
          <Container className={styles.loadingSpinnerContainer}>
            <Spinner />
          </Container>
        </div>
      )}
      <Container wide className={cx(isFetching && styles.disabled)}>
        <ProjectCard
          project={project}
          showActions
          lotteryOnClick={() => onStartLotteryClick()}
          lotteryLoading={startLotterIsLoading}
        />
        <Tabs>
          <Tabs.TabList className={styles.tabList}>
            <Tabs.Tab>{t(`${T_PATH}.apartments`)}</Tabs.Tab>
            <Tabs.Tab>{t(`${T_PATH}.installments`)}</Tabs.Tab>
            <Tabs.Tab>{t(`${T_PATH}.offerTexts`)}</Tabs.Tab>
          </Tabs.TabList>
          <Tabs.TabPanel>
            <div className={styles.apartmentsWrapper}>
              <div className={styles.actions}>
                <div className={styles.selectWrapper}>
                  {!!project.lottery_completed_at && (
                    <ApartmentStateFilterSelect
                      activeFilter={apartmentStateFilter}
                      handleFilterChangeCallback={handleFilterChangeCallback}
                    />
                  )}
                </div>
                <ProjectActions
                  project={project}
                  handleOpenMailingListDialog={() => setIsMailingListDialogOpen(true)}
                />
              </div>
              <ApartmentTable
                apartments={getFilteredProjects()}
                ownershipType={project.ownership_type.toLowerCase()}
                project={project}
                housingCompany={project.housing_company}
                isLotteryCompleted={!!project.lottery_completed_at}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
          </Tabs.TabPanel>
          <Tabs.TabPanel>
            <div className={styles.installmentsWrapper}>
              <ProjectInstallments
                apartments={getFilteredProjects()}
                uuid={project.uuid}
                ownershipType={project.ownership_type.toLowerCase()}
                barred_bank_account={project.barred_bank_account}
                regular_bank_account={project.regular_bank_account}
              />
            </div>
          </Tabs.TabPanel>
          <Tabs.TabPanel>
            <div className={styles.extraDataWrapper}>
              <ProjectOfferMessageForm uuid={project.uuid} />
            </div>
          </Tabs.TabPanel>
        </Tabs>
      </Container>

      <Dialog
        id="mailing-list-dialog"
        aria-labelledby="mailing-list-dialog-title"
        aria-describedby="mailing-list-dialog-info"
        isOpen={isMailingListDialogOpen}
      >
        <Dialog.Header
          id="mailing-list-dialog-title"
          title={t(`${T_PATH}.createApplicantMailingListTitle`)}
          iconStart={<IconQuestionCircle aria-hidden="true" />}
        />
        <Dialog.Content>
          <div className={styles.checkBoxRow}>
            <SelectionGroup label={t(`${T_PATH}.createApplicantMailingListType`)} required>
              <RadioButton
                id="mailingListReserved"
                label={t(`${T_PATH}.mailingListReserved`)}
                onChange={() => setMailingListReservationType(ApplicantMailingListExportType.RESERVED)}
                checked={mailingListReservationType === ApplicantMailingListExportType.RESERVED}
              />
              <RadioButton
                id="mailingListFirstInQueue"
                label={t(`${T_PATH}.mailingListReservedFirstInQueue`)}
                onChange={() => setMailingListReservationType(ApplicantMailingListExportType.FIRST_IN_QUEUE)}
                checked={mailingListReservationType === ApplicantMailingListExportType.FIRST_IN_QUEUE}
              />
              <RadioButton
                id="mailingListSold"
                label={t(`${T_PATH}.mailingListSold`)}
                onChange={() => setMailingListReservationType(ApplicantMailingListExportType.SOLD)}
                checked={mailingListReservationType === ApplicantMailingListExportType.SOLD}
              />
            </SelectionGroup>
          </div>
        </Dialog.Content>
        <Dialog.ActionButtons>
          <Button onClick={downloadApplicantMailingList} disabled={isLoadingApplicantsList}>
            {t(`${T_PATH}.createApplicantMailingListDownload`)}
          </Button>
          <a href={fileUrl} download={fileName} className="visually-hidden" ref={fileRef}>
            {t(`${T_PATH}.download`)}
          </a>
          <Button
            onClick={() => {
              setIsMailingListDialogOpen(false);
            }}
            variant={ButtonVariant.Secondary}
          >
            {t(`${T_PATH}.createApplicantMailingListCancel`)}
          </Button>
        </Dialog.ActionButtons>
      </Dialog>
    </>
  );
};

export default ProjectDetail;
