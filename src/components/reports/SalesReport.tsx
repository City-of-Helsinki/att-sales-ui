import React, { useCallback, useEffect, useState } from 'react';
import moment from 'moment';
import { Button, Combobox, DateInput, IconDownload, Select, Option, ButtonVariant, LoadingSpinner } from 'hds-react';
import { useTranslation } from 'react-i18next';

import Container from '../common/container/Container';
import { getCurrentLangCode } from '../../utils/getCurrentLangCode';
import { toast } from '../../components/common/toast/ToastManager';
import { useDownloadFile } from '../../utils/useDownloadFile';
import { useFileDownloadApi } from '../../utils/useFileDownloadApi';

import reportStyles from '../../pages/reports/Reports.module.scss';
import styles from './SalesReport.module.scss';
import { Project } from '../../types';
import { useGetProjectsQuery, useGetSelectedProjectsQuery } from '../../redux/services/api';

const T_PATH = 'components.reports.SalesReport';

const SalesReport = (): JSX.Element => {
  const { t } = useTranslation();
  const [isLoadingSalesReport, setIsLoadingSalesReport] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [params, setParams] = useState<URLSearchParams>();

  const { data: projects } = useGetProjectsQuery();
  const { data: userSelectedProjects } = useGetSelectedProjectsQuery();

  const [selectedProjects, setSelectedProjects] = useState<Option[]>([]);

  const isValidDate = (date: string): boolean => moment(date, 'D.M.YYYY', true).isValid();

  const formattedDate = useCallback((date: string) => {
    if (isValidDate(date)) {
      return moment(date, 'D.M.YYYY', true).format('YYYY-MM-DD');
    }
    return date;
  }, []);

  const getUrlParams = () => {
    const params = {
      start_date: formattedDate(startDate),
      end_date: formattedDate(endDate),
      project_uuids: selectedProjects.map((x) => x.value).join(','),
    };
    return new URLSearchParams(params);
  };

  useEffect(() => {
    const urlParams = getUrlParams();
    // Set new search params
    setParams(urlParams);
  }, [formattedDate, startDate, endDate, selectedProjects]);

  const preSalesReportDownloading = () => setIsLoadingSalesReport(true);
  const postSalesReportDownloading = () => setIsLoadingSalesReport(false);

  const onSalesReportLoadError = () => {
    setIsLoadingSalesReport(false);
    toast.show({ type: 'error' });
  };

<<<<<<< HEAD
  /**
   * Returns the projects the user selected for their last project
   * if the user hasn't clicked on any of the selections yet.
   * Otherwise return the projects the user has clicked on.
   */
  const getValues = (): SelectOption[] => {

    if (selectedProjects.length > 0) {
      return selectedProjects;
    } else if (userSelectedProjects && userSelectedProjects.length > 0) {
      const selectedProjectUuids = userSelectedProjects?.map((project) => project.uuid);
      const defaultOptions = selectOptions().filter((option: SelectOption) =>
        selectedProjectUuids?.includes(option.selectValue)
      );
      defaultOptions.sort((a: SelectOption, b: SelectOption) => a.label.localeCompare(b.label));
      setSelectedProjects(defaultOptions);
      return defaultOptions;
    }
    return [];
=======
  const getDefaultValues = (): Option[] => {
    if (!userSelectedProjects) return [];
    const selectedProjectUuids = userSelectedProjects?.map((project) => project.uuid);
    const defaultOptions = selectOptions().filter((option: Option) => selectedProjectUuids?.includes(option.value));
    defaultOptions.sort((a: Option, b: Option) => a.label.localeCompare(b.label));
    return defaultOptions;
>>>>>>> 9ee48b7 (ComboBox -> Select)
  };

  const selectOptions = (): Option[] => {
    let options: Option[] = [];

    projects?.forEach((project: Project) => {
      let label = `${project.housing_company} - ${project.street_address}`;
      const index = options.findIndex((x) => x.label === label);

      // ComboBox doesn't like duplicate labels
      // these should only appear in the case there are duplicates
      if (index !== -1) {
        label = `${label} #${project.id}`;
      }

      options.push({
        label: label,
        // name: 'projectOption',
        value: project.uuid,
        disabled: true,
        selected: true,
        isGroupLabel: false,
        visible: true,
      });
    });

    options.sort((a: Option, b: Option) => a.label.localeCompare(b.label));

    return options;
  };

  const getSalesReportFileName = (): string => {
    const prefix = 'myyntiraportti';
    const fileFormat = 'xlsx';
    const dateRange = `_${formattedDate(startDate)}_${formattedDate(endDate)}`;

    return `${prefix}${dateRange}.${fileFormat}`;
  };

  const apiUrl = `/report/?${params}`;

  const {
    download,
    ref: fileRef,
    url: fileUrl,
    name: fileName,
  } = useDownloadFile({
    apiDefinition: useFileDownloadApi(apiUrl),
    getFileName: getSalesReportFileName,
    onError: onSalesReportLoadError,
    postDownloading: postSalesReportDownloading,
    preDownloading: preSalesReportDownloading,
  });

  function handleSelectChange(selected: Option[]): void {
    setSelectedProjects(selected);
  }

  function handleSearch(options: Option[], search: string): Option[] {
    const filtered = options.filter((option) => option.label.toLowerCase().includes(search.toLowerCase()));
    return filtered;
  }

  return (
    <Container wide className={reportStyles.wrapper}>
      <h2>{t(`${T_PATH}.salesReport`)}</h2>
      <p>{t(`${T_PATH}.reportHelpText`)}</p>
      <div className={styles.formFields}>
        <span>
          <DateInput
            disableConfirmation
            id="startDate"
            initialMonth={new Date()}
            label={t(`${T_PATH}.startDate`)}
            language={getCurrentLangCode()}
            onChange={(value) => setStartDate(value)}
            helperText={t(`${T_PATH}.dateFormatHelper`)}
            maxDate={new Date()}
            invalid={!!startDate && !isValidDate(startDate)}
            required
          />
        </span>
        <span>
          <DateInput
            disableConfirmation
            id="endDate"
            initialMonth={new Date()}
            label={t(`${T_PATH}.endDate`)}
            language={getCurrentLangCode()}
            onChange={(value) => setEndDate(value)}
            helperText={t(`${T_PATH}.dateFormatHelper`)}
            maxDate={new Date()}
            invalid={!!endDate && !isValidDate(endDate)}
            required
          />
        </span>
        <span>
          <Button
            variant={ButtonVariant.Primary}
            iconStart={!isLoadingSalesReport ? <IconDownload /> : <LoadingSpinner small />}
            onClick={download}
            // isLoading={isLoadingSalesReport}
            // loadingText={t(`${T_PATH}.downloadReport`)}
            className={styles.downloadButton}
            disabled={!isValidDate(startDate) || !isValidDate(endDate)}
          >
            {!isLoadingSalesReport ? t(`${T_PATH}.downloadReport`) : t(`${T_PATH}.downloadReport`)}
          </Button>
        </span>
      </div>
      <div className={styles.formFields}>
        <span>
          {
            // defaultValue prop is only checked once, ensure its filled with data
            userSelectedProjects !== undefined && projects !== undefined && (
              <Select
                multiSelect
                required
                // label={t(`${T_PATH}.projects`)}
                placeholder={t(`${T_PATH}.searchProjectsPlaceHolder`)}
                options={selectOptions()}
<<<<<<< HEAD
                clearButtonAriaLabel={t(`${T_PATH}.clearButtonAriaLabel`)}
                selectedItemRemoveButtonAriaLabel={t(`${T_PATH}.selectedItemRemoveButtonAriaLabel`)}
                onChange={handleSelectChange}
                toggleButtonAriaLabel={t(`${T_PATH}.toggleButtonAriaLabel`)}
                filter={handleSearch}
                defaultValue={getValues()}
=======
                // clearButtonAriaLabel={t(`${T_PATH}.clearButtonAriaLabel`)}
                // selectedItemRemoveButtonAriaLabel={t(`${T_PATH}.selectedItemRemoveButtonAriaLabel`)}
                onChange={(selected: Option[], clickedOption: Option) => handleSelectChange(selected)}
                // toggleButtonAriaLabel={t(`${T_PATH}.toggleButtonAriaLabel`)}
                // filter={handleSearch}
                // defaultValue={getDefaultValues()}
>>>>>>> 9ee48b7 (ComboBox -> Select)
              />
            )
          }
        </span>
      </div>
      <a href={fileUrl} download={fileName} className="visually-hidden" ref={fileRef}>
        {t(`${T_PATH}.download`)}
      </a>
    </Container>
  );
};

export default SalesReport;
