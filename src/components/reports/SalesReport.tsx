import React, { useCallback, useEffect, useState } from 'react';
import moment from 'moment';
import { Button, DateInput, IconDownload } from 'hds-react';
import { useTranslation } from 'react-i18next';

import Container from '../common/container/Container';
import { getCurrentLangCode } from '../../utils/getCurrentLangCode';
import { toast } from '../../components/common/toast/ToastManager';
import { useDownloadFile } from '../../utils/useDownloadFile';
import { useFileDownloadApi } from '../../utils/useFileDownloadApi';

import styles from './SalesReport.module.scss';

const T_PATH = 'components.reports.SalesReport';

const SalesReport = (): JSX.Element => {
  const { t } = useTranslation();
  const [isLoadingSalesReport, setIsLoadingSalesReport] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [params, setParams] = useState<URLSearchParams>();

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
    };

    // Set new search params
    setParams(new URLSearchParams(dateObject));
  }, [formattedDate, startDate, endDate, setParams]);

  const preSalesReportDownloading = () => setIsLoadingSalesReport(true);
  const postSalesReportDownloading = () => setIsLoadingSalesReport(false);

  const onSalesReportLoadError = () => {
    setIsLoadingSalesReport(false);
    toast.show({ type: 'error' });
  };

  const getSalesReportFileName = (): string => {
    const prefix = 'myyntiraportti';
    const fileFormat = 'csv';
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

  return (
    <Container wide className={styles.wrapper}>
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
            disabled={!isValidDate(startDate) || !isValidDate(endDate)}
          >
            {t(`${T_PATH}.downloadReport`)}
          </Button>
        </span>
        <a href={fileUrl} download={fileName} className="hiddenFromScreen" ref={fileRef}>
          {t(`${T_PATH}.download`)}
        </a>
      </div>
    </Container>
  );
};

export default SalesReport;
