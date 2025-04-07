import React, { useCallback, useEffect, useState } from 'react';
import moment from 'moment';
import { Button, Combobox, DateInput, IconDownload, Select } from 'hds-react';
import { useTranslation } from 'react-i18next';

import Container from '../common/container/Container';
import { getCurrentLangCode } from '../../utils/getCurrentLangCode';
import { toast } from '../../components/common/toast/ToastManager';
import { useDownloadFile } from '../../utils/useDownloadFile';
import { useFileDownloadApi } from '../../utils/useFileDownloadApi';

import reportStyles from '../../pages/reports/Reports.module.scss';
import styles from './SalesReport.module.scss';
import { SelectOption, Project } from '../../types';
import { useGetProjectsQuery, useGetSelectedProjectsQuery } from '../../redux/services/api';

const T_PATH = 'components.reports.SalesReport';

const SalesReport = (): JSX.Element => {
  const { t } = useTranslation();
  const [isLoadingSalesReport, setIsLoadingSalesReport] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [params, setParams] = useState<URLSearchParams>();

  const { data: projects, isLoading, isError, isSuccess } = useGetProjectsQuery();
  const { data: userSelectedProjects } = useGetSelectedProjectsQuery();

  const [selectedProjects, setSelectedProjects] = useState<SelectOption[]>([]);
  const [selectedProject, setSelectedProject] = useState<SelectOption>();
  const [searchValue, setSearchValue] = useState<string>('');

  const isValidDate = (date: string): boolean => moment(date, 'D.M.YYYY', true).isValid();

  const formattedDate = useCallback((date: string) => {
    if (isValidDate(date)) {
      return moment(date, 'D.M.YYYY', true).format('YYYY-MM-DD');
    }
    return date;
  }, []);

  useEffect(() => {
    const dateObject = {
      start_date: formattedDate(startDate),
      end_date: formattedDate(endDate),
      project_uuids: selectedProjects.map((x) => x.selectValue).join(','),
    };

    // Set new search params
    setParams(new URLSearchParams(dateObject));
    console.log('params', dateObject);
  }, [formattedDate, startDate, endDate, selectedProjects, setParams]);

  const preSalesReportDownloading = () => setIsLoadingSalesReport(true);
  const postSalesReportDownloading = () => setIsLoadingSalesReport(false);

  const onSalesReportLoadError = () => {
    setIsLoadingSalesReport(false);
    toast.show({ type: 'error' });
  };

  const getDefaultValues = (selectedProjects?: Project[]): SelectOption[] => {
    if (!selectedProjects) return [];
    const selectedProjectUuids = selectedProjects?.map((project) => project.uuid);
    return selectOptions().filter((option: SelectOption) => selectedProjectUuids?.includes(option.selectValue));
  };

  const selectOptions = (): SelectOption[] => {
    let options: SelectOption[] = [];

    projects?.forEach((project: Project) => {
      let label = project.street_address;
      const index = options.findIndex((x) => x.label === project.street_address);

      // ComboBox doesn't like duplicate labels
      // these should only appear in the case there are duplicates
      if (index > 0) {
        label = `${project.street_address} #${project.id}`;
      }

      options.push({
        label: label,
        name: 'projectOption',
        selectValue: project.uuid,
      });
    });

    options.sort((a: SelectOption, b: SelectOption) => a.label.localeCompare(b.label));

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

  function handleSelectChange(selected: SelectOption[]): void {
    // console.log('Selected', selected);
    setSelectedProjects(selected);
  }

  function handleSearch(options: SelectOption[], search: string): SelectOption[] {
    const filtered = options.filter((option) => option.label.toLowerCase().includes(search.toLowerCase()));

    // filtered.forEach(x => console.log(x))
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
            variant="primary"
            iconRight={<IconDownload />}
            onClick={download}
            isLoading={isLoadingSalesReport}
            loadingText={t(`${T_PATH}.downloadReport`)}
            className={styles.downloadButton}
            disabled={!isValidDate(startDate) || !isValidDate(endDate) || selectedProjects.length === 0}
          >
            {t(`${T_PATH}.downloadReport`)}
          </Button>
        </span>
      </div>
      <div className={styles.formFields}>
        <span>
          {
            // defaultValue prop is only checked once, ensure its filled with data
            userSelectedProjects !== undefined && projects !== undefined && (
              <Combobox
                multiselect
                required
                label={t(`${T_PATH}.projects`)}
                placeholder="Hae projekteja"
                options={selectOptions()}
                clearButtonAriaLabel="Clear all selections"
                selectedItemRemoveButtonAriaLabel="Remove ${value}"
                onChange={handleSelectChange}
                toggleButtonAriaLabel="Toggle menu"
                filter={handleSearch}
                defaultValue={getDefaultValues(projects)}
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
