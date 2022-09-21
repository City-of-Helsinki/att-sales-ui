import React from 'react';
import cx from 'classnames';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Notification, Tabs } from 'hds-react';

import ApartmentStateFilterSelect from '../../components/apartment/ApartmentStateFilterSelect';
import ApartmentTable from '../../components/apartment/ApartmentTable';
import Breadcrumbs, { BreadcrumbItem } from '../../components/common/breadcrumbs/Breadcrumbs';
import Container from '../../components/common/container/Container';
import ProjectActions from '../../components/project/ProjectActions';
import ProjectCard from '../../components/project/ProjectCard';
import ProjectInstallments from '../../components/installments/ProjectInstallments';
import ProjectOfferMessageForm from '../../components/offer/ProjectOfferMessageForm';
import Spinner from '../../components/common/spinner/Spinner';
import useSessionStorage from '../../utils/useSessionStorage';
import { Project } from '../../types';
import { toast } from '../../components/common/toast/ToastManager';
import { useGetProjectByIdQuery, useStartLotteryForProjectMutation } from '../../redux/services/api';
import { usePageTitle } from '../../utils/usePageTitle';
import { ROUTES } from '../../enums';

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
    defaultValue: '',
    key: `apartmentStateFilter-${projectId || project?.id}`,
  });
  const hasActiveFilters = apartmentStateFilter !== '';

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
        <Notification type="error" size="small" style={{ marginTop: 15 }}>
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
                <ProjectActions project={project} />
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
    </>
  );
};

export default ProjectDetail;
