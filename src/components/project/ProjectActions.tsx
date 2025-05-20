import React, { useState } from 'react';
import { Button, ButtonPresetTheme, ButtonVariant, IconDownload } from 'hds-react';
import { useTranslation } from 'react-i18next';

import { Project } from '../../types';
import { useDownloadFile } from '../../utils/useDownloadFile';
import { useFileDownloadApi } from '../../utils/useFileDownloadApi';
import { toast } from '../common/toast/ToastManager';

import styles from './ProjectActions.module.scss';

const T_PATH = 'components.project.ProjectActions';

interface ProjectActionsProps {
  project: Project;
  handleOpenMailingListDialog: () => void;
}

interface DownloadApplicantsListButtonProps {
  housingCompany: Project['housing_company'];
  projectUuid: Project['uuid'];
}

interface OpenApplicantsMailingListDialogButtonProps {
  housingCompany: Project['housing_company'];
  projectUuid: Project['uuid'];
  handleOpenMailingListDialog: () => void;
}

interface DownloadLotteryResultsButtonProps {
  housingCompany: Project['housing_company'];
  projectUuid: Project['uuid'];
}

const DownloadApplicantsListButton = ({
  housingCompany,
  projectUuid,
}: DownloadApplicantsListButtonProps): JSX.Element => {
  const { t } = useTranslation();
  const [isLoadingApplicantsList, setIsLoadingApplicantsList] = useState<boolean>(false);

  const preApplicantListDownloading = () => setIsLoadingApplicantsList(true);
  const postApplicantListDownloading = () => setIsLoadingApplicantsList(false);

  const onApplicantListLoadError = () => {
    setIsLoadingApplicantsList(false);
    toast.show({ type: 'error' });
  };

  const getApplicantListFileName = (): string => {
    const projectName = housingCompany.replace(/\s/g, '-').toLocaleLowerCase();
    const prefix = 'hakijalista';
    const fileFormat = 'csv';

    // Example output: "hakijalista_as-oy-project-x_2022-01-01.pdf"
    return `${prefix}${JSON.stringify(projectName)}${new Date().toJSON().slice(0, 10)}.${fileFormat}`;
  };

  const applicantExportApiUrl = `/projects/${projectUuid}/export_applicants/`;

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

  return (
    <>
      <Button
        variant={ButtonVariant.Secondary}
        iconEnd={<IconDownload />}
        theme={ButtonPresetTheme.Black}
        onClick={download}
        disabled={isLoadingApplicantsList}
      >
        {t(`${T_PATH}.downloadApplicantList`)}
      </Button>
      <a href={fileUrl} download={fileName} className="visually-hidden" ref={fileRef}>
        {t(`${T_PATH}.download`)}
      </a>
    </>
  );
};

const OpenApplicantsMailingListDialogButton = ({
  housingCompany,
  projectUuid,
  handleOpenMailingListDialog,
}: OpenApplicantsMailingListDialogButtonProps): JSX.Element => {
  const { t } = useTranslation();
  const [isLoadingApplicantsList, setIsLoadingApplicantsList] = useState<boolean>(false);

  const preApplicantListDownloading = () => setIsLoadingApplicantsList(true);
  const postApplicantListDownloading = () => setIsLoadingApplicantsList(false);

  const onApplicantListLoadError = () => {
    setIsLoadingApplicantsList(false);
    toast.show({ type: 'error' });
  };

  const getApplicantListFileName = (): string => {
    const projectName = housingCompany.replace(/\s/g, '-').toLocaleLowerCase();
    const prefix = 'hakijalista';
    const fileFormat = 'csv';

    // Example output: "hakijalista_as-oy-project-x_2022-01-01.pdf"
    return `${prefix}${JSON.stringify(projectName)}${new Date().toJSON().slice(0, 10)}.${fileFormat}`;
  };
  const export_type = 'reserved';
  const applicantExportApiUrl = `/projects/${projectUuid}/export_applicants_mailing_list/${export_type}`;

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

  return (
    <>
      <Button
        variant={ButtonVariant.Secondary}
        iconEnd={<IconDownload />}
        theme={ButtonPresetTheme.Black}
        onClick={handleOpenMailingListDialog}
        disabled={isLoadingApplicantsList}
      >
        {t(`${T_PATH}.downloadApplicantMailingList`)}
      </Button>
      <a href={fileUrl} download={fileName} className="visually-hidden" ref={fileRef}>
        {t(`${T_PATH}.download`)}
      </a>
    </>
  );
};

const DownloadLotteryResultsButton = ({
  housingCompany,
  projectUuid,
}: DownloadLotteryResultsButtonProps): JSX.Element => {
  const { t } = useTranslation();
  const [isLoadingLotteryResults, setIsLoadingLotteryResults] = useState<boolean>(false);

  const preLotteryResultsDownloading = () => setIsLoadingLotteryResults(true);
  const postLotteryResultsDownloading = () => setIsLoadingLotteryResults(false);

  const onLotteryResultsLoadError = () => {
    setIsLoadingLotteryResults(false);
    toast.show({ type: 'error' });
  };

  const getLotteryResultsFileName = (): string => {
    const projectName = housingCompany.replace(/\s/g, '-').toLocaleLowerCase();
    const prefix = 'arvontatulokset';
    const fileFormat = 'csv';

    // Example output: "arvontatulokset_as-oy-project-x_2022-01-01.pdf"
    return `${prefix}${JSON.stringify(projectName)}${new Date().toJSON().slice(0, 10)}.${fileFormat}`;
  };

  const exportLotteryResultsApiUrl = `/projects/${projectUuid}/export_lottery_result/`;

  const {
    download,
    ref: fileRef,
    url: fileUrl,
    name: fileName,
  } = useDownloadFile({
    apiDefinition: useFileDownloadApi(exportLotteryResultsApiUrl),
    getFileName: getLotteryResultsFileName,
    onError: onLotteryResultsLoadError,
    postDownloading: postLotteryResultsDownloading,
    preDownloading: preLotteryResultsDownloading,
  });

  return (
    <>
      <Button
        variant={ButtonVariant.Primary}
        iconEnd={<IconDownload />}
        theme={ButtonPresetTheme.Black}
        onClick={download}
        disabled={isLoadingLotteryResults}
      >
        {t(`${T_PATH}.downloadLotteryResults`)}
      </Button>
      <a href={fileUrl} download={fileName} className="visually-hidden" ref={fileRef}>
        {t(`${T_PATH}.download`)}
      </a>
    </>
  );
};

const ProjectActions = ({ project, handleOpenMailingListDialog }: ProjectActionsProps): JSX.Element => (
  <div>
    <span className={styles.action}>
      <DownloadApplicantsListButton housingCompany={project.housing_company} projectUuid={project.uuid} />
    </span>
    <span className={styles.action}>
      <OpenApplicantsMailingListDialogButton
        housingCompany={project.housing_company}
        projectUuid={project.uuid}
        handleOpenMailingListDialog={handleOpenMailingListDialog}
      />
    </span>
    {!!project.lottery_completed_at && (
      <span className={styles.action}>
        <DownloadLotteryResultsButton housingCompany={project.housing_company} projectUuid={project.uuid} />
      </span>
    )}
  </div>
);

export default ProjectActions;
